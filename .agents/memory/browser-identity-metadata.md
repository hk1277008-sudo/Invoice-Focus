---
name: Browser identity metadata
description: Durable rules for InvoiceFocus browser titles, SEO metadata, and favicon assets
---

Google’s Site Name is `Invoice Focus`, while the browser tab title intentionally remains `Free Invoice Generator`. The static HTML shell and runtime route metadata must preserve that distinction. Public descriptions stay within search-engine limits and private application routes remain non-indexable.

**Why:** The user distinguishes the browser tab label from Google’s search-result Site Name. Google derives Site Name from structured data and other homepage signals rather than simply copying the browser title. Favicon caches can also preserve old artwork unless asset URLs are versioned.

**How to apply:** Keep one description tag, update it without changing the product’s SEO keyword intent, remove duplicate runtime tags, use `noindex, nofollow` for private routes, and version favicon/manifest URLs when the approved brand mark changes.