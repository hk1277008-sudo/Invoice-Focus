---
name: Supabase schema cache repair
description: Production Supabase can expose subscription objects while hiding earlier tables from PostgREST after migrations.
---

When tables are created or repaired in the production Supabase project, PostgREST may continue returning `PGRST205` for those tables until its schema cache is reloaded. A successful metadata/head probe is not sufficient: verify real authenticated reads/inserts and confirm the REST OpenAPI definition lists every required table.

**Why:** InvoiceFocus previously had subscription persistence available while invoices, clients, and settings remained invisible to PostgREST, blocking all end-to-end persistence tests.

**How to apply:** Run the idempotent repair migration in the same Supabase project, issue `notify pgrst, 'reload schema'`, then test disposable-user CRUD and JWT-based RLS isolation before declaring production readiness.