---
name: Settings persistence
description: Settings are stored in a user-owned Supabase record and must be migrated before the Settings UI can save.
---

Settings use one user-scoped Supabase record with RLS, while authentication-sensitive changes stay in Supabase Auth. The settings migration must be applied before authenticated users can persist preferences; account deletion relies on the auth user cascade to remove owned data.

**Why:** This keeps business preferences separate from auth metadata, supports future settings growth, and preserves server-side ownership enforcement.

**How to apply:** Apply the settings migration alongside the invoice and client migrations before testing save, export, or deletion flows in a new environment.