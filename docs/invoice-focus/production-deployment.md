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

Use `invoicefocus.com` as the canonical domain. Add the domain to Vercel and
copy the exact DNS records Vercel provides for the project; those values vary
by Vercel project and must not be guessed. Redirect
`www.invoicefocus.com` to the canonical domain in Vercel/domain settings.

The API may use a separate hostname such as `api.invoicefocus.com`. Point that
hostname at the Render/Railway service using the records supplied by that
provider, then use the resulting HTTPS URL as `VITE_API_BASE_URL`.