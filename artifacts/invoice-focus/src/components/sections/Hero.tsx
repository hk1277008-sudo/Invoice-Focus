import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Check } from 'lucide-react'

const TRUST_POINTS = [
  'No account required to start',
  'Professional PDF downloads',
  'Trusted by freelancers & studios',
]

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: copy */}
          <div className="flex flex-col gap-6">
            <span className="label-caps w-fit">Free Invoice Generator</span>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Create professional invoices with one click
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Invoice Focus is the modern invoice maker for independent professionals
              and studios. Quickly create, customize, and send invoices directly from
              your browser — then download polished PDFs or accept payments online.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <a href="/sign-up">
                  Create your first invoice
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#features">See how it works</a>
              </Button>
            </div>

            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <Check className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: invoice preview card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-xl border border-border bg-card p-6 shadow-lg shadow-foreground/5">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="font-display font-semibold text-foreground">Invoice Focus</span>
                </div>
                <span className="text-xs text-muted-foreground">#INV-001</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billed to</span>
                  <span className="font-medium text-foreground">Acme Studio</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Issue date</span>
                  <span className="font-medium text-foreground">Jul 26, 2026</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due date</span>
                  <span className="font-medium text-foreground">Aug 9, 2026</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-foreground">Total due</span>
                    <span className="tabular text-foreground">$2,450.00</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                  Paid
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
