import {
  Zap,
  Shield,
  Clock,
  Wallet,
  Smartphone,
  HeartHandshake,
} from 'lucide-react'

const BENEFITS = [
  {
    icon: Zap,
    title: 'Fast & Intuitive',
    description: 'A distraction-free interface that lets you build invoices without clicking through dozens of menus.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your client data and invoices stay protected with modern security practices and encryption.',
  },
  {
    icon: Clock,
    title: 'Saves Hours Every Week',
    description: 'Reusable client details, saved line items, and automatic calculations speed up your billing workflow.',
  },
  {
    icon: Wallet,
    title: 'Get Paid Faster',
    description: 'Clear, professional invoices and easy sharing options help clients pay on time, every time.',
  },
  {
    icon: Smartphone,
    title: 'Works Everywhere',
    description: 'Create and send invoices from your laptop, tablet, or phone with a fully responsive experience.',
  },
  {
    icon: HeartHandshake,
    title: 'Designed for Service Businesses',
    description: 'Built for the way freelancers, agencies, and consultants actually work, not generic accounting tools.',
  },
]

export function Why() {
  return (
    <section id="why" className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Why InvoiceFocus</span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            The workspace that helps you look professional
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Focus on your work, not your billing. InvoiceFocus handles the details so you can get paid.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
