---
name: Cloning as design inspiration
description: How to clone a third-party site when the goal is to rebuild the user's own branded app.
---

When a user asks to clone a third-party site as "design inspiration" for an existing app:

1. **Extract structure and copy** from the source site (HTML, screenshots, navigation, footer links, value propositions).
2. **Do not replace the whole CSS stack** if the target app already has a design system. Adapt the extracted layout and content to the existing tokens, utilities, and components.
3. **Replace all branding** — logos, brand names, product names, social links, and contact info — with the user's own app branding.
4. **Map equivalent page sections** to the existing component structure rather than creating a brand-new standalone clone.

**Why:** The legitimate-use policy allows non-owned cloning for inspiration, but the result must be the user's own product, not a deceptive copy.

**How to apply:** In this project, Invoice Focus already has a Tailwind v4 "Cobalt & Parchment" design system, Wouter routes, and a marketing-page skeleton. Reuse those and adapt the source site's content into the existing section components.
