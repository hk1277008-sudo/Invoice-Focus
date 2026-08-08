# InvoiceFocus production deployment

This project keeps the existing architecture: the Vite frontend is deployed
separately from the Express API, with Supabase providing authentication and
application data.

## Vercel frontend

Create the Vercel project from the repository root (not from
`artifacts/api-server`):

- Framework preset: Vite
- Root directory: repository root (`.`)
- Build command:
  `PORT=18994 BASE_PATH=/ pnpm --filter @workspace/invoice-focus run build`
- Output directory: `artifacts/invoice-focus/dist/public`
- Install command: Vercel's detected pnpm install from the repository root

Configure these browser-safe environment variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` — the public HTTPS URL of the separately hosted API,
  without a trailing slash

`vercel.json` provides the SPA fallback so valid client-side routes continue
to load after a direct refresh. It does not proxy API requests.

## Express API on Render or Railway

Render is the simplest fit for the current standalone Node.js server.

- Build command:
  `pnpm --filter @workspace/api-server run build`
- Start command:
  `pnpm --filter @workspace/api-server run start`
- Port: read the hosting provider's `PORT` environment variable
- Health check: `GET /api/healthz`

Configure these server-only environment variables:

- `PORT`
- `NODE_ENV=production`
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `CLIENT_BASE_URL=https://invoicefocus.com`
- `CORS_ORIGINS=https://invoicefocus.com,https://www.invoicefocus.com`

The service-role key and Resend key must never be added to the frontend or
Vercel environment variables.

## Supabase production redirects

In Supabase Authentication URL Configuration, set the production Site URL to
the chosen canonical frontend domain and add redirect URLs for:

- `https://invoicefocus.com/verify-email`
- `https://invoicefocus.com/reset-password`
- `https://www.invoicefocus.com/verify-email`
- `https://www.invoicefocus.com/reset-password`

The API generates verification and recovery links from `CLIENT_BASE_URL`.
Keep that value as a clean origin with no hash or query string. The frontend
then establishes the recovery session with Supabase before updating the
password.

## Domain

Use `invoicefocus.com` as the canonical domain.

### apex domain (`invoicefocus.com`)

In Vercel → Project → Settings → Domains, add `invoicefocus.com`. Vercel will
display the exact A/AAAA record values to set at your DNS provider. Copy those
values verbatim; they vary by project and must not be guessed.

### www subdomain (`www.invoicefocus.com`)

1. In Vercel → Project → Settings → Domains, add `www.invoicefocus.com` and
   set it to redirect to `invoicefocus.com` (301 permanent).
2. At your DNS provider, add a CNAME record for `www` pointing to
   `cname.vercel-dns.com.` — this is Vercel's standard CNAME target for
   subdomains. If Vercel's dashboard shows a different value, use that instead.

`vercel.json` already includes a `redirects` rule that sends any request
arriving on `www.invoicefocus.com` to `https://invoicefocus.com/` with a 301,
so the redirect is enforced at the edge once the DNS record resolves.

### Verifying the redirect

After DNS propagates (typically a few minutes with Vercel DNS, up to 48 hours
with third-party providers), confirm:

```
curl -sI https://www.invoicefocus.com | grep -E "HTTP|location"
# Expected: HTTP/2 301 (or 308), location: https://invoicefocus.com/
```

### API subdomain (`api.invoicefocus.com`)

The Express API is served from `api.invoicefocus.com`. The steps below wire the
custom domain on Render, add the DNS record, and update the Vercel environment
variable so the frontend always reaches the stable hostname.

#### 1. Add the custom domain on Render

1. Open your Render service dashboard → **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** and enter `api.invoicefocus.com`.
3. Render will display the exact **CNAME target** for the domain — it looks like
   `your-service-name.onrender.com`. Copy it; you'll need it in the next step.
4. Render issues a free TLS certificate automatically once the CNAME is
   resolvable, so no manual certificate upload is needed.

#### 2. Add the CNAME record at your DNS provider

At whichever DNS provider manages `invoicefocus.com` (e.g. Cloudflare, Route 53,
Namecheap), add one CNAME record:

| Type  | Name  | Value (target)                            | TTL  |
|-------|-------|-------------------------------------------|------|
| CNAME | `api` | the Render target from step 1 (no quotes) | Auto |

If your provider asks for a fully-qualified name, use `api.invoicefocus.com.`
(with a trailing dot). Never guess the Render target — copy it verbatim from the
Render dashboard because it is unique to your service.

**Cloudflare note:** if the `invoicefocus.com` zone is on Cloudflare, keep the
proxy status **DNS only** (grey cloud) for `api` so Render can complete its TLS
verification. You can enable the proxy later if you want Cloudflare in front of
the API, but it is not required.

#### 3. Update `VITE_API_BASE_URL` in Vercel

In your Vercel project → **Settings** → **Environment Variables**, set or update:

```
VITE_API_BASE_URL = https://api.invoicefocus.com
```

Redeploy (or trigger a new build) so the frontend picks up the updated value.
The variable is baked into the static bundle at build time, so an existing
deployment will not see the change until you rebuild.

#### 4. Verify end-to-end

After DNS propagates (typically a few minutes with Cloudflare, up to 48 hours
with other providers), confirm the subdomain and health check both work:

```bash
# Confirm the CNAME resolves
dig CNAME api.invoicefocus.com +short
# Expected: your-service-name.onrender.com.

# Confirm the health check returns 200
curl -s https://api.invoicefocus.com/api/healthz
# Expected: {"status":"ok"}
```

If `curl` returns a certificate error, Render's TLS provisioning is still in
progress — wait a few minutes and retry. If the CNAME does not resolve, check
that the record was saved correctly at your DNS provider and that no conflicting
A record exists for the `api` name.