---
name: Workspace UI cleanup boundary
description: Boundary for removing unstable workspace/configuration surfaces without breaking compatibility data or APIs.
---

Remove the entire Settings and Profile experience from the user-facing app: navigation items, routes, pages, tabs, controls, and links. Preserve only internal settings reads required by working onboarding and invoice-default flows; backend fields/endpoints may remain for compatibility.

**Why:** The MVP correction explicitly requires no Settings section or direct Settings/Profile URLs, while existing invoice creation and onboarding still depend on stored defaults.

**How to apply:** Remove Settings/Profile imports, routes, navigation, menus, tabs, controls, and copy. Keep authentication and core invoice flows intact. Treat remaining `lib/settings` calls as internal compatibility only, never as user-facing Settings UI.