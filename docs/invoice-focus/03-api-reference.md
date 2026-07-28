# 3. API Reference

## 3.1 Common conventions

Base path: `/api`

Authenticated endpoints require:

```http
Authorization: Bearer <Supabase access token>
Content-Type: application/json
```

Successful JSON responses use resource envelopes such as `{ "invoice": ... }`, `{ "client": ... }`, or `{ "notifications": [...] }`. Deletes return `204 No Content`.

Common errors:

| Status | Meaning |
|---|---|
| `400` | Invalid request data, query, path ID, or business input |
| `401` | Missing, invalid, or expired bearer token |
| `402` | Free invoice usage limit reached |
| `403` | Plan feature is not included |
| `404` | User-owned resource not found |
| `409` | User-scoped uniqueness conflict |
| `500` | Internal persistence or processing failure |
| `503` | Subscription service or dependent service unavailable |

## 3.2 Health

### `GET /api/healthz`

Authentication: none.

Response:

```json
{ "status": "ok" }
```

## 3.3 Authentication endpoints

### `POST /api/auth/signup`

Authentication: none.

Request:

```json
{ "email": "user@example.com", "password": "minimum 8 characters", "fullName": "Ada Example" }
```

Behavior: creates an unverified Supabase user, generates a signup link, and sends branded verification email.

Response:

```json
{ "message": "Account created. Please check your email to verify your account." }
```

Errors: `400` invalid data or duplicate email; `500` Auth/link/email failure.

### `POST /api/auth/resend-verification`

Authentication: none.

Request:

```json
{ "email": "user@example.com", "password": "account password" }
```

Behavior: generates a replacement signup link and sends the verification email.

Errors: `400` invalid credentials/input; `500` link/email failure.

### `POST /api/auth/forgot-password`

Authentication: none.

Request:

```json
{ "email": "user@example.com" }
```

Response intentionally does not reveal whether the account exists:

```json
{ "message": "If an account exists, a password reset email has been sent." }
```

Errors: `400` invalid email; `500` unexpected failure.

### `POST /api/auth/welcome`

Authentication: required.

Request:

```json
{ "email": "user@example.com", "fullName": "Ada Example" }
```

Response: `{ "message": "Welcome email sent." }`

### `POST /api/auth/avatar`

Authentication: required.

Request: `multipart/form-data` with a field named `avatar`.

Response format is the storage helper result returned by the route. Errors include missing/invalid upload and storage failures.

## 3.4 Invoice endpoints

### `GET /api/invoices`

Authentication: required.

Query:

- `search`
- `status`: Draft, Sent, Paid, Overdue, Cancelled
- `sort`: updated, created, issueDate, dueDate, total, invoiceNumber
- `direction`: asc or desc

Response:

```json
{ "invoices": [ /* user-owned invoice summaries */ ] }
```

### `GET /api/invoices/:id`

Authentication: required.

Response:

```json
{ "invoice": { /* persisted invoice including payload */ } }
```

### `POST /api/invoices`

Authentication: required.

Request:

```json
{
  "invoiceNumber": "INV-1001",
  "status": "Draft",
  "issueDate": "2026-07-28",
  "dueDate": "2026-08-27",
  "client": "Client name",
  "company": "Client company",
  "clientId": "uuid-or-null",
  "total": 1250.00,
  "currency": "USD",
  "payload": { "business": {}, "client": {}, "details": {}, "items": [], "additional": {} }
}
```

The usage RPC is reserved before insertion. A Free user exceeding 15 invoices in the current month receives `402` with code `INVOICE_LIMIT_REACHED`.

Response: `201 { "invoice": ... }`.

### `PATCH /api/invoices/:id`

Authentication: required.

Request: any supported subset of the create fields.

Response: `{ "invoice": ... }`.

Errors: validation, ownership/not-found, or persistence errors.

### `POST /api/invoices/:id/duplicate`

Authentication: required.

Behavior: reserves usage, creates a new Draft invoice, and releases usage if insertion fails.

Response: `201 { "invoice": ... }`.

### `DELETE /api/invoices/:id`

Authentication: required.

Response: `204`.

## 3.5 Client endpoints

### `GET /api/clients`

Authentication: required.

Query supports client search/list filters implemented by the route.

Response: `{ "clients": [...] }`.

### `GET /api/clients/:id`

Authentication: required.

Response: `{ "client": ... }`.

### `POST /api/clients`

Authentication: required.

Request fields: `fullName`, `companyName`, `email`, `phone`, `billingAddress`, `city`, `state`, `postalCode`, `country`, `taxId`, and `notes`.

Response: `201 { "client": ... }`.

`409` is returned for the user-scoped duplicate email/company uniqueness constraint.

### `PATCH /api/clients/:id`

Authentication: required.

Request: any supported subset of client fields.

Response: `{ "client": ... }`.

### `DELETE /api/clients/:id`

Authentication: required.

Response: `204`.

## 3.6 Dashboard

### `GET /api/dashboard/overview`

Authentication: required.

Query:

- `start`: ISO date, optional
- `end`: ISO date, optional

Response contains:

```json
{
  "range": { "start": "2026-07-01", "end": "2026-07-31" },
  "stats": {},
  "statusDistribution": [],
  "revenueSeries": [],
  "clientSummaries": [],
  "recentInvoices": []
}
```

The exact computed members are generated by `dashboard.ts`; all rows are restricted to the authenticated user.

## 3.7 Settings

### `GET /api/settings`

Authentication: required.

Response: `{ "settings": { /* camelCase settings object */ } }`.

### `PUT /api/settings`

Authentication: required.

Request includes business, invoice, notification, appearance, and recurring default fields documented in the database section.

Response: `{ "settings": ... }`.

Validation includes URL/email checks, currency length, numeric bounds, theme enum, frequency enum, invoice-status enum, and recurring offset bounds.

### `GET /api/settings/export`

Authentication: required.

Response: downloadable/exportable user settings and related application data as implemented by the route.

### `POST /api/settings/delete-account`

Authentication: required.

Behavior: account deletion operation through the trusted server path. This is destructive and should be treated as an irreversible operation after confirmation in the UI.

## 3.8 Subscriptions

### `GET /api/subscriptions/catalog`

Authentication: none.

Response: `{ "plans": { "free": {}, "pro": {}, "premium": {} } }`.

### `GET /api/subscriptions/me`

Authentication: required.

Response:

```json
{
  "subscription": {
    "plan": "free",
    "planName": "Free",
    "billingCycle": "monthly",
    "status": "active",
    "invoiceCountThisMonth": 0,
    "invoiceLimit": 15,
    "invoiceRemaining": 15,
    "featurePermissions": {},
    "catalog": {}
  }
}
```

### `POST /api/subscriptions/preview`

Authentication: required.

Request:

```json
{ "plan": "pro", "billingCycle": "monthly" }
```

Response includes selected plan, billing cycle, price, `paymentRequired`, and `checkoutReady`.

This is a preview boundary; no payment transaction is created by this route.

## 3.9 Recurring invoices

### `GET /api/recurring-invoices`

Authentication: required. Free users may list/view schedules.

Query supports search, status, sort, and direction as implemented by the route.

Response: `{ "recurringInvoices": [...] }`.

### `GET /api/recurring-invoices/:id`

Authentication: required.

Response: `{ "recurringInvoice": ... }`.

### `POST /api/recurring-invoices`

Authentication: required; Pro or Premium.

Request fields:

- `client_id`
- `client_name`
- `frequency`
- `interval_count`
- `start_date`
- `end_date`
- `next_run_date`
- `timezone`
- `due_date_offset`
- `auto_invoice_number`
- `auto_generation`
- `invoice_status`
- `template_data`

`template_data.items` must contain at least one item. Dates and schedule bounds are validated.

Response: `201 { "recurringInvoice": ... }`.

### `PATCH /api/recurring-invoices/:id`

Authentication: required; Pro or Premium.

Request: partial recurring schedule fields. Merged date constraints are validated against the stored schedule.

Response: `{ "recurringInvoice": ... }`.

### `POST /api/recurring-invoices/:id/pause`

Authentication: required; Pro or Premium.

Response: `{ "recurringInvoice": ... }`.

### `POST /api/recurring-invoices/:id/resume`

Authentication: required; Pro or Premium.

Response: `{ "recurringInvoice": ... }`.

### `POST /api/recurring-invoices/:id/cancel`

Authentication: required; Pro or Premium.

Response: `{ "recurringInvoice": ... }`.

### `POST /api/recurring-invoices/:id/duplicate`

Authentication: required; Pro or Premium.

Behavior: creates a fresh active schedule with zero generated count.

Response: `201 { "recurringInvoice": ... }`.

### `DELETE /api/recurring-invoices/:id`

Authentication: required; Pro or Premium.

Response: `204`.

### `POST /api/internal/recurring-invoices/generate`

Authentication: shared-secret scheduler authentication, not a user bearer token.

Required header:

```http
x-recurring-cron-secret: <RECURRING_CRON_SECRET>
```

Optional body:

```json
{ "asOf": "2026-07-28" }
```

Response:

```json
{ "generated": [ { "recurringInvoiceId": "...", "invoiceId": "..." } ] }
```

Errors: `401` invalid scheduler credentials; `500` generation failure.

## 3.10 Notifications

### `GET /api/notifications`

Authentication: required.

Response: `{ "notifications": [...] }`.

### `POST /api/notifications/:id/read`

Authentication: required.

Behavior: marks the user-owned notification as read.

Response: `{ "notification": ... }`.