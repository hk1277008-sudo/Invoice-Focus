# 5. Application Structure

## 5.1 Repository layout

```text
/
├── artifacts/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── lib/
│   │   └── sql/
│   │       ├── 001_invoices.sql
│   │       ├── 002_clients.sql
│   │       ├── 003_settings.sql
│   │       ├── 004_subscriptions.sql
│   │       ├── 005_repair_application_schema.sql
│   │       ├── 006_recurring_invoices.sql
│   │       └── 007_recurring_preferences_notifications.sql
│   ├── invoice-focus/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── providers/
│   │   │   └── App.tsx
│   │   └── vite.config.ts
│   └── mockup-sandbox/
├── lib/
│   ├── api-client-react/
│   ├── api-spec/
│   ├── api-zod/
│   └── db/
├── scripts/
└── docs/
    └── invoice-focus/
```

## 5.2 Frontend pages

### Marketing

- `/`
- `/pricing`
- `/help`
- `/privacy`
- `/terms`
- Additional SaaS placeholder pages

### Authentication

- `/sign-in`
- `/sign-up`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

### Dashboard

- `/dashboard`
- `/dashboard/invoices`
- `/dashboard/clients`
- `/dashboard/recurring`
- `/dashboard/recurring/new`
- `/dashboard/recurring/:id`
- `/dashboard/settings`
- `/dashboard/profile`
- `/dashboard/upgrade`

### Invoice editor

- `/invoice`

## 5.3 Frontend components

### Invoice domain

- `InvoiceEditor`
- `InvoicePreview`
- `useInvoice`
- `useInvoiceDraft`
- `useInvoiceValidation`
- `utils`
- JSON/PDF export modules
- Currency selector and currency catalog

### Recurring domain

- `RecurringInvoiceForm`
- Recurring list/detail pages
- Recurring API client and schedule types

### Subscription domain

- `SubscriptionPlans`
- `UpgradeDialog`
- `UsageIndicator`
- `SubscriptionProvider`

### Shared UI

The `components/ui` directory contains Radix-based primitives including dialogs, dropdowns, forms, tables, tabs, toast, switch, and layout controls.

## 5.4 Hooks and providers

- `useAuth`: consumes `AuthProvider`.
- `use-mobile`: responsive breakpoint helper.
- `use-toast`: shared toast state.
- `AuthProvider`: session initialization, auth state subscription, sign-out, refresh.
- `SubscriptionProvider`: plan load, feature checks, invoice-limit state.

## 5.5 Backend routes

| Module | Responsibility |
|---|---|
| `health.ts` | Liveness response |
| `auth.ts` | Signup, verification, password reset, welcome, avatar |
| `invoices.ts` | Invoice CRUD and duplication |
| `clients.ts` | Client CRUD |
| `dashboard.ts` | Aggregated overview metrics |
| `settings.ts` | User settings, export, account deletion |
| `subscriptions.ts` | Catalog, current plan, preview, usage/feature helpers |
| `recurring-invoices.ts` | Schedule CRUD, lifecycle, scheduler hook |
| `notifications.ts` | Notification list and read state |

## 5.6 Services and utilities

- `recurring-generator.ts`: server-side schedule execution and invoice generation.
- `supabase.ts`: server Supabase service-role client.
- `resend.ts`: Resend client initialization.
- `email.ts`: branded email templates and sending.
- `storage.ts`: avatar upload.
- `logger.ts`: Pino logger configuration.

## 5.7 Data access layer

There is no separate repository/DAO layer in the current implementation. Route modules call the Supabase client directly. This is simple and readable at current scale, but it places validation, authorization, query construction, and response mapping together in route files.

## 5.8 Email layer

The email layer is server-only:

1. Route validates and prepares the operation.
2. Supabase Auth generates a link where required.
3. `email.ts` builds HTML.
4. `resend.ts` sends through Resend.

## 5.9 Naming and data-shape conventions

- Database columns use snake_case.
- Frontend/API settings use camelCase.
- Invoice editor payloads are stored as JSONB and use the editor’s nested shape.
- API route files map between database records and user-facing response envelopes.