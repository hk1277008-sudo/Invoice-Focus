import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTA() {
  return (
    <section id="cta" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center sm:px-12 lg:px-20">
          <div
            className="pointer-events-none absolute -inset-px opacity-10"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-0 h-full w-[600px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,white,transparent_70%)]" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Start for free
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
              Ready to get paid faster?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Create your first professional invoice in under a minute. No credit card required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <a href="/sign-up">
                  Create your first invoice
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <a href="/sign-in">Sign In</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
