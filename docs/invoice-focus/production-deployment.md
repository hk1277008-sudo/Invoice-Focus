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

### API subdomain

The API may use a separate hostname such as `api.invoicefocus.com`. Point that
hostname at the Render/Railway service using the records supplied by that
provider, then use the resulting HTTPS URL as `VITE_API_BASE_URL`.