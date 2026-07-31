# 7. Roadmap and Architecture Review

## 7.1 Completed capabilities

- Branded InvoiceFocus marketing pages
- Supabase email/password authentication
- Email verification flow
- Password reset flow
- Welcome email flow
- User profile updates
- Avatar upload path
- Invoice create, read, update, duplicate, and delete
- Invoice statuses: Draft, Sent, Paid, Overdue, Cancelled
- Invoice JSONB payload preservation
- Invoice calculations with item-level tax and discount
- Currency support and invoice editor
- PDF/JSON export and print experience
- Client CRUD and user-scoped uniqueness
- Dashboard metrics and revenue/status summaries
- Settings persistence and export
- Account deletion path
- Permanently free product model with unlimited usage
- Guest invoice editing with local draft persistence
- Authenticated cloud saving and account history
- Recurring invoice scheduling and lifecycle
- Time-zone-aware recurring execution
- Recurring defaults in Settings
- Generated invoice status and automatic-generation controls
- Server-side recurring invoice generation
- Generated invoice relationship to recurring schedule
- In-app generated-invoice notifications
- Notification read state
- RLS and user-isolation policies
- Replit workflows and production frontend build

## 7.2 Planned product features suggested by the product direction

Future services may include custom websites, POS systems, business automation,
software development, and digital marketing. These are intentionally separate
from the core free invoicing product.

## 7.3 Extension points

### Notifications

`notifications.type` and `notifications.data` support additional event types. A notification service can later add batching, email/push channels, preferences, and read-all operations.

### Recurring generation

`generateDueRecurringInvoices()` is a clean service boundary. It can be invoked by a managed Edge Function, queue worker, or cron runner. For scale, it can be moved behind a job queue while retaining the same schedule/invoice contract.

### Invoice payload

The summary columns plus JSONB payload permit new editor fields without immediate schema migration. Frequently queried fields should be promoted to typed columns only when query/reporting requirements justify it.

### Client and business entities

The current `user_id` ownership model can evolve toward `organizations`, `memberships`, and role-based access. The recommended migration path is to introduce organization ownership alongside existing user ownership, then backfill and transition policies.

## 7.4 Strengths

- Clear modular monolith boundary with separate frontend and API artifacts.
- Supabase Auth reduces credential and session implementation risk.
- Server-side token validation prevents frontend-only authorization.
- RLS is enabled across application tables.
- User ownership is consistently modeled with `user_id`.
- Invoice usage is enforced atomically by a database function.
- Recurring invoice templates preserve the editor payload.
- Date-only schedule fields avoid accidental timestamp shifts.
- Zod validation is present on critical API inputs.
- The recurring generator is isolated as a service and has deterministic `asOf` support.
- SQL migrations are explicit and reproducible.
- Frontend has feature-specific clients rather than scattering fetch calls throughout pages.

## 7.5 Weaknesses and technical debt

### Authorization duplication

Authentication helpers are repeated across route files, and the API uses a service-role client while relying on application-level ownership predicates. A shared authentication middleware and typed authorization context would reduce drift.

### Broad CORS

`cors()` is enabled without an explicit origin policy. Production should restrict browser origins.

### Route-level data access

Routes directly construct Supabase queries. This makes small features fast to ship but increases testing and maintenance cost as the domain grows.

### Scheduler concurrency

The generator handles invoice-number conflicts, but there is no explicit distributed lock or claim operation around schedules. Overlapping cron invocations should be prevented or made transactionally claim-safe.

### In-memory dashboard aggregation

Dashboard queries load invoice/client rows and aggregate in application memory. This is reasonable for small accounts but should move to SQL aggregation, materialized views, or bounded pagination at scale.

### Large frontend bundle

The production build reports a vendor chunk above 500 kB. Route-level code splitting and dependency chunking should be evaluated.

### Upload hardening

Avatar upload uses in-memory multer storage. Add explicit file-size, MIME, image-dimension, and content validation before treating uploads as production-hardened.

### Error handling consistency

Some routes return generic errors while auth handling can surface error messages. Standardize error envelopes, internal logging, and safe public messages.

### Migration governance

The migrations are clear, but a formal migration ledger, CI schema check, and production apply/verify procedure should be maintained.

## 7.6 Scalability assessment

### Current scale

The architecture is suitable for an early SaaS beta and small-to-moderate tenant workloads.

### Primary scaling risks

- Unbounded list queries for invoices, clients, and dashboard data
- In-memory dashboard calculations
- Direct service-role queries in request handlers
- Recurring schedule scans limited to a fixed batch
- No queue or distributed lock for generation
- Large browser bundle
- Potential email/API rate limits

### Recommended sequence

1. Add pagination and bounded query limits.
2. Add scheduler locking/claiming.
3. Add metrics and error tracking.
4. Extract repositories/services for high-change domains.
5. Move heavy analytics to SQL aggregation or reporting jobs.

## 7.7 QA and verification posture

Verified during this documentation pass:

- Live migration 007 schema visibility
- Settings column persistence with a disposable user
- Notification insert and mark-read behavior
- Cleanup of disposable QA data
- API workflow startup
- Existing typecheck/build status from the current implementation state

Recommended enduring test suites:

- API contract tests for every route
- RLS cross-user isolation tests
- Unlimited authenticated invoice-save tests
- Recurring DST/time-zone boundary tests
- Scheduler replay/idempotency tests
- Email template snapshot tests
- Auth verification and reset integration tests
- Responsive browser tests across mobile/tablet/desktop
- Production smoke test after every migration

## 7.8 Architecture decision summary

The current modular monolith should be retained until actual scale or team boundaries require decomposition. The highest-value improvements are not microservices; they are centralized authorization, bounded queries, scheduler concurrency protection, and stronger operational observability.