import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'

const TRUST_POINTS = [
  'Professional Invoicing Made Simple',
  'Built For Freelancers, Agencies And Businesses',
  'Simple. Fast. Reliable.',
]

function InvoicePreview() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/70 bg-white p-4 shadow-2xl shadow-foreground/7 sm:p-5 md:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 border-b border-border/60 pb-4 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:pb-5">
        <div className="min-w-0">
          <div className="font-display text-base font-semibold text-foreground sm:text-lg">
            InvoiceFocus
          </div>
          <div className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            123 Business Street
            <br />
            New York, NY 10001
          </div>
        </div>
        <div className="min-w-0 text-left sm:text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
            Invoice
          </div>
          <div className="break-all text-sm font-medium tabular text-foreground">
            #INV-2026-001
          </div>
        </div>
      </div>

      {/* Bill to / Date */}
      <div className="mb-4 grid grid-cols-1 gap-3 border-b border-border/60 pb-4 sm:mb-5 sm:grid-cols-2 sm:pb-5">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
            Billed To
          </div>
          <div className="break-words text-sm font-medium text-foreground">Acme Agency</div>
          <div className="break-all text-[11px] text-muted-foreground sm:text-xs">
            contact@acme.co
          </div>
        </div>
        <div className="min-w-0 sm:text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
            Date
          </div>
          <div className="text-sm font-medium tabular text-foreground">Jul 26, 2026</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
            Due: Aug 9, 2026
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="mb-4 sm:mb-5">
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_4rem_4.5rem] gap-x-2 border-b border-border/60 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid-cols-[minmax(0,1fr)_3.5rem_5rem_5.5rem] sm:text-xs">
          <div className="flex items-center">Description</div>
          <div className="flex items-center justify-end">Qty</div>
          <div className="flex items-center justify-end">Rate</div>
          <div className="flex items-center justify-end">Amount</div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_4rem_4.5rem] gap-x-2 border-b border-border/60 py-2.5 text-[13px] text-foreground sm:grid-cols-[minmax(0,1fr)_3.5rem_5rem_5.5rem] sm:text-sm">
          <div className="flex items-center min-w-0 break-words leading-snug">Brand strategy & positioning</div>
          <div className="flex items-center justify-end tabular leading-snug">1</div>
          <div className="flex items-center justify-end tabular leading-snug">$1,500</div>
          <div className="flex items-center justify-end tabular leading-snug">$1,500.00</div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_4rem_4.5rem] gap-x-2 border-b border-border/60 py-2.5 text-[13px] text-foreground sm:grid-cols-[minmax(0,1fr)_3.5rem_5rem_5.5rem] sm:text-sm">
          <div className="flex items-center min-w-0 break-words leading-snug">Website design & development</div>
          <div className="flex items-center justify-end tabular leading-snug">1</div>
          <div className="flex items-center justify-end tabular leading-snug">$4,000</div>
          <div className="flex items-center justify-end tabular leading-snug">$4,000.00</div>
        </div>
      </div>

      {/* Totals */}
      <div className="mb-4 ml-auto w-full max-w-[13.5rem] space-y-1 border-t border-border/60 pt-3 text-[13px] sm:mb-5 sm:max-w-[15rem] sm:text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular">$5,500.00</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax (8%)</span>
          <span className="tabular">$440.00</span>
        </div>
        <div className="flex justify-between border-t border-border/60 pt-1.5 font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular">$5,940.00</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/70 px-3 py-2.5 sm:rounded-xl">
        <span className="text-[13px] text-muted-foreground sm:text-sm">Payment status</span>
        <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:text-xs">
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
            <h1 className="font-display text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Create Professional Invoices In Under A Minute
            </h1>
            <p className="max-w-lg text-balance text-lg leading-relaxed text-muted-foreground">
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
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-balance">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative animate-fade-in-up">
              <InvoicePreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
