---
name: Independent production deployment
description: The stable hosting split and environment boundary for InvoiceFocus production.
---

**Rule:** Keep the Vite SPA and Express API as separate deployables. Vercel serves the frontend, while Render or Railway runs the API against Supabase. The frontend must use an explicit public API origin in production.

**Why:** The Replit artifact proxy makes relative `/api` calls work locally, but a separately hosted API is unreachable unless browser requests are directed to its public HTTPS URL. Server-only Supabase and email credentials must remain outside the Vercel build.

**How to apply:** Keep `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` browser-safe. Keep `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CLIENT_BASE_URL`, and CORS configuration on the API host. Use `invoicefocus.com` as the canonical frontend origin and `/api/healthz` as the API health check.

**Monorepo constraint:** The repository-root Vercel project must run the invoice-focus workspace build explicitly and publish `artifacts/invoice-focus/dist/public`; a root `dist/public` output path does not contain the SPA.

**Why:** Vercel otherwise builds or serves the wrong workspace output, which can make valid deep links such as `/reset-password` appear to return 404 even when the local SPA handles them correctly.

**How to apply:** Keep the root `vercel.json` build command filtered to `@workspace/invoice-focus`, preserve `PORT`/`BASE_PATH` during the build, and verify the output directory contains `index.html` before publishing.