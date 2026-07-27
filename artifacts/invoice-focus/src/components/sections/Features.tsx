import {
  FileText,
  Quote,
  Calculator,
  Download,
  Palette,
  Globe,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'Professional Invoice Builder',
    description:
      'Build polished, itemized invoices with automatic totals, taxes, and discounts in a clean, modern editor.',
  },
  {
    icon: Quote,
    title: 'Quotes',
    description:
      'Send branded quotes that clients can approve online, then convert them into invoices with one click.',
  },
  {
    icon: Calculator,
    title: 'Estimates',
    description:
      'Create accurate project estimates, adjust line items, and turn approved estimates into payable invoices.',
  },
  {
    icon: Download,
    title: 'PDF Export',
    description:
      'Download print-ready PDFs instantly or share a secure link so clients can view invoices in any browser.',
  },
  {
    icon: Palette,
    title: 'Custom Branding',
    description:
      'Add your logo, colors, and business details so every invoice looks like it came from your studio.',
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description:
      'Invoice clients around the world with support for major currencies and automatic formatting.',
  },
]

export function Features() {
  return (
    <section id="features" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Features</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            A complete toolkit for polished invoices, quotes, and estimates
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A focused toolkit for creating, customizing, and sharing professional documents.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
