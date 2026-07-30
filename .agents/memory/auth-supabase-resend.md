---
name: Supabase Auth + Resend email caveats
description: Non-obvious constraints when using Supabase Auth with a custom Resend email backend in InvoiceFocus.
---

**Rule:** When sending Supabase Auth confirmation and recovery emails through a custom backend (Resend), generate the email link yourself with Supabase Admin `generateLink`, send auth emails with Resend tracking disabled, and use a reachable deployed origin without a URL fragment.

**Why:** Supabase Auth’s default email flow is replaced by the custom transactional email service. Resend click tracking can rewrite links through a tracking host that is not the deployed application, and a `CLIENT_BASE_URL` fragment such as `/#templates` is not a valid callback base. If deployment metadata reports no active deployment, a custom production domain can fail independently of the application routes.

**How to apply:**

- For `type: 'signup'`, `admin.generateLink` requires the user’s plaintext `password`; resend verification therefore asks the user to re-enter it.
- For `type: 'recovery'`, only the email address is required.
- The frontend must parse query or hash token values and call `supabase.auth.verifyOtp({ token_hash, type: 'email' | 'recovery' })`.
- Resend test mode rejects unverified recipient domains; verify the sending domain and use an allowed `FROM_EMAIL` before production testing.