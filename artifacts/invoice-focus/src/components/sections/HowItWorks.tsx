import { Pencil, SlidersHorizontal, Download } from 'lucide-react'

const STEPS = [
  {
    icon: Pencil,
    step: '01',
    title: 'Create',
    description:
      'Add your business details, client information, and line items. InvoiceFocus calculates totals, taxes, and discounts automatically.',
  },
  {
    icon: SlidersHorizontal,
    step: '02',
    title: 'Customize',
    description:
      'Apply your logo, choose a template, and adjust colors and currency to match your brand and your client.',
  },
  {
    icon: Download,
    step: '03',
    title: 'Download',
    description:
      'Export a polished PDF, share a secure link, or send the invoice directly from your workspace.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">How It Works</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            From draft to delivery in three steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No complicated setup. Just create, customize, and send.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, step, title, description }) => (
            <div key={title} className="relative flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors hover:bg-primary/15">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Step {step}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
