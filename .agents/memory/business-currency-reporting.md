---
name: Business currency reporting
description: Dashboard, reports, and client financial summaries use one persisted business currency and exclude other invoice currencies without conversion.
---

Reporting must never add or present monetary values from incompatible invoice currencies as one total. The business currency is inferred from the earliest invoice only while the setting remains automatic; the authenticated currency control marks a manual choice that must be preserved. The Supabase schema migration for the manual-choice marker has been applied.

**Why:** Exchange rates are not stored, so converting foreign-currency invoices would imply accuracy the product cannot guarantee. Exclusion is safer and more transparent.

**How to apply:** Keep invoice-level currency, invoice payloads, PDFs, shared documents, and recurring invoice amounts independent from reporting currency. If a new environment is provisioned, apply the reporting-currency Supabase migration before production use.