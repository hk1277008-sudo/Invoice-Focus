---
name: Settings persistence
description: Settings are stored in a user-owned Supabase record and must be migrated before the Settings UI can save.
---

Settings use one user-scoped Supabase record with RLS, while authentication-sensitive changes stay in Supabase Auth. The settings migration must be applied before authenticated users can persist preferences; account deletion relies on the auth user cascade to remove owned data.

**Why:** This keeps business preferences separate from auth metadata, supports future settings growth, and preserves server-side ownership enforcement.

**How to apply:** Apply the settings migration alongside the invoice and client migrations before testing save, export, or deletion flows in a new environment.

The settings client should replace its local form state with the server’s normalized response after every successful save, rather than assuming the submitted object is the persisted representation.

**Why:** Server-side entitlement checks and normalization can change the accepted presentation or preference values; keeping the submitted state can make the UI disagree with the next reload.

**How to apply:** Treat the saved response as authoritative for settings UI state, invoice defaults, and theme behavior.

When adding a preference, update its client defaults/types, API validation and column map, Supabase migration, and every global consumer together.

**Why:** A preference can appear to save successfully while failing on reload or only applying inside the Settings screen if one layer is missing.

**How to apply:** Treat settings additions as a cross-layer change and verify a save/reload round trip before beta release.