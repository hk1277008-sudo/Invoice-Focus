---
name: Document and template rendering
description: InvoiceFocus document types and visual template families share metadata across editor, preview, printable output, and persistence.
---

Document type is content semantics (`invoice`, `receipt`, `estimate`, or `quote`), while visual design is a separate template family (`minimal`, `professional`, or `enterprise`). Legacy template IDs remain readable and map to a family.

**Why:** Preview and PDF previously drifted when terminology and presentation flags were implemented independently, and saved invoices need backward-compatible normalization.

**How to apply:** Add new document labels and presentation changes through the shared metadata/family helpers, preserve the full payload through cloud/local/JSON/recurring paths, and extend the renderer matrix when adding a new combination.