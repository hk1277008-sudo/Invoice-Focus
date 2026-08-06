import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'wouter'

const TRUST_POINTS = [
  'Professional Invoicing Made Simple',
  'Built for Freelancers and Businesses',
  'Simple. Fast. Reliable.',
]

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 lg:pb-10 lg:pt-20">
        <motion.div
          className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="label-caps w-fit">Professional Invoicing Made Simple</span>
          <h1 className="font-display text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Create Professional Invoices In Under A Minute
          </h1>
          <p className="max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
            Create professional invoices, quotes, estimates, and receipts in minutes with InvoiceFocus—the free online invoice generator built for freelancers, agencies, startups, and businesses. Customize your documents, download print-ready PDF invoices, and send them to clients quickly, all from your browser.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button size="lg" asChild>
              <Link href="/invoice">
                Create Invoice
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#templates">Browse Templates</a>
            </Button>
          </div>

          <ul className="flex w-full flex-col items-center justify-center gap-2.5 pt-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="inline-flex w-full max-w-[19rem] flex-nowrap items-center justify-center gap-2 text-center text-sm leading-5 text-muted-foreground sm:w-auto sm:max-w-none">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                <span className="whitespace-nowrap">{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
