---
name: Canvas iframe variants
description: A durable constraint for live component variants embedded on the workspace canvas.
---

Canvas iframe metadata only accepts the documented iframe fields; arbitrary custom props can cause the entire update batch to be rejected. When several frames need different initial states of one component, encode the variant in the preview URL query string and let the component read it on mount.

**Why:** A batch of eight live updates was rejected because the iframe payload included an unsupported custom prop, while URL query parameters remained compatible and preserved distinct live variants.

**How to apply:** Keep iframe updates limited to the documented shape fields (`url`, lifecycle `state`, component labels, and supported metadata). Use query parameters for initial template, device, or state selection.