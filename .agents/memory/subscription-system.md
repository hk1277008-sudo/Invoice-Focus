---
name: Subscription system
description: Subscription entitlements and Free invoice usage are server-owned through the subscriptions migration and RPCs.
---

Subscription access is defined centrally by plan permissions. Free invoice creation is atomically reserved server-side, while paid-plan checkout remains a preview-only boundary until a payment provider is connected.

**Why:** Client-only limits are bypassable, and payment-provider state should not be coupled to entitlement checks before billing is implemented.

**How to apply:** Apply the subscription migration before testing authenticated plan state, usage limits, export gating, or monthly reset behavior. Connect future billing webhooks to the existing subscription record rather than adding client-side plan overrides.