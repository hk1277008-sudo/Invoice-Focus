---
name: Workspace UI cleanup boundary
description: Boundary for removing unstable workspace/configuration surfaces without breaking compatibility data or APIs.
---

Remove nonfunctional Workspace and Configuration surfaces from the user-facing app, but preserve existing backend fields and endpoints when they may still support stored settings or older clients.

**Why:** The cleanup requirement is user-facing and destructive backend removal could invalidate existing settings data or compatibility paths without providing user value.

**How to apply:** Remove navigation, tabs, routes, controls, and misleading copy first. Revisit backend/schema removal only after confirming no active callers, stored-data dependency, or migration requirement remains.