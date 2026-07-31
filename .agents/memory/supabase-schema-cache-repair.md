---
name: Supabase schema cache repair
description: Supabase PostgREST schema cache can lag behind application migrations and cleanup operations.
---

When tables are created or repaired in the production Supabase project, PostgREST may continue returning `PGRST205` for those tables until its schema cache is reloaded. A successful metadata/head probe is not sufficient: verify real authenticated reads/inserts and confirm the REST OpenAPI definition lists every required table.

**Why:** PostgREST schema visibility can lag behind database changes, which makes a successful SQL migration look broken to the API until the cache is reloaded.

**How to apply:** Run migrations in the same Supabase project, issue `notify pgrst, 'reload schema'`, then test disposable-user CRUD and JWT-based RLS isolation before declaring production readiness.