---
name: InvoiceFocus brand identity
description: Durable product-brand rules for web assets, metadata, and transactional email.
---

InvoiceFocus product branding uses the user-approved uploaded PNG assets as the source of truth: the horizontal logo for full-brand UI/metadata, the square mark for mark-only surfaces, and the square favicon PNG for all browser/PWA derivatives. The supplied horizontal PNG includes intentional canvas whitespace, so full-logo UI sizing should be width-based. Do not redesign, regenerate, or replace these source assets. The product mark must not be confused with customer-uploaded business logos.

**Why:** The private-beta identity needs to remain consistent across the app, browser/PWA surfaces, metadata, and every transactional email while preserving existing application layout and workflows.

**How to apply:** Route new web branding through the shared Logo component and the approved horizontal/mark assets. Generate square favicon/PWA derivatives directly from the approved square favicon PNG. Route new transactional messages through the existing shared email document shell; use the product mark for the shell and reserve custom logos for invoice sender content only. For authentication emails, attach the PNG inline with a CID and reference that CID once from the centered header. The email sender display name is `Invoice Focus`; this does not change existing template copy or asset filenames.

Authentication email greetings must resolve the authenticated user’s non-empty `full_name`, `display_name`, or `name` metadata server-side, falling back to `Hi there,`; the shared footer contains only the clickable support email and the approved copyright line.

**Why:** Remote website image URLs can become broken-image placeholders in email clients, and client-provided welcome names are not authoritative.

**How to apply:** Keep auth branding in the shared email shell, never use a placeholder or remote logo URL, and derive names from the verified Supabase user rather than the request body.