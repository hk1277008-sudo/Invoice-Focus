---
name: Business currency reporting
description: Dashboard, reports, and client financial summaries use one persisted business currency and exclude other invoice currencies without conversion.
---

Reporting must never add or present monetary values from incompatible invoice currencies as one total. The business currency is inferred from the earliest invoice only while the setting remains automatic; the authenticated currency control marks a manual choice that must be preserved.

**Why:** Exchange rates are not stored, so converting foreign-currency invoices would imply accuracy the product cannot guarantee. Exclusion is safer and more transparent.

**How to apply:** Apply the Supabase migration that adds the manual-choice marker before production use. Keep invoice-level currency, invoice payloads, PDFs, shared documents, and recurring invoice amounts independent from reporting currency.