---
name: Provider-neutral billing
description: Architecture rule for connecting Paddle without coupling entitlements or UI to provider SDKs.
---

Billing provider adapters should own checkout sessions, completed-transaction verification, customer portals, provider IDs, subscription mutations, payment-method reads, signature verification, and provider event mapping. Subscription entitlements, feature gating, billing history, and customer-facing UI must depend only on neutral contracts and server-owned subscription state.

**Why:** Paddle checkout and webhooks are provider-specific, while subscription access must remain server-owned and safe if a catalog interval or webhook configuration is missing.

**How to apply:** Keep Paddle SDK calls in the adapter, resolve only active catalog prices, reject missing intervals instead of guessing, and allow unsigned webhook payloads only in Sandbox until `PADDLE_WEBHOOK_SECRET` is configured. Do not import provider SDKs into routes, subscription logic, or React components.