import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, CircleAlert, Loader2, RefreshCw } from 'lucide-react'
import { useLocation } from 'wouter'
import { DashboardLayout } from '../../layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { abandonCheckoutTransaction, verifyCheckoutTransaction } from '@/lib/billing'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { useAuth } from '@/hooks/useAuth'

type VerificationState = 'waiting' | 'active' | 'pending' | 'cancelled' | 'failed' | 'expired'

export default function BillingSuccessPage() {
  const [location, navigate] = useLocation()
  const { refreshSubscription } = useSubscription()
  const { refreshSession } = useAuth()
  const checkout = useMemo(() => {
    const params = new URLSearchParams(location.split('?')[1] || '')
    return {
      transactionId: params.get('transaction_id'),
      state: params.get('checkout_state'),
    }
  }, [location])
  const transactionId = checkout.transactionId
  const initialState: VerificationState = checkout.state === 'cancelled'
    ? 'cancelled'
    : checkout.state === 'failed'
      ? 'failed'
      : transactionId && ['completed', 'verification'].includes(checkout.state || '')
        ? 'waiting'
        : 'cancelled'
  const [state, setState] = useState<VerificationState>(initialState)
  const [plan, setPlan] = useState<'pro' | 'premium' | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startedAt = useRef(Date.now())
  const foregroundTimer = useRef<number | null>(null)
  const deadlineTimer = useRef<number | null>(null)
  const stateRef = useRef<VerificationState>(initialState)

  const setVerificationState = useCallback((next: VerificationState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const verify = useCallback(async (foreground = false) => {
    if (!transactionId) {
      setVerificationState('cancelled')
      return
    }
    if (foreground) setIsRefreshing(true)
    try {
      const result = await verifyCheckoutTransaction(transactionId)
      if (result.status === 'active' && result.subscription) {
        const verifiedPlan = (result.subscription as { plan?: string }).plan
        if (verifiedPlan === 'pro' || verifiedPlan === 'premium') setPlan(verifiedPlan)
        await Promise.all([refreshSubscription(), refreshSession()])
        sessionStorage.removeItem('invoicefocus_pending_transaction_id')
        setVerificationState('active')
      } else if (result.status === 'pending') {
        setVerificationState('pending')
      } else if (result.status === 'expired') {
        setVerificationState('expired')
      } else {
        setVerificationState('failed')
      }
    } catch (error) {
      const verificationError = error as Error & { code?: string; status?: number }
      if (verificationError.code === 'PAYMENT_EXPIRED') {
        setVerificationState('expired')
      } else if (verificationError.code === 'PAYMENT_FAILED') {
        setVerificationState('failed')
      } else if (!foreground) {
        setVerificationState('pending')
      }
    } finally {
      if (foreground) setIsRefreshing(false)
    }
  }, [refreshSession, refreshSubscription, setVerificationState, transactionId])

  useEffect(() => {
    if (!transactionId) return
    let cancelled = false
    startedAt.current = Date.now()
    stateRef.current = 'waiting'
    setVerificationState('waiting')
    deadlineTimer.current = window.setTimeout(() => {
      if (!cancelled && stateRef.current === 'waiting') setVerificationState('pending')
    }, 10_000)
    const foregroundVerify = async () => {
      if (cancelled) return
      await verify(true)
       if (cancelled || ['active', 'failed', 'expired', 'cancelled'].includes(stateRef.current)) return
      if (Date.now() - startedAt.current >= 10_000) {
        setVerificationState('pending')
        return
      }
      foregroundTimer.current = window.setTimeout(foregroundVerify, 1500)
    }
    void foregroundVerify()
    return () => {
      cancelled = true
      if (foregroundTimer.current) window.clearTimeout(foregroundTimer.current)
      if (deadlineTimer.current) window.clearTimeout(deadlineTimer.current)
    }
  }, [setVerificationState, transactionId, verify])

  useEffect(() => {
    if (!transactionId || !['cancelled', 'failed', 'expired'].includes(initialState)) return
    sessionStorage.removeItem('invoicefocus_pending_transaction_id')
    void abandonCheckoutTransaction(transactionId).catch(() => undefined)
  }, [initialState, transactionId])

  useEffect(() => {
    if (!transactionId || ['active', 'failed', 'expired', 'cancelled'].includes(state)) return
    const interval = window.setInterval(() => {
      void verify()
    }, 5000)
    return () => window.clearInterval(interval)
  }, [state, transactionId, verify])

  return (
    <DashboardLayout>
      <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">
        <Card className="w-full border-primary/20 shadow-lg shadow-primary/5">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center sm:px-12">
            {state === 'active' ? (
              <>
                <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-600"><CheckCircle2 className="h-10 w-10" /></div>
                <p className="label-caps mt-6">Payment successful</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome to InvoiceFocus {plan === 'premium' ? 'Premium' : 'Pro'}</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Your subscription is now active and your workspace has been upgraded.</p>
                <Button className="mt-8 gap-2" onClick={() => navigate('/dashboard')}><span>Continue to Dashboard</span><ArrowRight className="h-4 w-4" /></Button>
              </>
            ) : state === 'cancelled' ? (
              <>
                <div className="rounded-full bg-muted p-4 text-muted-foreground"><CircleAlert className="h-10 w-10" /></div>
                <p className="label-caps mt-6">Checkout cancelled</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">No payment was completed</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Your checkout was closed before Paddle confirmed a payment. No subscription was activated.</p>
                <Button className="mt-8" onClick={() => navigate('/dashboard/billing')}>Return to Billing</Button>
              </>
            ) : state === 'expired' ? (
              <>
                <div className="rounded-full bg-muted p-4 text-muted-foreground"><CircleAlert className="h-10 w-10" /></div>
                <p className="label-caps mt-6">Checkout expired</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">This checkout session expired</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">No subscription was activated. Return to Billing to start a new secure checkout.</p>
                <Button className="mt-8" onClick={() => navigate('/dashboard/billing')}>Return to Billing</Button>
              </>
            ) : state === 'failed' ? (
              <>
                <div className="rounded-full bg-destructive/10 p-4 text-destructive"><CircleAlert className="h-10 w-10" /></div>
                <p className="label-caps mt-6">Payment not confirmed</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">We couldn’t activate your subscription</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">No subscription was activated. You can return to Billing and try again or manage your existing plan.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
                  <Button onClick={() => navigate('/dashboard/billing')}>Open Billing</Button>
                </div>
              </>
            ) : state === 'pending' ? (
              <>
                <div className="rounded-full bg-amber-500/10 p-4 text-amber-600"><CircleAlert className="h-10 w-10" /></div>
                <p className="label-caps mt-6">Checkout still processing</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Paddle has not confirmed this checkout yet</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">No subscription has been activated. You can check again shortly or return to Billing.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => void verify(true)} disabled={isRefreshing} className="gap-2">{isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Refresh Status</Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-4 text-primary"><Loader2 className="h-10 w-10 animate-spin" /></div>
                <p className="label-caps mt-6">Secure checkout</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">Confirming your subscription</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">We’re checking the checkout with Paddle. Your plan will only activate after successful payment confirmation.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}