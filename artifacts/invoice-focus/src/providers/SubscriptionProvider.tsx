import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fallbackSubscription, getSubscription, type FeatureKey, type Subscription } from '@/lib/subscription'
import { useAuth } from '@/hooks/useAuth'

interface SubscriptionContextValue {
  subscription: Subscription
  isLoading: boolean
  refreshSubscription: () => Promise<void>
  hasFeature: (feature: FeatureKey) => boolean
  isAtInvoiceLimit: boolean
}
const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState(fallbackSubscription)
  const [isLoading, setIsLoading] = useState(true)
  const refreshSubscription = useCallback(async () => {
    try { setSubscription(await getSubscription()) } catch { setSubscription(fallbackSubscription) }
    finally { setIsLoading(false) }
  }, [])
  useEffect(() => {
    if (!authLoading) void refreshSubscription()
  }, [authLoading, refreshSubscription, user?.id])
  const value = useMemo(() => ({
    subscription, isLoading, refreshSubscription,
    hasFeature: (feature: FeatureKey) => subscription.featurePermissions[feature] === true,
    isAtInvoiceLimit: subscription.invoiceLimit !== null && (subscription.invoiceRemaining ?? 0) <= 0,
  }), [isLoading, refreshSubscription, subscription])
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}
export function useSubscription() {
  const value = useContext(SubscriptionContext)
  if (!value) throw new Error('useSubscription must be used inside SubscriptionProvider')
  return value
}