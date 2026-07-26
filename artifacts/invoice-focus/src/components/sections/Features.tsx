import {
  Palette,
  Coins,
  Percent,
  CreditCard,
  Download,
  Users,
  Repeat,
  BarChart3,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Palette,
    title: 'Customizable templates',
    description:
      'Choose from clean, professional invoice templates and tailor colors, logos, and line items to match your brand.',
  },
  {
    icon: Coins,
    title: 'Multiple currencies',
    description:
      'Invoice clients anywhere in the world with support for dozens of currencies and automatic currency formatting.',
  },
  {
    icon: Percent,
    title: 'Taxes & discounts',
    description:
      'Add line-item and invoice-level taxes, discounts, and shipping costs with automatic totals.',
  },
  {
    icon: CreditCard,
    title: 'Online payments',
    description:
      'Accept card and bank payments directly from the invoice so clients can pay in seconds.',
  },
  {
    icon: Download,
    title: 'Instant PDF download',
    description:
      'Generate polished, print-ready PDFs with one click and send them straight to your client.',
  },
  {
    icon: Users,
    title: 'Client management',
    description:
      'Save client details, track invoices by customer, and keep your records organized in one place.',
  },
  {
    icon: Repeat,
    title: 'Recurring invoices',
    description:
      'Set up repeating invoices for retainers and subscriptions so billing happens automatically.',
  },
  {
    icon: BarChart3,
    title: 'Reports & insights',
    description:
      'See what you have billed, what is outstanding, and who pays on time with a simple dashboard.',
  },
]

export function Features() {
  return (
    <section id="features" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Features</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Everything you need to bill faster
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete invoicing toolkit built for the way modern freelancers and small studios work.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-medium text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
