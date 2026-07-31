import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getBillingAvailability } from '@/lib/subscription'

type PricingPlan = {
  name: string
  badge?: string
  description: string
  price: string
  billing?: string
  annualPrice?: string
  savings?: string
  features: string[]
  cta: string
  href: string
  popular?: boolean
}

const PLANS: PricingPlan[] = [
  {
    name: 'Free',
    badge: 'Free Forever',
    description: 'Perfect for freelancers, students, and small businesses getting started.',
    price: '$0',
    billing: '/month',
    features: [
      '15 Professional Invoices Per Month',
      'Unlimited PDF Downloads',
      'Print Invoices',
      'Professional Invoice Templates',
      'Logo Upload',
      'Multiple Currencies',
      'Cloud Sync',
      'Basic Invoice History',
      'Secure Authentication',
      'Email Support',
    ],
    cta: 'Get Started Free',
    href: '/invoice',
  },
  {
    name: 'Pro',
    badge: 'Most Popular',
    description: 'Perfect for growing businesses ready to automate invoicing and serve more clients.',
    price: '$9',
    billing: '/month',
    annualPrice: '$89/year',
    savings: 'Save 18%',
    features: [
      'Everything in Free',
      'Unlimited Invoices',
      'Unlimited Clients',
      'Recurring Invoices',
      'Invoice Status Tracking',
      'Payment Reminders',
      'Advanced Templates',
      'Custom Invoice Numbering',
      'Business Insights',
      'Data Export',
      'Priority Support',
    ],
    cta: 'Explore Pro Features',
    href: '/sign-up',
    popular: true,
  },
  {
    name: 'Premium',
    description: 'Perfect for teams and established businesses that need advanced collaboration and powerful business tools.',
    price: '$19',
    billing: '/month',
    annualPrice: '$189/year',
    savings: 'Save 17%',
    features: [
      'Everything in Pro',
      'Multiple Businesses',
      'Team Collaboration',
      'Roles & Permissions',
      'Advanced Analytics',
      'Custom Branding',
      'API Access',
      'Integrations',
      'Audit Logs',
      'Early Access to New Features',
      'Dedicated Priority Support',
    ],
    cta: 'Go Premium',
    href: '/sign-up',
  },
]

const cardMotion = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function Pricing() {
  const [yearlyAvailable, setYearlyAvailable] = useState(false)
  useEffect(() => {
    let mounted = true
    void getBillingAvailability().then(({ yearly }) => {
      if (mounted) setYearlyAvailable(yearly)
    }).catch(() => {
      if (mounted) setYearlyAvailable(false)
    })
    return () => { mounted = false }
  }, [])

  return (
    <section id="pricing" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-caps">Plans That Grow With You</span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            Choose the Workspace That Fits Your Next Chapter
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Start with the essentials today, then unlock more ways to streamline your business as it grows.
          </p>
        </div>

        <motion.div
          className="mx-auto mt-12 grid max-w-6xl items-stretch gap-6 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {PLANS.map((plan) => (
            <motion.article
              key={plan.name}
              variants={cardMotion}
              className={cn(
                'relative flex h-full flex-col rounded-2xl border bg-card p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8',
                plan.popular
                  ? 'border-primary/60 shadow-lg shadow-primary/10 lg:scale-[1.025] lg:hover:scale-[1.035]'
                  : 'border-border/80 hover:border-primary/25',
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                  {plan.badge}
                </div>
              )}

              <div className="w-full">
                <div className="flex min-h-6 justify-center">
                  {plan.name === 'Free' && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-4 text-left">
                  <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
                    {plan.name}
                  </h3>
                  <div className="shrink-0 text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="font-display text-3xl font-semibold tracking-tight text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">{plan.billing}</span>
                    </div>
                    {yearlyAvailable && plan.annualPrice && (
                      <p className="mt-1 text-xs font-medium text-primary">
                        {plan.annualPrice}{' '}
                        <span className="text-muted-foreground">({plan.savings})</span>
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-4 min-h-[4.5rem] max-w-[20rem] text-left text-sm leading-relaxed text-foreground lg:mx-auto lg:text-center">
                  {plan.description}
                </p>
              </div>

               <ul className="mt-6 flex-1 space-y-3.5 text-left" aria-label={`${plan.name} plan features`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground/80">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="mt-8 w-full"
                variant="default"
              >
                <a href={plan.href}>{plan.cta}</a>
              </Button>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}