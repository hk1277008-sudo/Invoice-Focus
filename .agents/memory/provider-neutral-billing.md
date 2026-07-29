---
name: Provider-neutral billing
description: Architecture rule for connecting a future payment gateway without coupling entitlements or UI to provider SDKs.
---

Billing provider adapters should own checkout sessions, customer portals, provider IDs, signature verification, and provider event mapping. Subscription entitlements, feature gating, billing history, and customer-facing UI must depend only on neutral contracts and server-owned subscription state.

**Why:** InvoiceFocus is not deployed and has no merchant account yet; coupling the existing subscription system to a gateway would create premature credentials, migration, and rollback risk.

**How to apply:** Add Lemon Squeezy, Paddle, or Stripe only by implementing `BillingProvider` and registering it behind the existing checkout, portal, and webhook services. Do not import provider SDKs into routes, subscription logic, or React components.