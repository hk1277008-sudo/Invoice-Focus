---
name: InvoiceFocus UI polish system
description: The production UI uses shared primitives and restrained route-level refinements to preserve the existing InvoiceFocus identity.
---

InvoiceFocus should improve consistency through shared primitives first: use the existing cobalt/emerald brand, common radius and shadow tokens, 40px form controls, visible 2px focus rings, rounded status badges, and restrained motion. Route-level pages should add hierarchy with small uppercase section labels, consistent spacing, and purposeful icons rather than decorative effects.

**Why:** The product already had a coherent visual identity and stabilized workflows; a broad visual rewrite would create regression risk and make authenticated, invoice, and marketing surfaces feel less related.

**How to apply:** For future UI work, update shared components and CSS tokens before adding page-specific styles. Preserve auth architecture, invoice print/PDF layout, mobile navigation behavior, and existing business flows unless a confirmed regression requires a change.