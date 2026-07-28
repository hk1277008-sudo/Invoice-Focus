# 4. Authentication, Subscription, and Security

## 4.1 Authentication controls

- Supabase Auth owns credential validation, sessions, verification state, and password recovery.
- The browser uses the Supabase publishable/anonymous client configuration.
- The API validates every authenticated bearer token through Supabase Auth.
- Protected frontend routes redirect unauthenticated users to `/sign-in`.
- User-facing API queries include ownership filters.
- Forgot-password responses are intentionally account-enumeration resistant.
- Passwords are not stored in application tables.

## 4.2 Authorization model

Authorization has three layers:

1. **Frontend route gating:** `ProtectedRoute` controls dashboard access.
2. **API identity validation:** route-level `requireUser` helpers validate the bearer token.
3. **Business and data ownership:** API queries use `user_id` predicates, feature checks, and invoice usage RPCs; PostgreSQL RLS enforces user ownership as defense in depth.

The service-role key is server-only. It must never be embedded in the browser bundle.

## 4.3 Row Level Security

RLS is enabled on:

- `invoices`
- `clients`
- `user_settings`
- `subscriptions`
- `recurring_invoices`
- `notifications`

Most application tables use the standard predicate:

```sql
auth.uid() = user_id
```

The settings and subscriptions tables use `user_id` as their primary key. Cascading foreign keys ensure user deletion removes dependent application records.

## 4.4 Subscription plans

### Free

- Free Forever
- 15 invoices per month
- One business
- Basic templates
- Basic dashboard
- Standard email support
- No recurring invoice mutations

### Pro

- `$9/month` or `$89/year`
- Unlimited invoices and clients
- Recurring invoices
- Advanced templates
- Payment reminders
- Business insights
- Data export
- Priority support

### Premium

- `$19/month` or `$189/year`
- Everything in Pro
- Multiple businesses
- Team collaboration
- Roles and permissions
- Advanced analytics
- API access
- Integrations
- Audit logs
- Dedicated priority support

The catalog is defined in `routes/subscriptions.ts`, while canonical permission JSON is also defined in the database function `subscription_permissions`.

## 4.5 Usage tracking and monthly reset

Usage is server-owned in `subscriptions.invoice_count_this_month`.

The `reserve_invoice_usage` database function:

1. Creates a Free subscription row if the user has no subscription.
2. Locks the subscription row with `FOR UPDATE`.
3. Resets the counter when `last_reset_date` is before the current UTC month.
4. Rejects Free users at 15 invoices.
5. Increments the usage count atomically when permitted.

This prevents concurrent invoice requests from bypassing the monthly limit.

## 4.6 Development-only plan simulation

In non-production environments, `INVOICEFOCUS_DEV_PLAN` may simulate `free`, `pro`, or `premium` responses and feature access. The route explicitly ignores this variable when `NODE_ENV === production`.

This mechanism must not be enabled in production and should be excluded from production deployment configuration.

## 4.7 API security

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
- Add audit logging for account deletion, subscription changes, and privileged operations.

## 4.8 Environment variables and secrets

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
| `INVOICEFOCUS_DEV_PLAN` | Development only | Plan simulation |

Secrets should be managed through Replit Secrets or an equivalent deployment secret manager. They should never be committed, logged, or exposed to client-side code.