import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { type BillingCycle, type PlanId } from '@/lib/subscription'
import { useLocation } from 'wouter'
import { createCheckout, updateSubscriptionAction } from '@/lib/billing'
import { useToast } from '@/hooks/use-toast'

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (environment: 'sandbox' | 'production') => void }
      Initialize: (options: { token: string; eventCallback?: (event: { name?: string }) => void }) => void
      Checkout: { open: (options: { transactionId: string; settings?: { successUrl?: string } }) => void }
    }
  }
}

const plans: { id: PlanId; name: string; monthly: string; yearly: string; description: string; features: string[]; popular?: boolean }[] = [
  { id: 'free', name: 'Free', monthly: 'Free Forever', yearly: 'Free Forever', description: 'The essentials for getting started.', features: ['15 invoices per month', '1 business', 'Basic invoice templates', 'Basic dashboard', 'Standard email support'] },
  { id: 'pro', name: 'Pro', monthly: '$9/month', yearly: '$89/year', description: 'More room for a growing business.', popular: true, features: ['Unlimited invoices and clients', 'Recurring invoices', 'Advanced templates', 'Payment reminders', 'Business insights', 'Data export', 'Priority support'] },
  { id: 'premium', name: 'Premium', monthly: '$19/month', yearly: '$189/year', description: 'For teams building an operation.', features: ['Everything in Pro', 'Multiple businesses', 'Team collaboration', 'Roles and permissions', 'Advanced analytics', 'API access', 'Integrations', 'Audit logs'] },
]
let initializedPaddleToken: string | null = null

export function SubscriptionPlans({ initialCycle = 'monthly' }: { initialCycle?: BillingCycle }) {
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle)
  const [busy, setBusy] = useState<PlanId | null>(null)
  const { subscription, refreshSubscription } = useSubscription()
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const choose = async (plan: PlanId) => {
    if (plan === subscription.plan) return
    setBusy(plan)
    try {
      if (plan === 'free') {
        await updateSubscriptionAction('downgrade', plan, cycle)
        await refreshSubscription()
        toast({ title: 'Downgraded to Free', description: 'Your workspace access is now up to date.' })
        navigate('/dashboard/billing')
        return
      }
      const checkout = await createCheckout(plan, cycle)
      if (!checkout.transactionId || !checkout.clientToken) throw new Error(checkout.message || 'Paddle checkout is not configured yet.')
      const open = () => {
        if (!window.Paddle) throw new Error('Paddle Checkout could not be loaded. Please try again.')
        window.Paddle.Checkout.open({ transactionId: checkout.transactionId!, settings: { successUrl: `${window.location.origin}${import.meta.env.BASE_URL}dashboard/billing?checkout=success` } })
      }
      if (!window.Paddle) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Paddle Checkout could not be loaded.'))
          document.head.appendChild(script)
        })
      }
      if (!window.Paddle) throw new Error('Paddle Checkout could not be loaded. Please try again.')
      window.Paddle.Environment.set(checkout.environment === 'production' ? 'production' : 'sandbox')
      if (initializedPaddleToken !== checkout.clientToken) {
        window.Paddle.Initialize({ token: checkout.clientToken, eventCallback: (event) => {
          if (event.name === 'checkout.completed') void refreshSubscription()
        } })
        initializedPaddleToken = checkout.clientToken
      }
      open()
    } catch (error) {
      toast({ title: 'Could not open secure checkout', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }
  return <div><div className="mb-8 flex items-center justify-center"><div className="flex rounded-lg border border-border bg-muted/40 p-1"><button type="button" onClick={() => setCycle('monthly')} className={`rounded-md px-4 py-2 text-sm font-medium ${cycle === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Monthly</button><button type="button" onClick={() => setCycle('yearly')} className={`rounded-md px-4 py-2 text-sm font-medium ${cycle === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Yearly <span className="ml-1 text-xs text-emerald-600">Save 18%</span></button></div></div>
    <div className="grid gap-5 lg:grid-cols-3">{plans.map((plan) => <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-md shadow-primary/10' : ''}`}>{plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most Popular</div>}<CardHeader><div className="flex items-center justify-between"><CardTitle>{plan.name}</CardTitle>{plan.id === subscription.plan && <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current</span>}</div><CardDescription>{plan.description}</CardDescription><p className="pt-3 font-display text-3xl font-semibold">{cycle === 'yearly' ? plan.yearly : plan.monthly}</p></CardHeader><CardContent className="flex flex-1 flex-col"><ul className="flex-1 space-y-3 text-sm text-muted-foreground">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}</ul><Button className="mt-7 w-full" variant={plan.id === subscription.plan ? 'secondary' : plan.popular ? 'default' : 'outline'} disabled={plan.id === subscription.plan || busy !== null} onClick={() => void choose(plan.id)}>{busy === plan.id ? 'Updating…' : plan.id === subscription.plan ? 'Current Plan' : plan.id === 'free' ? 'Downgrade to Free' : `Choose ${plan.name}`}</Button></CardContent></Card>)}</div>
  </div>
}