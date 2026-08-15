---
name: PDF renderer QA
description: Durable guidance for validating the browser-print document renderer
---

The browser-print HTML is the production PDF surface, so real PDF QA should exercise that same generated HTML in Chromium rather than introducing a second PDF engine.

**Why:** A separate PDF implementation can pass isolated tests while drifting from the preview and the browser print/download behavior users actually receive.

**How to apply:** For renderer changes, validate all document/presentation combinations with a real headless print pass, inspect representative PDF pages, and include a deliberately long document to verify pagination and page-break behavior.