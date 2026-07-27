import { ArrowRight } from 'lucide-react'

function TemplateMiniPreview({ accent }: { accent: string }) {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className={`h-2 w-10 rounded ${accent}`} />
        <div className="h-2 w-8 rounded bg-gray-100" />
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 w-3/4 rounded bg-gray-100" />
        <div className="h-1.5 w-1/2 rounded bg-gray-100" />
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex justify-between">
          <div className="h-1.5 w-16 rounded bg-gray-100" />
          <div className="h-1.5 w-10 rounded bg-gray-100" />
        </div>
        <div className="flex justify-between">
          <div className="h-1.5 w-14 rounded bg-gray-100" />
          <div className="h-1.5 w-10 rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-3 flex justify-between border-t border-gray-100 pt-2">
        <div className={`h-2 w-8 rounded ${accent}`} />
        <div className={`h-2 w-10 rounded ${accent}`} />
      </div>
    </div>
  )
}

const TEMPLATES = [
  {
    title: 'Classic Invoice',
    description: 'Clean, timeless layout with detailed line items and totals.',
    accent: 'bg-blue-500',
  },
  {
    title: 'Minimal Invoice',
    description: 'Whitespace-forward design for a modern, boutique feel.',
    accent: 'bg-slate-700',
  },
  {
    title: 'Bold Invoice',
    description: 'Strong typography and high-contrast sections for impact.',
    accent: 'bg-indigo-600',
  },
  {
    title: 'Professional Quote',
    description: 'Convert-ready quote format with approval summary.',
    accent: 'bg-emerald-500',
  },
  {
    title: 'Project Estimate',
    description: 'Phase-based estimate ideal for agencies and retainers.',
    accent: 'bg-amber-500',
  },
  {
    title: 'Freelancer Invoice',
    description: 'Compact format perfect for solo professionals and consultants.',
    accent: 'bg-rose-500',
  },
]

export function Templates() {
  return (
    <section id="templates" className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Templates</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Start with a professionally designed template
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose a layout, add your branding, and send your first invoice in minutes.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map(({ title, description, accent }) => (
            <a
              key={title}
              href="/sign-up"
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <TemplateMiniPreview accent={accent} />
              <div className="mt-5">
                <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Use template
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
