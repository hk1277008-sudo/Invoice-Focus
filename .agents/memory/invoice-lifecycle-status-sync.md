---
name: Invoice lifecycle status synchronization
description: The invoice row status and JSON payload status must remain aligned across all update paths.
---

Every invoice lifecycle update must synchronize both the persisted row status and `payload.details.status`, including manual transitions, direct edits, sending, payment recalculation, and automatic overdue refresh.

**Why:** The editor, preview, public share page, and PDF read the embedded payload, while dashboard and lifecycle APIs read the row status. Updating only one creates stale badges and inconsistent status views.

**How to apply:** Route all status-changing writes through the shared payload-status normalization helper or equivalent logic, and preserve the owner filter on every write.