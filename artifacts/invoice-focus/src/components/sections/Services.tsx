import { ArrowRight } from 'lucide-react'

const SERVICES = [
  'Custom websites',
  'POS systems',
  'Business automation',
  'Software development',
  'Digital marketing',
]

export function Services() {
  return (
    <section id="services" className="bg-muted/20">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:py-14">
        <div className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-card/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <span className="label-caps">Coming next</span>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
              More ways to build your business
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              We&apos;re exploring practical services for businesses that want one trusted partner for their digital operations.
            </p>
          </div>
          <div className="flex max-w-sm flex-wrap gap-2 sm:justify-end">
            {SERVICES.map((service) => (
              <span key={service} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <ArrowRight className="h-3 w-3 text-primary" aria-hidden="true" />
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}