---
name: Browser identity metadata
description: Durable rules for InvoiceFocus browser titles, SEO metadata, and favicon assets
---

The browser/PWA identity is `Invoice Focus`. The static HTML shell and the runtime route metadata must use that identity consistently, while public descriptions stay within search-engine limits and private application routes remain non-indexable.

**Why:** Browser identity is read from the HTML title and icon links, while SPA crawlers and route transitions can observe different metadata states. Favicon caches can also preserve old artwork unless asset URLs are versioned.

**How to apply:** Keep one description tag, update it without changing the product’s SEO keyword intent, remove duplicate runtime tags, use `noindex, nofollow` for private routes, and version favicon/manifest URLs when the approved brand mark changes.