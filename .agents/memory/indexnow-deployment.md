---
name: IndexNow deployment
description: IndexNow notifications run during production Vercel builds; Yandex accepts submissions but Bing requires separate Bing Webmaster Tools verification.
---

IndexNow is wired as a non-blocking Vercel production build step. It reads only canonical public sitemap URLs, compares the previous and current Git revisions, submits current plus removed public URLs in a batch, and skips when no public SEO files changed.

**Why:** The frontend is a static Vite/Vercel deployment, so browser-side notification would expose configuration and could submit private routes. Build-time diffing keeps the integration server-side and aligned with published public content.

**Multi-endpoint fan-out:** The script submits to each endpoint in DEFAULT_ENDPOINTS independently (currently Yandex and Bing). A success from any one endpoint is sufficient — the script only throws if ALL endpoints reject. Yandex (yandex.com/indexnow) accepts submissions with HTTP 202. Bing (bing.com/indexnow) returns HTTP 403 UserForbiddedToAccessSite until the site is verified in Bing Webmaster Tools — that is expected and logged as a warning, not a fatal error.

**Bing fix path:** Register invoicefocus.com in Bing Webmaster Tools (https://www.bing.com/webmasters). Once the site is verified there, Bing will accept IndexNow submissions automatically without any code change, because the script already includes bing.com/indexnow in DEFAULT_ENDPOINTS.

**How to apply:** Keep the root verification file and its contents synchronized. The first production deployment after changing the notifier or key must publish the file at the canonical domain before any endpoint can validate the key.
