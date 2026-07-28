import { ArrowUpRight } from 'lucide-react'
import { Link } from 'wouter'
import { Progress } from '@/components/ui/progress'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export function UsageIndicator({ compact = false }: { compact?: boolean }) {
  const { subscription } = useSubscription()
  const { toast } = useToast()
  const used = subscription.invoiceCountThisMonth
  const remaining = subscription.invoiceRemaining ?? 0
  useEffect(() => {
    if (subscription.invoiceLimit === null || subscription.invoiceCountThisMonth === 0) return
    const threshold = remaining <= 0 ? 0 : remaining <= 1 ? 1 : remaining <= 5 ? 5 : remaining <= 10 ? 10 : null
    if (threshold === null) return
    const key = `invoicefocus-usage-notice:${subscription.lastResetDate}:${threshold}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, 'shown')
    toast({
      title: threshold === 0 ? 'Monthly invoice limit reached' : `${threshold} invoice${threshold === 1 ? '' : 's'} remaining`,
      description: threshold === 0
        ? 'Upgrade to Pro for unlimited invoicing and additional business tools.'
        : `You have ${remaining} Free invoice${remaining === 1 ? '' : 's'} left this month.`,
    })
  }, [remaining, subscription.invoiceCountThisMonth, subscription.invoiceLimit, subscription.lastResetDate, toast])
  if (subscription.invoiceLimit === null) return null
  const percent = Math.min((used / subscription.invoiceLimit) * 100, 100)
  const urgent = remaining <= 5
  return <div className={compact ? 'rounded-lg border border-border bg-background p-3' : 'rounded-xl border border-border bg-card p-4'}>
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-medium text-foreground">Invoice usage</p><p className="mt-1 text-xs text-muted-foreground">{used} of {subscription.invoiceLimit} Free invoices used this month</p></div><span className={`text-xs font-semibold ${urgent ? 'text-amber-600' : 'text-primary'}`}>{remaining} left</span></div>
    <Progress value={percent} className={`mt-3 ${urgent ? '[&>div]:bg-amber-500' : ''}`} />
    {!compact && <Link href="/dashboard/upgrade" className="mt-3 flex items-center justify-between text-xs font-medium text-primary hover:underline">Upgrade for unlimited invoices<ArrowUpRight className="h-3.5 w-3.5" /></Link>}
  </div>
}