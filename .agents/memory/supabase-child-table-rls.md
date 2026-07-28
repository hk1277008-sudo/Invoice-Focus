---
name: Supabase child-table RLS
description: Ownership rules for lifecycle child tables referencing user-owned parent records.
---

Child-table policies must validate both `auth.uid() = user_id` and that the referenced parent row belongs to `auth.uid()`. A user-controlled `user_id` field alone does not protect inserts against another user's parent record.

**Why:** A direct authenticated Supabase insert bypassed the API's ownership checks when the child row supplied the attacker's own user ID alongside another user's invoice ID.

**How to apply:** For payments, reminders, activity, email events, and similar children, use `exists` against the parent table in select/insert/update/delete policies and rerun a direct anon-key RLS probe after every migration.