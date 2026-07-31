# InvoiceFocus Billing Architecture

## Boundaries

InvoiceFocus keeps subscription entitlements in the server-owned `subscriptions`
record. Billing is an independent domain:

- `BillingProvider` — provider adapter for checkout, customer portal, and webhook verification.
- `CheckoutService` — creates a provider checkout session and returns a neutral result.
- `SubscriptionManager` — applies entitlement-safe subscription changes.
- `InvoiceBillingService` — reads billing overview, payment history, and billing invoices.
- `BillingEventHandler` — translates verified provider events into subscription state and history.

The current provider is intentionally `unconfigured`. It returns a safe
`not_configured` response and never accepts a webhook. Paddle credentials are
present in the environment, but credentials alone do not activate billing:
valid catalog price IDs, hosted-session API calls, and signature verification
must be implemented together before the provider can be registered.

## Future provider integration points

Implement the `BillingProvider` interface in `src/billing/provider.ts`, register
the adapter in `getBillingProvider()`, and map the provider's events to the
neutral event types:

- Lemon Squeezy: checkout URL, customer portal URL, signed webhook payload,
  subscription/product/variant IDs, and order/refund events.
- Paddle: transaction checkout, customer portal, and `Paddle-Signature` webhook
  verification, mapping transactions/subscriptions to `provider_*` columns.
- Stripe: Checkout Session, Billing Portal, Stripe-Signature verification,
  subscription/invoice/payment-intent events.

No UI or entitlement code should import a provider SDK. Only the provider
adapter should know provider event names, signatures, or IDs.

## Webhook flow

1. Provider sends `POST /api/webhooks/billing/:provider`.
2. Adapter verifies the signature and returns a `VerifiedWebhook`.
3. The event is deduplicated by `(provider, provider_event_id)`.
4. `BillingEventHandler` updates the server-owned subscription.
5. A billing history record is written for the customer timeline.

Provider credentials belong in the environment-secrets flow. Catalog IDs and
webhook verification must be validated before enabling a production adapter.

## Schema rollout

Apply `artifacts/api-server/sql/010_billing_architecture.sql` to the Supabase
project after the application deployment is configured, then reload the
PostgREST schema and verify all five billing tables through the Supabase REST
OpenAPI document. The application intentionally does not run DDL at startup.

## Subscription lifecycle

The supported neutral lifecycle is `active`, `trialing`, `past_due`,
`cancelled`, and `incomplete`. Simulated actions are available before a gateway
exists: upgrade, downgrade, cancel, renew, and reactivate. These mutate only
the authenticated user's subscription and are clearly marked simulation mode.