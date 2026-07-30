import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { type BillingCycle, type PlanId } from '@/lib/subscription'
import { useLocation } from 'wouter'

const plans: { id: PlanId; name: string; monthly: string; yearly: string; description: string; features: string[]; popular?: boolean }[] = [
  { id: 'free', name: 'Free', monthly: 'Free Forever', yearly: 'Free Forever', description: 'The essentials for getting started.', features: ['15 invoices per month', '1 business', 'Basic invoice templates', 'Basic dashboard', 'Standard email support'] },
  { id: 'pro', name: 'Pro', monthly: '$9/month', yearly: '$89/year', description: 'More room for a growing business.', popular: true, features: ['Unlimited invoices and clients', 'Recurring invoices', 'Advanced templates', 'Payment reminders', 'Business insights', 'Data export', 'Priority support'] },
  { id: 'premium', name: 'Premium', monthly: '$19/month', yearly: '$189/year', description: 'For teams building an operation.', features: ['Everything in Pro', 'Multiple businesses', 'Team collaboration', 'Roles and permissions', 'Advanced analytics', 'API access', 'Integrations', 'Audit logs'] },
]
export function SubscriptionPlans({ initialCycle = 'monthly' }: { initialCycle?: BillingCycle }) {
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle)
  const [busy, setBusy] = useState<PlanId | null>(null)
  const { subscription } = useSubscription()
  const [, navigate] = useLocation()
  const choose = async (plan: PlanId) => {
    if (plan === subscription.plan) {
      navigate('/dashboard/billing')
      return
    }
    setBusy(plan)
    navigate(`/dashboard/billing?plan=${plan}&cycle=${cycle}`)
    setBusy(null)
  }
  return <div><div className="mb-8 flex items-center justify-center"><div className="flex rounded-lg border border-border bg-muted/40 p-1"><button onClick={() => setCycle('monthly')} className={`rounded-md px-4 py-2 text-sm font-medium ${cycle === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Monthly</button><button onClick={() => setCycle('yearly')} className={`rounded-md px-4 py-2 text-sm font-medium ${cycle === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Yearly <span className="ml-1 text-xs text-emerald-600">Save 18%</span></button></div></div>
    <div className="grid gap-5 lg:grid-cols-3">{plans.map((plan) => <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-md shadow-primary/10' : ''}`}>{plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most Popular</div>}<CardHeader><div className="flex items-center justify-between"><CardTitle>{plan.name}</CardTitle>{plan.id === subscription.plan && <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current</span>}</div><CardDescription>{plan.description}</CardDescription><p className="pt-3 font-display text-3xl font-semibold">{cycle === 'yearly' ? plan.yearly : plan.monthly}</p></CardHeader><CardContent className="flex flex-1 flex-col"><ul className="flex-1 space-y-3 text-sm text-muted-foreground">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}</ul><Button className="mt-7 w-full" variant={plan.id === subscription.plan ? 'secondary' : plan.popular ? 'default' : 'outline'} disabled={plan.id === subscription.plan || busy !== null} onClick={() => choose(plan.id)}>{busy === plan.id ? 'Preparing...' : plan.id === subscription.plan ? 'Current Plan' : `Choose ${plan.name}`}</Button></CardContent></Card>)}</div>
  </div>
}