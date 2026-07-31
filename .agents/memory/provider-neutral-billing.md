---
name: Provider-neutral billing
description: Architecture rule for connecting a future payment gateway without coupling entitlements or UI to provider SDKs.
---

Billing provider adapters should own checkout sessions, customer portals, provider IDs, signature verification, and provider event mapping. Subscription entitlements, feature gating, billing history, and customer-facing UI must depend only on neutral contracts and server-owned subscription state.

**Why:** Paddle credentials exist, but no catalog price IDs or verified adapter flow exists yet; enabling the provider early would create invalid checkout links and unverified webhook risk.

**How to apply:** Add Lemon Squeezy, Paddle, or Stripe only by implementing `BillingProvider` and registering it behind the existing checkout, portal, and webhook services. Do not import provider SDKs into routes, subscription logic, or React components.