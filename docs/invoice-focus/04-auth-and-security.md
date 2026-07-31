# 4. Authentication and Security

## 4.1 Authentication controls

- Supabase Auth owns credential validation, sessions, verification state, and password recovery.
- The browser uses the Supabase publishable/anonymous client configuration.
- The API validates every authenticated bearer token through Supabase Auth.
- Protected frontend routes redirect unauthenticated users to `/sign-in` while preserving the intended destination.
- Guests can use the invoice editor, local drafts, templates, branding controls, and exports without authentication.
- User-facing API queries include ownership filters.
- Forgot-password responses are intentionally account-enumeration resistant.
- Passwords are not stored in application tables.

## 4.2 Authorization model

Authorization has three layers:

1. **Frontend route gating:** `ProtectedRoute` controls account-only dashboard access.
2. **API identity validation:** route-level `requireUser` helpers validate bearer tokens.
3. **Business and data ownership:** authenticated API queries use `user_id` predicates; PostgreSQL RLS remains defense in depth.

The service-role key is server-only. It must never be embedded in the browser bundle.

## 4.3 Row Level Security

RLS is enabled on user-owned application tables including invoices, clients,
settings, recurring invoices, notifications, and invoice child tables.

Most application tables use the standard predicate:

```sql
auth.uid() = user_id
```

Child records also validate ownership through their referenced parent where
needed. Account deletion is performed through the trusted API/Auth flow.

## 4.4 API security

Current controls:

- Zod validation for core body/query/path inputs
- UUID validation for resource IDs
- Date and enum validation
- User ownership predicates on reads and writes
- Shared secret for internal recurring scheduler endpoint
- CORS middleware
- Structured request/response logging
- Account-enumeration-resistant reset response
- Service-role credentials kept in backend environment

Recommended hardening:

- Restrict CORS to the production origin instead of broad default CORS.
- Add rate limiting to auth, avatar, and scheduler endpoints.
- Add request-size limits and explicit upload MIME/size validation.
- Replace the shared cron secret with signed requests or an authenticated Edge Function identity.
- Add security headers such as CSP, HSTS, and frame-ancestor policy at the edge.
- Avoid returning raw internal exception messages from auth error handling.
- Add audit logging for account deletion and privileged operations.

## 4.5 Environment variables and secrets

Documented runtime inputs:

| Variable | Scope | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser and API | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Supabase publishable client key |
| `SUPABASE_SERVICE_ROLE_KEY` | API only | Trusted server-side Supabase access |
| `RESEND_API_KEY` | API only | Resend transactional email |
| `FROM_EMAIL` | API | Sender address |
| `CLIENT_BASE_URL` | API | Email callback/base URL |
| `RECURRING_CRON_SECRET` | API only | Internal scheduler authentication |
| `PORT` | Process | Listening port |
| `BASE_PATH` | Frontend build | Vite artifact base path |

Secrets should be managed through Replit Secrets or an equivalent deployment
secret manager. They should never be committed, logged, or exposed to
client-side code.