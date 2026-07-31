import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'wouter'
import { DashboardLayout } from '../layout'
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans'
import { useSubscription } from '@/providers/SubscriptionProvider'

export default function UpgradePage() {
  const { subscription } = useSubscription()
  return <DashboardLayout>
    <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-start gap-3">
        <ButtonBack />
         <div><p className="label-caps">Plans & access</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Make more room for good work.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Choose the InvoiceFocus plan that fits your business today. During the private beta, plan changes are applied directly to your workspace.</p></div>
      </div>
       <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm"><ShieldCheck className="h-4 w-4 text-emerald-600" />You’re currently on the {subscription.planName} plan.</div>
      <SubscriptionPlans />
    </div>
  </DashboardLayout>
}
function ButtonBack() {
  return <Link href="/dashboard/billing" className="mt-1 flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /><span className="sr-only">Back to billing</span></Link>
}