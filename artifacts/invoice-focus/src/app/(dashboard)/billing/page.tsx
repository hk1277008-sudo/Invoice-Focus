import { useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { ArrowUpRight, Check, CreditCard, ExternalLink, FileText, History, Info, AlertCircle, ShieldCheck } from 'lucide-react'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { UsageIndicator } from '@/components/subscription/UsageIndicator'
import { getBillingOverview, openBillingPortal, updateSubscriptionAction, type PaymentHistoryItem, type PaymentMethod } from '@/lib/billing'
import type { PlanId } from '@/lib/subscription'
import { useToast } from '@/hooks/use-toast'
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function BillingPage() {
  const { subscription, isLoading: subLoading, refreshSubscription } = useSubscription()
  const { toast } = useToast()
  const [location, navigate] = useLocation()
  const selectedPlan = new URLSearchParams(location.split('?')[1] || '').get('plan')
  const selectedCycle = new URLSearchParams(location.split('?')[1] || '').get('cycle') === 'yearly' ? 'yearly' : 'monthly'

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [history, setHistory] = useState<PaymentHistoryItem[]>([])
  const [loadingExtras, setLoadingExtras] = useState(true)

  const [isProcessing, setIsProcessing] = useState(false)
  const [portalBusy, setPortalBusy] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: 'cancel' | 'reactivate' | 'renew' | 'downgrade'; title: string; desc: string } | null>(null)

  useEffect(() => {
    getBillingOverview()
      .then(({ paymentMethods: methods, paymentHistory: rows }) => {
        setPaymentMethods(methods)
        setHistory(rows.map((item) => ({
          id: item.id,
          date: item.occurred_at,
          invoiceNumber: item.invoice_number || `IF-${item.id.slice(0, 8).toUpperCase()}`,
          plan: item.plan || 'InvoiceFocus',
          amount: item.amount || 0,
          currency: item.currency || 'USD',
          status: (['paid', 'failed', 'pending', 'refunded'].includes(item.status) ? item.status : 'pending') as PaymentHistoryItem['status'],
          description: item.event_type,
          invoiceUrl: item.receipt_url || undefined,
        })))
      })
      .catch(() => {
        toast({ title: 'Could not load billing details', variant: 'destructive' })
      })
      .finally(() => setLoadingExtras(false))
  }, [toast])

  const handleAction = async (action: 'cancel' | 'reactivate' | 'renew' | 'downgrade') => {
    setIsProcessing(true)
    try {
      await updateSubscriptionAction(action)
      await refreshSubscription()
      toast({
        title: 'Action completed',
        description: 'Your subscription preferences are now up to date.',
      })
      setConfirmDialog(null)
    } catch (err) {
      toast({ title: 'Action failed', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const openPaymentMethodFlow = async () => {
    setPortalBusy(true)
    try {
      const result = await openBillingPortal()
      if (result.portalUrl) {
        window.location.assign(result.portalUrl)
        return
      }
      toast({ title: 'Choose a plan to add a payment method', description: 'Select Pro or Premium to continue with secure billing.' })
      navigate('/dashboard/upgrade')
    } catch (error) {
      toast({ title: 'Could not open billing', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setPortalBusy(false)
    }
  }

  const downloadReceipt = (item: PaymentHistoryItem) => {
    if (item.invoiceUrl) {
      window.open(item.invoiceUrl, '_blank', 'noopener,noreferrer')
      return
    }
    const safe = (value: string) => value.replace(/[<>&"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[character] || character)
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>InvoiceFocus receipt ${safe(item.invoiceNumber)}</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:48px auto;color:#172033}h1{font-size:24px}dl{display:grid;grid-template-columns:160px 1fr;gap:12px;border-top:1px solid #ddd;padding-top:20px}dt{color:#667085}dd{margin:0;font-weight:600}</style></head><body><h1>InvoiceFocus receipt</h1><p>${safe(item.invoiceNumber)}</p><dl><dt>Date</dt><dd>${safe(new Date(item.date).toLocaleDateString())}</dd><dt>Plan</dt><dd>${safe(item.plan)}</dd><dt>Status</dt><dd>${safe(item.status)}</dd><dt>Amount</dt><dd>${safe(new Intl.NumberFormat(undefined, { style: 'currency', currency: item.currency }).format(item.amount / 100))}</dd></dl></body></html>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `invoicefocus-receipt-${item.invoiceNumber}.html`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (subLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-10 w-48 rounded bg-muted" />
           <div className="h-64 rounded-lg bg-muted" />
        </div>
      </DashboardLayout>
    )
  }

  const isCanceled = subscription.status === 'cancelled'
  const isPastDue = subscription.status === 'past_due'

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
           <p className="label-caps">Workspace billing</p>
           <h1 className="mt-2 text-2xl font-semibold tracking-tight">Billing & Plans</h1>
           <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage your subscription, payment methods, and billing history.</p>
        </div>
        {selectedPlan && selectedPlan !== subscription.plan && (
          <Card className="border-primary/30 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle>Secure checkout</CardTitle>
              <CardDescription>You've selected the {selectedPlan === 'free' ? 'Free' : selectedPlan === 'pro' ? 'Pro' : 'Premium'} plan.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <p className="text-sm text-muted-foreground">Review the plan details, then continue to activate it for this workspace.</p>
               <Button onClick={() => navigate(`/dashboard/upgrade?plan=${selectedPlan}&cycle=${selectedCycle}`)} disabled={isProcessing}>Continue to secure checkout</Button>
            </CardContent>
          </Card>
        )}

        {isCanceled && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Subscription canceled</p>
              <p className="text-sm">Your plan will remain active until the end of the current billing cycle.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setConfirmDialog({ isOpen: true, action: 'reactivate', title: 'Reactivate Subscription', desc: 'Are you sure you want to reactivate your subscription?' })}>
              Reactivate
            </Button>
          </div>
        )}

        {isPastDue && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Payment past due</p>
              <p className="text-sm">Please update your payment method to keep your subscription active.</p>
            </div>
             <Button size="sm" variant="default" className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => setConfirmDialog({ isOpen: true, action: 'renew', title: 'Renew Subscription', desc: 'Renew this workspace subscription and keep its current plan active.' })}>
              Update Payment
            </Button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Plan Overview */}
          <Card className="md:col-span-2 flex flex-col border-primary/20 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between bg-muted/20 pb-6">
              <div>
                <CardTitle className="text-lg">Current Plan</CardTitle>
                <CardDescription className="mt-1">
                  You are currently on the <strong className="font-medium text-foreground">{subscription.planName}</strong> plan.
                </CardDescription>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                subscription.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                subscription.status === 'cancelled' ? 'bg-muted text-muted-foreground' : 'bg-amber-500/10 text-amber-600'
              }`}>
                {subscription.status}
              </span>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Price</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl font-semibold tracking-tight">{subscription.catalog.price}</span>
                    {subscription.catalog.monthlyPrice > 0 && <span className="text-sm text-muted-foreground">/{subscription.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>}
                  </div>
                  
                  <div className="mt-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Renewal Date</p>
                    <p className="text-base">{subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4 bg-background">
                    {subscription.invoiceLimit === null ? (
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Unlimited Invoices</p>
                          <p className="text-xs text-muted-foreground">Send as many as you need</p>
                        </div>
                      </div>
                    ) : (
                      <UsageIndicator compact={false} />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <p className="text-sm font-medium mb-4">Included Features</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {subscription.catalog.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t border-border gap-3">
              {subscription.plan !== 'premium' && (
                <Button asChild className="gap-2">
                   <Link href="/dashboard/upgrade">
                    <ArrowUpRight className="h-4 w-4" />
                    Upgrade Plan
                  </Link>
                </Button>
              )}
              {subscription.plan !== 'free' && !isCanceled && (
                <>
                  <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: true, action: 'downgrade', title: 'Downgrade to Free', desc: 'You will lose access to premium features. Are you sure?' })}>
                    Downgrade
                  </Button>
                  <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDialog({ isOpen: true, action: 'cancel', title: 'Cancel Subscription', desc: 'Your subscription will be canceled at the end of the billing period.' })}>
                    Cancel
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>

          <div className="space-y-6">
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingExtras ? (
                  <div className="h-12 animate-pulse rounded bg-muted" />
                ) : paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethods.map(pm => (
                      <div key={pm.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-12 items-center justify-center rounded bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {pm.brand}
                          </div>
                          <div>
                            <p className="text-sm font-medium">•••• {pm.last4}</p>
                            <p className="text-xs text-muted-foreground">Expires {pm.expMonth}/{pm.expYear}</p>
                          </div>
                        </div>
                        {pm.isDefault && <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Default</span>}
                      </div>
                    ))}
                     <Button variant="outline" className="w-full text-sm h-9" onClick={() => void openPaymentMethodFlow()} disabled={portalBusy}>
                       {portalBusy ? 'Opening…' : 'Update Method'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">No payment method added.</p>
                    <Button variant="outline" size="sm" onClick={() => void openPaymentMethodFlow()} disabled={portalBusy}>
                      {portalBusy ? 'Opening…' : 'Add Payment Method'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Portal */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                  <h3 className="font-medium">Customer Portal</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Review plan access and manage workspace billing preferences.
                    </p>
                  </div>
                   <Button variant="default" className="w-full mt-2 gap-2" onClick={() => void openPaymentMethodFlow()} disabled={portalBusy}>
                     {portalBusy ? 'Opening…' : 'Review plans'}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Billing History
            </CardTitle>
            <CardDescription>Recent payments and generated invoices for your subscription.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingExtras ? (
              <div className="space-y-3">
                <div className="h-12 animate-pulse rounded bg-muted" />
                <div className="h-12 animate-pulse rounded bg-muted" />
              </div>
            ) : history.length > 0 ? (
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                       <th className="h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Date</th>
                       <th className="h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Invoice number</th>
                       <th className="h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Plan</th>
                       <th className="h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                       <th className="h-11 px-4 text-right align-middle text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Amount</th>
                       <th className="h-11 px-4 text-right align-middle text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {history.map(item => (
                      <tr key={item.id} className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                         <td className="px-4 py-3.5 align-middle">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3.5 align-middle font-medium">{item.invoiceNumber}</td>
                          <td className="px-4 py-3.5 align-middle">{item.plan}</td>
                         <td className="px-4 py-3.5 align-middle">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            item.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            item.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                         <td className="px-4 py-3.5 align-middle text-right">${(item.amount / 100).toFixed(2)}</td>
                          <td className="px-4 py-3.5 align-middle text-right">
                           <Button variant="ghost" size="sm" className="gap-1" onClick={() => downloadReceipt(item)}>
                             <FileText className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Download Receipt</span>
                           </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
                 <div className="rounded-full bg-primary/10 p-3"><History className="h-5 w-5 text-primary" /></div>
                 <p className="mt-4 font-medium text-foreground">Your billing history is empty</p>
                 <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">Once you choose a paid plan, receipts and subscription activity will appear here.</p>
                 <Button className="mt-5" onClick={() => navigate('/dashboard/upgrade')}>Review plans</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade / Change Plan Section */}
        <div id="plans" className="pt-8">
          <div className="mb-6">
             <h2 className="text-2xl font-semibold tracking-tight">Available Plans</h2>
             <p className="mt-1 text-sm text-muted-foreground">Choose a plan to update workspace access. Plan changes are applied immediately during the private beta.</p>
          </div>
          <SubscriptionPlans />
        </div>
      </div>

      <Dialog open={confirmDialog?.isOpen || false} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setConfirmDialog(null)} disabled={isProcessing}>Cancel</Button>
            <Button 
              variant={confirmDialog?.action === 'cancel' || confirmDialog?.action === 'downgrade' ? 'destructive' : 'default'}
              onClick={() => confirmDialog && handleAction(confirmDialog.action)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
