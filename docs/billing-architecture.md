# InvoiceFocus Billing Architecture

## Boundaries

InvoiceFocus keeps subscription entitlements in the server-owned `subscriptions`
record. Billing is an independent domain:

- `BillingProvider` — provider adapter for checkout, transaction verification, customer portal, subscription mutations, payment methods, and webhook verification.
- `CheckoutService` — creates a provider checkout session and returns a neutral result.
- `SubscriptionManager` — reads the server-owned subscription state used by provider-backed mutations.
- `InvoiceBillingService` — reads billing overview, payment history, and billing invoices.
- `BillingEventHandler` — translates verified provider events into subscription state and history.

Paddle Billing Sandbox is enabled through the official Node SDK. The API server
resolves active catalog prices by product name and billing interval, then creates
an authenticated Paddle transaction with InvoiceFocus custom data. The browser
opens that transaction in Paddle.js overlay checkout using the client token.

The optional overrides `PADDLE_PRO_MONTHLY_PRICE_ID`,
`PADDLE_PRO_YEARLY_PRICE_ID`, `PADDLE_PREMIUM_MONTHLY_PRICE_ID`, and
`PADDLE_PREMIUM_YEARLY_PRICE_ID` can pin catalog mappings. If an interval is
not present in the Paddle catalog, checkout fails clearly rather than using a
different price. The current Sandbox API key can read existing monthly prices
but does not have permission to create yearly prices, so yearly IDs must be
created in Paddle and supplied through those overrides before yearly checkout
is enabled. The public pricing page and authenticated plan selector consume a
server-owned availability flag; they show only Monthly until both paid yearly
prices resolve to active Paddle catalog entries. This means configuring the
yearly IDs automatically reveals yearly billing without a UI code change.

## Provider integration points

The Paddle adapter in `src/billing/provider.ts` owns checkout, transaction
verification, subscription updates/cancellation/resumption, customer portals,
payment-method reads, and signature verification. Future adapters should be
registered in `getBillingProvider()` and map their events to neutral types:

- Lemon Squeezy: checkout URL, customer portal URL, signed webhook payload,
  subscription/product/variant IDs, and order/refund events.
- Paddle: transaction checkout, customer portal, and `Paddle-Signature` webhook
  verification, mapping transactions/subscriptions to `provider_*` columns.
- Stripe: Checkout Session, Billing Portal, Stripe-Signature verification,
  subscription/invoice/payment-intent events.

No UI or entitlement code should import a provider SDK. Only the provider
adapter should know provider event names, signatures, or IDs.

## Webhook flow

1. Paddle sends `POST /api/paddle/webhook`.
2. The adapter verifies `Paddle-Signature` with `PADDLE_WEBHOOK_SECRET`.
   While `PADDLE_ENV=sandbox`, verification is intentionally skipped only when
   that secret is absent; production rejects unsigned payloads.
3. The event is deduplicated by `(provider, provider_event_id)`.
4. `BillingEventHandler` upserts the server-owned subscription and provider records.
5. Billing transactions, payment methods, and a deduplicated history record are written for the customer timeline.

Provider credentials belong in the environment-secrets flow. Catalog IDs and
webhook verification must be validated before enabling a production adapter.

## Schema rollout

Apply `artifacts/api-server/sql/010_billing_architecture.sql`,
`017_settings_billing_completion.sql`, and `018_billing_idempotency.sql` to the
Supabase project after the application deployment is configured, then reload
the PostgREST schema and verify the billing tables, provider columns, and
unique provider indexes through the Supabase REST OpenAPI document. The
application intentionally does not run DDL at startup.

## Subscription lifecycle

The supported neutral lifecycle is `active`, `trialing`, `past_due`,
`cancelled`, and `incomplete`. Paid plan changes, cancellation, renewal, and
resumption call Paddle against the existing provider subscription. Free is
handled as a scheduled cancellation rather than a second checkout. A completed
checkout return is verified server-side by reading the Paddle transaction,
checking its authenticated custom data, loading the related customer and
subscription, and then synchronizing Supabase.