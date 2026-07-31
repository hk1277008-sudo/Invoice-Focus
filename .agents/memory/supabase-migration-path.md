---
name: Supabase migration path
description: InvoiceFocus application tables live in Supabase; the Replit database SQL tool is a separate database and cannot apply these migrations.
---

Application schema migrations for InvoiceFocus must be applied through the Supabase project migration mechanism, not the Replit-managed PostgreSQL execution tool. The latter may be reachable but does not contain `public.user_settings`, `public.invoices`, or the app's RLS schema.

**Why:** An attempted presentation migration returned `relation "public.user_settings" does not exist` against the Replit database, while the API is configured for Supabase via `VITE_SUPABASE_URL` and the Supabase service-role secret.

**How to apply:** Use the Supabase SQL/migration deployment flow before production use, then apply the forward free-platform cleanup migration and verify the remaining tables through the Supabase API. Reload PostgREST afterward.