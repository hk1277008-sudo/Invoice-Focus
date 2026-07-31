---
name: Subscription system
description: Subscription entitlements and Free invoice usage are server-owned through the subscriptions migration and RPCs.
---

Subscription access is defined centrally by plan permissions. Free invoice creation is atomically reserved server-side, while Paddle checkout and lifecycle mutations synchronize provider state into the server-owned subscription record.

**Why:** Client-only limits are bypassable, and provider callbacks can arrive before or after the browser returns from checkout, so entitlements must be updated only by verified server events or transaction reads.

**How to apply:** Apply the subscription and billing migrations before testing authenticated plan state, usage limits, export gating, or monthly reset behavior. Keep provider IDs and entitlements on the server; never grant paid access from client callbacks alone.