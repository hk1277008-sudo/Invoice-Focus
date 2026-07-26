---
name: Invoice Focus build env vars
description: How to run the Invoice Focus production build outside the managed workflow.
---

`artifacts/invoice-focus/vite.config.ts` throws at config-load time if `PORT` or `BASE_PATH` are missing:

```ts
const rawPort = process.env.PORT;
if (!rawPort) throw new Error('PORT environment variable is required...');
const basePath = process.env.BASE_PATH;
if (!basePath) throw new Error('BASE_PATH environment variable is required...');
```

**Why:** The config is read before Vite injects any env logic, so the variables must be present in the shell environment.

**How to apply:** When running `pnpm run build` manually, export both variables first:

```bash
cd artifacts/invoice-focus
PORT=18994 BASE_PATH=/ pnpm run build
```

`PORT` is ignored for static production builds but must be a valid positive number. `BASE_PATH` must match the artifact's configured preview path (currently `/`).
