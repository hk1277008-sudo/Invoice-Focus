# Invoice Focus

A streamlined invoicing and billing tool for freelancers and studios. Currently in scaffold/coming-soon state — no features implemented yet.

## Run & Operate

- `pnpm --filter @workspace/invoice-focus run dev` — Next.js dev server on port 3000
- `pnpm --filter @workspace/invoice-focus run typecheck` — TypeScript check
- `pnpm --filter @workspace/invoice-focus run lint` — ESLint
- `pnpm --filter @workspace/invoice-focus run format` — Prettier format
- `pnpm --filter @workspace/api-server run dev` — shared API server (port 8080, proxied at /api)

## Stack

- Next.js 14.2 — App Router, TypeScript
- React 18.3
- Tailwind CSS 3.4 — custom design system ("Cobalt & Parchment" palette)
- shadcn/ui — base component library, design tokens customized
- Lucide React — icon library
- Radix UI primitives — for accessible headless UI
- ESLint + Prettier — code quality

## Where things live

```
artifacts/invoice-focus/
├── app/
│   ├── layout.tsx              ← root layout (fonts, metadata, globals.css)
│   ├── globals.css             ← design tokens (CSS variables), base resets
│   ├── (marketing)/            ← public-facing route group
│   │   ├── layout.tsx          ← marketing shell (sticky nav, footer)
│   │   └── page.tsx            ← / homepage (coming soon state)
│   ├── (auth)/                 ← auth route group (bare, centered layout)
│   │   ├── layout.tsx
│   │   ├── sign-in/page.tsx    ← /sign-in
│   │   └── sign-up/page.tsx    ← /sign-up
│   └── (dashboard)/            ← app shell route group (sidebar layout)
│       ├── layout.tsx          ← sidebar + topbar
│       └── dashboard/
│           └── page.tsx        ← /dashboard
├── components/
│   ├── ui/                     ← shadcn-managed components (Button, Input, Label)
│   └── shared/
│       └── logo.tsx            ← logomark + wordmark component
├── lib/
│   ├── fonts.ts                ← next/font declarations (Inter + Bricolage Grotesque)
│   └── utils.ts                ← cn(), formatCurrency(), formatDate(), generateInvoiceRef()
├── types/
│   └── index.ts                ← Invoice, Client, User, Workspace, ApiResult types
├── tailwind.config.ts          ← custom palette, font families, radius, animations
├── components.json             ← shadcn config
└── .prettierrc                 ← semi:false, singleQuote:true, tailwindcss plugin
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
- Both loaded via `next/font/google` in `lib/fonts.ts`
- Applied as CSS variables `--font-inter` and `--font-bricolage`

**Utilities**
- `label-caps` — small-caps category labels (tracked wide, muted)
- `tabular` — tabular-nums for currency/amount display
- `text-balance`, `text-pretty` — typographic text wrapping

## Architecture decisions

- Route groups `(marketing)`, `(auth)`, `(dashboard)` isolate layout concerns; each group has its own layout shell. Route groups don't appear in URLs.
- `(dashboard)` pages live under a `dashboard/` segment inside the group to avoid conflicting with the root `/` owned by `(marketing)`.
- All CSS design tokens are defined as HSL components (without `hsl()`) so Tailwind opacity modifiers work: `bg-primary/60`, `text-foreground/80`.
- `tailwindcss-animate` provides keyframe utilities for `fade-up`, `fade-in`, `accordion-*` animations — ready to use without custom CSS.
- Fonts defined in `lib/fonts.ts` (not inline in `layout.tsx`) so they can be imported independently if needed.

## User preferences

_Populate as you build._

## Gotchas

- Do NOT have a `page.tsx` at the root of `(dashboard)/` — it conflicts with `(marketing)/page.tsx` at `/`. Dashboard pages live under `(dashboard)/dashboard/`.
- `tailwind.config.ts` uses `require('tailwindcss-animate')` — ensure the package is installed before running dev.
- Next.js 14 App Router: event handlers (`onSubmit`, `onClick`) cannot be in Server Components. Any interactive form needs `'use client'` or must be extracted to a client component.
