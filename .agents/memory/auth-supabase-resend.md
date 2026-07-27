---
name: Supabase Auth + Resend email caveats
description: Non-obvious constraints when using Supabase Auth with a custom Resend email backend in InvoiceFocus.
---

**Rule:** When sending Supabase Auth confirmation and recovery emails through a custom backend (Resend), you need to generate the email link yourself with the Supabase admin `generateLink` API.

**Why:** Supabase Auth’s default email flow uses Supabase’s own mail provider. To use a custom transactional email service, the backend must generate the confirmation/recovery link and send the email.

**How to apply:**

- For `type: 'signup'`, `admin.generateLink` requires the user’s plaintext `password` as a parameter. This means a “resend verification email” feature must ask the user to re-enter their password; it cannot be done with just the email address.
- For `type: 'recovery'`, only the email address is required.
- The frontend must parse the `token` from the resulting email URL and call `supabase.auth.verifyOtp({ token_hash, type: 'email' | 'recovery' })` to complete the flow.

**Resend test mode:** Resend rejects emails sent to unverified domains (e.g., `example.com`, `gmail.com`) in test mode. To test or send emails in production, verify the sending domain in the Resend dashboard and use an address on that domain as `FROM_EMAIL`.
