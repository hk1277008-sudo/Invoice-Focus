---
name: InvoiceFocus brand identity
description: Durable product-brand rules for web assets, metadata, and transactional email.
---

InvoiceFocus product branding uses the user-approved uploaded PNG assets as the source of truth: the horizontal logo for full-brand UI, metadata, and transactional email shells, the square mark for mark-only surfaces, and the square favicon PNG for all browser/PWA derivatives. The supplied horizontal PNG includes intentional canvas whitespace and may arrive as an opaque RGB image, so full-logo UI sizing should be width-based and any public UI/metadata/email derivative must remove only the connected near-white canvas while preserving the artwork. Do not redesign, regenerate, or replace the source artwork. The product mark must not be confused with customer-uploaded business logos.

**Why:** The private-beta identity needs to remain consistent across the app, browser/PWA surfaces, metadata, and every transactional email while preserving existing application layout and workflows.

**How to apply:** Route new web branding through the shared Logo component and the approved horizontal/mark assets. Validate the horizontal asset's alpha channel and page-background contrast before shipping; if its canvas is opaque, create a transparent public derivative with a conservative connected flood-fill, never a global color replacement. Generate square favicon/PWA derivatives directly from the approved square favicon PNG. Route all transactional messages through the existing shared email document shell with the horizontal logo attached inline via a CID; reserve customer-uploaded logos for invoice sender content only. The email sender display name and browser/PWA display name are `Invoice Focus`; this does not change existing template copy, domain, or asset filenames.

**Why:** The uploaded horizontal file was RGB with a near-white canvas, which rendered as a visible rectangle against InvoiceFocus's warm page background even though the source artwork itself was correct.

Authentication email greetings must resolve the authenticated user’s non-empty `full_name`, `display_name`, or `name` metadata server-side, falling back to `Hi there,`; the shared footer contains only the clickable support email and the approved copyright line.

**Why:** Remote website image URLs can become broken-image placeholders in email clients, and client-provided welcome names are not authoritative.

**How to apply:** Keep auth branding in the shared email shell, never use a placeholder or remote logo URL, and derive names from the verified Supabase user rather than the request body.