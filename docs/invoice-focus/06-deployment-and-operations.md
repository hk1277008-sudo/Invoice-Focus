# 6. Deployment and Operations

## 6.1 Current Replit architecture

Configured artifacts/workflows:

| Artifact | Workflow | Role |
|---|---|---|
| `artifacts/invoice-focus` | `pnpm --filter @workspace/invoice-focus run dev` | Browser application |
| `artifacts/api-server` | `pnpm --filter @workspace/api-server run dev` | Express API |
| `artifacts/mockup-sandbox` | Component preview server | Design/mockup support |

The frontend artifact is configured for a path-routed web deployment and binds to the configured `PORT`. The API binds to its own configured `PORT`.

## 6.2 Production topology

```text
User browser
   │ HTTPS
   ▼
Replit deployment / custom domain
   ├── Static React/Vite frontend
   └── Express API service
          │ HTTPS
          ├── Supabase Auth/PostgREST/Storage
          └── Resend
```

The exact production hostname is deployment-specific and should be obtained from the Replit deployment configuration rather than inferred from repository names.

## 6.3 Build and start

### Frontend

```bash
pnpm --filter @workspace/invoice-focus run build
```

The Vite configuration requires `PORT` and `BASE_PATH` at config-load time.

### API

```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

The API requires a valid numeric `PORT`.

## 6.4 Database deployment

Apply migrations sequentially to the Supabase project. The current free-product cleanup is `019_free_platform_cleanup.sql`; it removes legacy subscription/billing tables and usage functions. After migrations that add tables or columns, or after this cleanup:

```sql
notify pgrst, 'reload schema';
```

Verification should include:

- PostgREST table/column visibility
- Authenticated insert/read/update/delete probes
- RLS cross-user isolation
- Guest invoice editing and authenticated cloud-save behavior
- Cleanup of disposable QA users and rows

## 6.5 Custom domain, DNS, and SSL

Recommended production process:

1. Add the custom domain in Replit deployment settings.
2. Use the DNS records supplied by Replit exactly.
3. Configure the same public base URL in `CLIENT_BASE_URL`.
4. Add the production callback/redirect URLs in Supabase Auth.
5. Add the sending domain and DNS verification records in Resend.
6. Verify SPF, DKIM, and DMARC for email deliverability.
7. Confirm Replit-managed HTTPS certificate issuance.
8. Test email links, API origin, and browser redirects over HTTPS.

The repository does not contain DNS zone files or certificate configuration; these are managed by Replit, the domain registrar/DNS provider, Supabase Auth configuration, and Resend domain settings.

## 6.6 Recurring scheduler operations

The API exposes a protected internal endpoint. A production scheduler must:

- Run at a suitable cadence, typically daily or more frequently depending on business requirements.
- Send `x-recurring-cron-secret`.
- Optionally pass a controlled `asOf` date for deterministic replay/testing.
- Retry transient failures with bounded backoff.
- Alert on repeated `500` responses.
- Avoid concurrent overlapping runs unless generation locking is added.

The current generator is idempotent for invoice-number conflicts, but scheduler-level concurrency control should still be added before high-volume operation.

## 6.7 Observability

Current observability:

- Pino structured HTTP logging
- API startup logs
- Replit workflow logs
- Browser console visibility during development

Recommended production additions:

- Error tracking with request correlation IDs
- Metrics for invoice creation, usage denials, recurring generation, email failures, and scheduler latency
- Structured audit events for account and privileged operations
- Database monitoring and slow-query inspection
- Alerting on failed migrations, RLS regressions, and cron failures

## 6.8 Backup and recovery

Supabase backup/point-in-time recovery policy should be configured and documented at the project level. The application itself does not implement database backups. Export functionality exists for user data, but it is not a replacement for operational backups.