import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const cardMotion = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function Pricing() {
  return (
    <section id="pricing" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Simple, For Everyone</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            Everything You Need. Nothing Held Back.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            InvoiceFocus is completely free, with unlimited invoices and every feature included from day one.
          </p>
        </div>

        <motion.div
          className="mx-auto mt-12 max-w-2xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.article variants={cardMotion} className="rounded-2xl border border-primary/30 bg-card p-7 shadow-lg shadow-primary/10 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Free forever</span>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-5xl font-semibold tracking-tight text-foreground">$0</span>
                <span className="text-sm text-muted-foreground">always</span>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/80">
                Create, customize, export, share, and manage as many invoices as your business needs.
              </p>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Included InvoiceFocus features">
              {['Unlimited invoices', 'All templates and branding', 'Recurring invoices and reminders', 'Clients and invoice history', 'PDF, print, and data exports', 'Cloud sync when you sign in'].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-foreground/80">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 w-full">
              <a href="/invoice">Create an invoice</a>
            </Button>
          </motion.article>
        </motion.div>
      </div>
    </section>
  )
}