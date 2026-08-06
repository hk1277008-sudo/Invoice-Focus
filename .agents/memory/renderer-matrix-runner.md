---
name: Renderer matrix runner
description: How to run the InvoiceFocus printable renderer matrix in this workspace
---

The renderer matrix can be run with the workspace package that owns the shared `tsx` executable:

```sh
pnpm --filter scripts exec tsx ../artifacts/invoice-focus/scripts/renderer-matrix.ts
```

**Why:** The invoice-focus package exposes the matrix script but does not currently link `tsx` in its own package executable directory, while the workspace scripts package does.

**How to apply:** Use the workspace command for renderer validation unless the invoice-focus test runner dependency is intentionally added later.