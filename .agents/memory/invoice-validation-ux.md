---
name: Invoice validation UX
description: Product decision for when invoice form validation should become visible.
---

InvoiceFocus keeps required-field validation quiet while users are filling out an invoice. Validation becomes visible only after a user attempts an output action such as PDF download, JSON export, or print; completing the missing fields removes the messages automatically.

**Why:** Showing red errors during normal data entry creates unnecessary friction and makes the editor feel broken before the user has attempted to finish.

**How to apply:** Keep field-level messages attached to the relevant editor controls, but gate their visibility behind an explicit output-action attempt. Do not disable the output controls before the attempt, because the action is what reveals the guidance.