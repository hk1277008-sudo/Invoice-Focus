---
name: Render API build dependencies
description: Dependency classification for the InvoiceFocus API production build on Render.
---

The API build runs its bundler directly during the Render production build, so packages imported by that build script must be installed as regular production dependencies rather than dev-only dependencies.

**Why:** Production dependency installation can omit `devDependencies`; a build script that imports its bundler or build plugins then fails before the API can start.

**How to apply:** When changing the API build toolchain, keep the bundler, build plugins, and any runtime-loaded build transports in `dependencies`, regenerate the workspace lockfile, and verify with the existing filtered API build command.