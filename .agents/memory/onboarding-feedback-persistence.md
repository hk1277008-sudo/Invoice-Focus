---
name: Onboarding and feedback persistence
description: Onboarding progress and feedback are server-owned Supabase data, with screenshots stored in Supabase Storage.
---

Onboarding state and feedback must be migrated and verified in the external Supabase project before the authenticated flows are considered beta-ready. Feedback screenshots use a dedicated public storage bucket and feedback rows store only the resulting URL plus normalized metadata.

**Why:** The frontend can render and the API can compile without the external schema, but authenticated onboarding saves, feedback submissions, and screenshot uploads will fail until PostgREST sees the new columns/table and Storage bucket.

**How to apply:** Apply the onboarding/feedback migration to Supabase, reload the PostgREST schema cache, confirm the `feedback` table and onboarding columns are visible, then run authenticated GET/PUT onboarding, feedback submission, and screenshot upload smoke tests.