import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { useLocation } from 'wouter'
import { DashboardLayout } from '../../layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { verifyCheckoutTransaction } from '@/lib/billing'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { useAuth } from '@/hooks/useAuth'

export default function BillingSuccessPage() {
  const [location, navigate] = useLocation()
  const { refreshSubscription } = useSubscription()
  const { refreshSession } = useAuth()
  const { toast } = useToast()
  const transactionId = useMemo(
    () => new URLSearchParams(location.split('?')[1] || '').get('transaction_id'),
    [location],
  )
  const [state, setState] = useState<'verifying' | 'active' | 'waiting' | 'error'>(
    transactionId ? 'verifying' : 'waiting',
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!transactionId) {
      setState('waiting')
      setMessage('Your payment was received. We are waiting for Paddle to provide the transaction reference.')
      return
    }
    let cancelled = false
    let attempts = 0
    const verify = async () => {
      attempts += 1
      try {
        await verifyCheckoutTransaction(transactionId)
        if (cancelled) return
        await Promise.all([refreshSubscription(), refreshSession()])
        if (!cancelled) setState('active')
      } catch (error) {
        if (cancelled) return
        if (attempts < 8) {
          setState('verifying')
          window.setTimeout(verify, 1500)
        } else {
          setState('error')
          setMessage(error instanceof Error ? error.message : 'We could not confirm the subscription yet.')
        }
      }
    }
    void verify()
    return () => { cancelled = true }
  }, [refreshSession, refreshSubscription, transactionId])

  return (
    <DashboardLayout>
      <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">
        <Card className="w-full border-primary/20 shadow-lg shadow-primary/5">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center sm:px-12">
            {state === 'active' ? (
              <>
                <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-600"><CheckCircle2 className="h-10 w-10" /></div>
                <p className="label-caps mt-6">Subscription activated</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome to InvoiceFocus</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Your subscription is now active and your workspace access has been updated.</p>
                <Button className="mt-8 gap-2" onClick={() => navigate('/dashboard')}><span>Continue to Dashboard</span><ArrowRight className="h-4 w-4" /></Button>
              </>
            ) : state === 'error' ? (
              <>
                <div className="rounded-full bg-amber-500/10 p-4 text-amber-600"><CheckCircle2 className="h-10 w-10" /></div>
                <p className="label-caps mt-6">Payment received</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">We’re confirming your subscription</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
                <Button className="mt-8" onClick={() => navigate('/dashboard/billing')}>Open Billing</Button>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-4 text-primary"><Loader2 className="h-10 w-10 animate-spin" /></div>
                <p className="label-caps mt-6">Secure checkout</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Confirming your subscription</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{message || 'Your payment is complete. We are securely confirming the transaction and activating your plan.'}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}