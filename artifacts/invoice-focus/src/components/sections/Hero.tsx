import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'

const TRUST_POINTS = [
  'Professional Invoicing Made Simple',
  'Built For Freelancers, Agencies And Businesses',
  'Simple. Fast. Reliable.',
]

function InvoicePreview() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/50 bg-white p-5 shadow-xl shadow-foreground/5 sm:p-6 md:p-7 lg:p-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 border-b border-border/50 pb-5 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:pb-6">
        <div className="min-w-0">
          <div className="font-display text-lg font-semibold text-foreground sm:text-xl">
            InvoiceFocus
          </div>
          <div className="text-xs leading-relaxed text-muted-foreground">
            123 Business Street
            <br />
            New York, NY 10001
          </div>
        </div>
        <div className="min-w-0 text-left sm:text-right">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Invoice
          </div>
          <div className="break-all text-sm font-semibold tabular text-foreground sm:text-base">
            #INV-2026-001
          </div>
        </div>
      </div>

      {/* Bill to / Date */}
      <div className="mb-5 grid grid-cols-1 gap-4 border-b border-border/50 pb-5 sm:mb-6 sm:grid-cols-2 sm:pb-6">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Billed To
          </div>
          <div className="break-words text-sm font-semibold text-foreground sm:text-base">
            Acme Agency
          </div>
          <div className="break-all text-xs text-muted-foreground">contact@acme.co</div>
        </div>
        <div className="min-w-0 sm:text-right">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Date
          </div>
          <div className="text-sm font-semibold tabular text-foreground sm:text-base">
            Jul 26, 2026
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">Due: Aug 9, 2026</div>
        </div>
      </div>

      {/* Line items */}
      <div className="mb-5 sm:mb-6">
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_4rem_4.5rem] gap-x-2 border-b border-border/50 pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid-cols-[minmax(0,1fr)_4rem_5rem_6rem] sm:gap-x-3 sm:text-xs">
          <div className="flex items-center">Description</div>
          <div className="flex items-center justify-end">Qty</div>
          <div className="flex items-center justify-end">Rate</div>
          <div className="flex items-center justify-end">Amount</div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_4rem_4.5rem] gap-x-2 border-b border-border/50 py-3 text-[13px] text-foreground sm:grid-cols-[minmax(0,1fr)_4rem_5rem_6rem] sm:gap-x-3 sm:text-sm">
          <div className="flex items-center min-w-0 break-words leading-snug">
            Brand strategy & positioning
          </div>
          <div className="flex items-center justify-end tabular leading-snug">1</div>
          <div className="flex items-center justify-end tabular leading-snug">$1,500</div>
          <div className="flex items-center justify-end tabular leading-snug">$1,500.00</div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_4rem_4.5rem] gap-x-2 border-b border-border/50 py-3 text-[13px] text-foreground sm:grid-cols-[minmax(0,1fr)_4rem_5rem_6rem] sm:gap-x-3 sm:text-sm">
          <div className="flex items-center min-w-0 break-words leading-snug">
            Website design & development
          </div>
          <div className="flex items-center justify-end tabular leading-snug">1</div>
          <div className="flex items-center justify-end tabular leading-snug">$4,000</div>
          <div className="flex items-center justify-end tabular leading-snug">$4,000.00</div>
        </div>
      </div>

      {/* Totals */}
      <div className="mb-5 ml-auto w-full max-w-[14rem] space-y-1.5 border-t border-border/50 pt-4 text-[13px] sm:mb-6 sm:max-w-[16rem] sm:text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular">$5,500.00</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax (8%)</span>
          <span className="tabular">$440.00</span>
        </div>
        <div className="flex justify-between border-t border-border/50 pt-1.5 font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular">$5,940.00</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
        <span className="text-sm text-muted-foreground">Payment status</span>
        <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Awaiting payment
        </span>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-8">
            <span className="label-caps w-fit">Professional Invoicing Made Simple</span>
            <h1 className="font-display text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Create Professional Invoices In Under A Minute
            </h1>
            <p className="max-w-lg text-balance text-lg leading-relaxed text-muted-foreground">
              Create polished invoices, quotes, and estimates from one modern workspace built for
              freelancers, agencies, and businesses.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="lg" asChild className="shadow-md hover:shadow-lg">
                <a href="/sign-up">
                  Create Invoice
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild className="bg-white shadow-sm hover:shadow-md">
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
