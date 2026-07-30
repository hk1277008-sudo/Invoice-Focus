---
name: Invoice lifecycle status synchronization
description: The invoice row status and JSON payload status must remain aligned across all update paths.
---

Every invoice lifecycle update must synchronize both the persisted row status and `payload.details.status`, including manual transitions, direct edits, sending, payment recalculation, and automatic overdue refresh.

**Why:** The editor, preview, public share page, and PDF read the embedded payload, while dashboard and lifecycle APIs read the row status. Updating only one creates stale badges and inconsistent status views.

**How to apply:** Route all status-changing writes through the shared payload-status normalization helper or equivalent logic, preserve the owner filter on every write, submit editor status changes through one authoritative mutation, and keep post-success refresh failures separate from mutation error handling.

Successful status mutations and follow-up refreshes are separate outcomes: once the mutation returns success, retain the server response, clear stale status errors, and never show a destructive transition toast because a later refresh failed.

**Why:** A details-page refresh was inside the transition mutation `try/catch`, allowing a successful database update to be reported as a failed transition.

**How to apply:** Handle the transition request in its own success/error boundary. Refresh history and related state afterward without rolling back or reclassifying the successful status update.