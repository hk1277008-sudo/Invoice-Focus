# InvoiceFocus

InvoiceFocus is a permanently free, unlimited invoicing workspace for freelancers, agencies, and service businesses. Guests can create and export invoices immediately; signing in adds cloud saving, history, settings, and synchronized data.

## Run & Operate

- `pnpm --filter @workspace/invoice-focus run dev` — Vite dev server through the configured web workflow
- `pnpm --filter @workspace/invoice-focus run typecheck` — TypeScript check
- `pnpm --filter @workspace/invoice-focus run lint` — ESLint
- `pnpm --filter @workspace/invoice-focus run format` — Prettier format
- `pnpm --filter @workspace/api-server run dev` — shared API server (port 8080, proxied at /api)

## Stack

- React + Vite, TypeScript, and wouter routing
- React 18
- Tailwind CSS 3.4 — custom design system ("Cobalt & Parchment" palette)
- shadcn/ui — base component library, design tokens customized
- Lucide React — icon library
- Radix UI primitives — for accessible headless UI
- ESLint + Prettier — code quality

## Where things live

```
artifacts/invoice-focus/
├── src/
│   ├── app/                    ← marketing, auth, dashboard, and invoice pages
│   ├── components/             ← invoice, recurring, shared, and UI components
│   ├── providers/              ← Supabase authentication context
│   ├── lib/                    ← typed API clients and local draft utilities
│   └── App.tsx                 ← wouter route declarations
├── vite.config.ts              ← artifact base path and dev-server configuration
└── package.json
```

## Design system

**Palette: "Cobalt & Parchment"**
- Background: `hsl(38 22% 97%)` — warm off-white, not pure white
- Foreground: `hsl(222 30% 12%)` — deep navy-black
- Primary: `hsl(224 68% 46%)` — cobalt blue (not generic #3B82F6)
- Secondary: `hsl(160 55% 38%)` — forest emerald (reads as "paid/success")
- Accent: `hsl(38 92% 50%)` — warm amber (for amounts, financial emphasis)
- Border: `hsl(220 14% 89%)` — subtle cool-gray

**Typography**
- Display/headings: Bricolage Grotesque (editorial, distinctive)
- Body/UI: Inter (legible, reliable at small sizes)
- Loaded through the frontend's font configuration and CSS tokens
- Applied as CSS variables `--font-inter` and `--font-bricolage`

**Utilities**
- `label-caps` — small-caps category labels (tracked wide, muted)
- `tabular` — tabular-nums for currency/amount display
- `text-balance`, `text-pretty` — typographic text wrapping

## Architecture decisions

- Route folders organize marketing, auth, dashboard, and invoice concerns; wouter owns the browser routes.
- `(dashboard)` pages live under a `dashboard/` segment inside the group to avoid conflicting with the root `/` owned by `(marketing)`.
- All CSS design tokens are defined as HSL components (without `hsl()`) so Tailwind opacity modifiers work: `bg-primary/60`, `text-foreground/80`.
- `tailwindcss-animate` provides keyframe utilities for `fade-up`, `fade-in`, `accordion-*` animations — ready to use without custom CSS.
- Guest editing stays local until an authenticated user chooses a cloud-backed action.

## User preferences

_Populate as you build._

## Gotchas

- Frontend builds require `PORT` and `BASE_PATH` because `vite.config.ts` reads them during configuration.
- The API liveness route is `/api/healthz` through the proxied workflow.
- Supabase is the InvoiceFocus data source; do not substitute the separate Replit PostgreSQL database.
