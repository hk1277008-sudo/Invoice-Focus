---
name: IndexNow deployment
description: IndexNow notifications run during production Vercel builds and require the public root key file to be live before Bing can validate submissions.
---

IndexNow is wired as a non-blocking Vercel production build step. It reads only canonical public sitemap URLs, compares the previous and current Git revisions, submits current plus removed public URLs in a batch, and skips when no public SEO files changed.

**Why:** The frontend is a static Vite/Vercel deployment, so browser-side notification would expose configuration and could submit private routes. Build-time diffing keeps the integration server-side and aligned with published public content.

**How to apply:** Keep the root verification file and its contents synchronized. The first production deployment after changing the notifier or key must publish the file at the canonical domain before IndexNow can validate the key.