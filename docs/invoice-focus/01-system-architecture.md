# 1. System Architecture

## 1.1 High-level overview

```mermaid
flowchart LR
  Browser["Browser / React SPA"] -->|Supabase Auth SDK| Auth["Supabase Auth"]
  Browser -->|Bearer access token / JSON| API["Express API"]
  API -->|auth.getUser(token)| Auth
  API -->|service-role queries and RPCs| DB["Supabase PostgreSQL"]
  API -->|transactional email| Resend["Resend"]
  API -->|avatar upload| Storage["Supabase Storage"]
  Cron["Trusted cron or Supabase Edge Function"] -->|x-recurring-cron-secret| API
  Replit["Replit workflows / deployment"] --> Browser
  Replit --> API
```

The browser is responsible for presentation, interactive editing, local draft state, and export/print UX. The API is the business boundary for cloud invoices, clients, settings, recurring schedules, notifications, and account operations. Supabase is the system of record for identity and synchronized application data.

## 1.2 Frontend architecture

The frontend is a React + TypeScript + Vite single-page application using:

- `wouter` route declarations in `src/App.tsx`
- Context provider for authentication state
- Feature-oriented page and component folders
- Supabase browser client for Auth session operations
- A small typed API-client pattern in `src/lib/*.ts`
- Radix-based UI primitives and Tailwind-compatible styling

The route groups are organizational folders; they do not represent a server-side framework routing layer. Protected dashboard routes are wrapped by `ProtectedRoute`, which redirects unauthenticated users to `/sign-in`.

### Frontend request pattern

1. A page or component calls a feature client such as `lib/invoices.ts`.
2. The client retrieves the current Supabase session.
3. It sends `Authorization: Bearer <access_token>` to `/api/...`.
4. The Express API validates the token and performs the operation.
5. The client converts non-2xx responses into user-facing errors.

## 1.3 Backend architecture

The backend is an Express application:

- `src/index.ts` validates `PORT` and starts the server.
- `src/app.ts` installs Pino HTTP logging, CORS, JSON parsing, URL-encoded parsing, and `/api` routing.
- `src/routes/index.ts` registers all route modules.
- Route modules contain request validation, authentication helpers, Supabase queries, business checks, and response formatting.
- `src/services/recurring-generator.ts` contains recurring invoice generation logic.
- `src/lib/supabase.ts` creates the server-side Supabase client.
- `src/lib/email.ts` and `src/lib/resend.ts` implement transactional email.
- `src/lib/storage.ts` handles avatar upload.

The current backend is a modular monolith rather than a collection of independently deployed services. This is appropriate for the current product size and keeps cross-entity operations close to their authorization rules.

## 1.4 Supabase architecture

Supabase provides:

- `auth.users`: managed user identity, credentials, verification state, and sessions
- PostgreSQL: application tables, constraints, functions, triggers, and RLS
- PostgREST: database API used indirectly by the server-side Supabase client
- Storage: avatar object storage through the server API

The API uses the Supabase service-role client. It therefore explicitly applies `user_id` predicates and validates the bearer token before querying. Database RLS is enabled on application tables as a second isolation boundary.

## 1.5 Authentication flow

### Sign-up and verification

1. The browser submits email, password, and full name to `POST /api/auth/signup`.
2. The API creates a Supabase Auth user with `email_confirm: false`.
3. The API generates a Supabase signup link with a `/verify-email` redirect.
4. The API sends a branded verification email through Resend.
5. The user follows the link and reaches the verification page.
6. The browser uses the Supabase Auth client to exchange/complete the verification flow and receives a session.
7. The authenticated client can call the API and optionally request the welcome email.

The API also exposes a resend-verification operation because the current implementation generates signup links server-side and sends them through the branded email layer.

### Login, session, and logout

- Login is performed by the Supabase browser client.
- `AuthProvider` loads the current session and listens for Supabase auth state changes.
- The API independently validates bearer tokens with `supabaseAdmin.auth.getUser(token)`.
- Logout is performed by the browser Supabase client and clears the local auth state.

### Password reset

1. The browser submits an email to `POST /api/auth/forgot-password`.
2. The API looks up the account without revealing whether an address exists.
3. When applicable, it generates a recovery link.
4. Resend sends a branded reset email.
5. The user lands on `/reset-password`.
6. The browser uses Supabase Auth to update the password.

## 1.6 Email flow

Resend is used for:

- Email verification
- Password reset
- Welcome email

The API requires `RESEND_API_KEY` and `FROM_EMAIL`. Email templates are generated in `src/lib/email.ts` and use InvoiceFocus branding. The application avoids revealing account existence in the forgot-password response.

Invoice delivery and payment-reminder automation are represented as application capabilities. Payment reminders are available across all accounts.

## 1.7 Invoice generation flow

### Interactive invoice creation

1. The user edits invoice data in the browser.
2. Shared invoice utilities calculate totals.
3. The client submits normalized invoice data to `POST /api/invoices`.
4. The API validates the request with Zod.
5. The API inserts the invoice for the authenticated owner.
6. The API returns the persisted invoice.

Invoices store both indexed summary columns and a JSONB `payload` containing the invoice editor data.

### Export and print

The frontend contains PDF/JSON export and print-oriented invoice preview components. These are browser-side presentation/export concerns and do not create a second invoice storage path.

## 1.8 Recurring invoice flow

1. A Pro or Premium user creates a schedule through `POST /api/recurring-invoices`.
2. The schedule stores dates, frequency, time zone, due-date offset, generated status, automatic-generation state, and the invoice template in JSONB.
3. A trusted cron runner or Supabase Edge Function calls `POST /api/internal/recurring-invoices/generate` with the configured secret.
4. The generator selects active schedules due for execution.
5. It calculates the schedule-local current date, creates one or more invoices if late, advances `next_run_date`, and updates generated counts.
6. Generated invoices reference the schedule through `invoices.recurring_invoice_id`.
7. A notification is attempted for each generated invoice.
8. Notification failure is intentionally non-blocking.
9. Completed schedules transition to `completed` after their end date.

The endpoint is scheduler-ready. A cron provider or Edge Function must invoke it; the repository does not contain an independent hosted scheduler.

## 1.10 Dashboard flow

1. The dashboard page requests `GET /api/dashboard/overview`.
2. The API loads user-owned invoices and clients, optionally constrained by date range.
3. It computes status distribution, paid revenue, outstanding amount, revenue series, and client summaries.
4. The frontend renders cards, charts, and recent activity.

Dashboard calculations are currently performed in application memory after loading the filtered rows.

## 1.11 Settings flow

1. The settings page calls `GET /api/settings`.
2. The API returns persisted `user_settings`, mapped from snake_case database columns to camelCase JSON.
3. The user edits business, invoice, notification, appearance, and recurring defaults.
4. The page sends the full settings object to `PUT /api/settings`.
5. The API validates the complete schema and upserts the user-scoped row.
6. `RecurringInvoiceForm` loads recurring defaults when creating a new schedule.

Account profile fields are handled through Supabase Auth, while business and invoice preferences are stored in `user_settings`.