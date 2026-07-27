import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section id="cta" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <motion.div
          className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center sm:px-12 lg:px-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="pointer-events-none absolute -inset-px opacity-10"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-0 h-full w-[600px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,white,transparent_70%)]" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-balance text-3xl font-semibold leading-tight tracking-tight text-primary-foreground md:text-4xl">
              Start Creating Professional Invoices Today
            </h2>
            <p className="mt-4 text-balance text-lg leading-relaxed text-primary-foreground/80">
              Join professionals who use InvoiceFocus to streamline billing and get paid on time.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <a href="/sign-up">
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <a href="/sign-in">Sign In</a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
