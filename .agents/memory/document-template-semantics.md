---
name: Document template semantics
description: Durable rules for InvoiceFocus document-type-specific fields and rendering
---

Invoice, receipt, quote, estimate, credit note, and purchase order share the persisted invoice payload, but each document type owns its own labels, metadata, and supporting sections. Document-specific fields must remain optional so older saved drafts and invoices continue to load.

**Why:** The application persists invoice payloads as JSON and uses the same live preview, printable export, recurring editor, share view, and import/export flows. Separate document models or renderer-only fields would cause compatibility and output drift.

**How to apply:** Add new document semantics to the shared document metadata and normalized optional document-details object, then update both `InvoicePreview` and `pdf-export` together. Extend the renderer matrix whenever a document type or template family changes.