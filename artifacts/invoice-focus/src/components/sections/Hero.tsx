import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'

const TRUST_POINTS = [
  'Free to start',
  'No credit card required',
  'Cancel anytime',
]

function InvoicePreview() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-xl shadow-foreground/5">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between border-b border-border pb-4">
        <div>
          <div className="font-display text-lg font-semibold text-foreground">InvoiceFocus</div>
          <div className="text-xs text-muted-foreground">123 Business Street</div>
          <div className="text-xs text-muted-foreground">New York, NY 10001</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</div>
          <div className="text-sm font-medium text-foreground">#INV-2026-001</div>
        </div>
      </div>

      {/* Bill to */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billed To</div>
          <div className="text-sm font-medium text-foreground">Acme Agency</div>
          <div className="text-xs text-muted-foreground">contact@acme.co</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</div>
          <div className="text-sm font-medium text-foreground">Jul 26, 2026</div>
          <div className="mt-1 text-xs text-muted-foreground">Due: Aug 9, 2026</div>
        </div>
      </div>

      {/* Line items */}
      <div className="mb-4">
        <div className="grid grid-cols-12 gap-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        <div className="grid grid-cols-12 gap-2 border-b border-border py-3 text-sm text-foreground">
          <div className="col-span-6">Brand strategy & positioning</div>
          <div className="col-span-2 text-right">1</div>
          <div className="col-span-2 text-right">$1,500</div>
          <div className="col-span-2 text-right tabular">$1,500.00</div>
        </div>
        <div className="grid grid-cols-12 gap-2 border-b border-border py-3 text-sm text-foreground">
          <div className="col-span-6">Website design & development</div>
          <div className="col-span-2 text-right">1</div>
          <div className="col-span-2 text-right">$4,000</div>
          <div className="col-span-2 text-right tabular">$4,000.00</div>
        </div>
      </div>

      {/* Totals */}
      <div className="mb-4 ml-auto w-full max-w-[200px] space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular">$5,500.00</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax (8%)</span>
          <span className="tabular">$440.00</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1 font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular">$5,940.00</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between rounded-xl bg-muted p-3">
        <span className="text-sm text-muted-foreground">Payment status</span>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Awaiting payment
        </span>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <span className="label-caps w-fit">Professional Invoicing Made Simple</span>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Create Professional Invoices In Under A Minute
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Create beautiful invoices, professional quotes, and accurate estimates from one
              modern workspace designed for freelancers, agencies, startups, and growing businesses.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <a href="/sign-up">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#templates">Browse Templates</a>
              </Button>
            </div>

            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative">
              <InvoicePreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
