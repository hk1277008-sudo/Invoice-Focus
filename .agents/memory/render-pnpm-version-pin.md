---
name: Render pnpm version pin
description: Package-manager reproducibility for InvoiceFocus deployment builds.
---

The workspace should declare its pnpm version in the root package manifest so Render uses the same package-manager behavior validated locally against the lockfile.

**Why:** An unpinned package manager leaves dependency installation behavior dependent on the hosting provider's default version, which can invalidate workspace resolution assumptions.

**How to apply:** Keep the root `packageManager` field aligned with the verified pnpm version whenever lockfile or workspace dependency behavior changes.