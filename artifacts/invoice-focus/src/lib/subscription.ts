import { supabase } from './supabase'

export type PlanId = 'free' | 'pro' | 'premium'
export type BillingCycle = 'monthly' | 'yearly'
export type FeatureKey =
  | 'unlimitedInvoices' | 'unlimitedClients' | 'recurringInvoices' | 'advancedTemplates'
  | 'invoiceStatusTracking' | 'paymentReminders' | 'businessInsights' | 'dataExport'
  | 'multipleBusinesses' | 'teamCollaboration' | 'rolesPermissions' | 'advancedAnalytics'
  | 'apiAccess' | 'integrations' | 'auditLogs' | 'earlyAccess'

export interface Subscription {
  plan: PlanId
  planName: string
  billingCycle: BillingCycle
  status: string
  startedAt: string | null
  renewalDate: string | null
  invoiceCountThisMonth: number
  lastResetDate: string | null
  invoiceLimit: number | null
  invoiceRemaining: number | null
  featurePermissions: Record<FeatureKey, boolean>
  catalog: {
    name: string
    price: string
    monthlyPrice: number
    yearlyPrice: number
    invoiceLimit: number | null
    features: string[]
  }
}

export const fallbackSubscription: Subscription = {
  plan: 'free', planName: 'Free', billingCycle: 'monthly', status: 'active',
  startedAt: null, renewalDate: null, invoiceCountThisMonth: 0, lastResetDate: null,
  invoiceLimit: 15, invoiceRemaining: 15,
  featurePermissions: Object.fromEntries([
    'unlimitedInvoices', 'unlimitedClients', 'recurringInvoices', 'advancedTemplates',
    'invoiceStatusTracking', 'paymentReminders', 'businessInsights', 'dataExport',
    'multipleBusinesses', 'teamCollaboration', 'rolesPermissions', 'advancedAnalytics',
    'apiAccess', 'integrations', 'auditLogs', 'earlyAccess',
  ].map((key) => [key, false])) as Record<FeatureKey, boolean>,
  catalog: { name: 'Free', price: 'Free Forever', monthlyPrice: 0, yearlyPrice: 0, invoiceLimit: 15, features: [] },
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}`, ...(init?.headers || {}) },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(body?.error || 'Subscription request failed') as Error & { code?: string; subscription?: Subscription }
    error.code = body?.code
    error.subscription = body?.subscription
    throw error
  }
  return body as T
}

export async function getSubscription() {
  const result = await request<{ subscription: Subscription }>('/subscriptions/me')
  return result.subscription
}
export async function getPlanCatalog() {
  return request<{ plans: Record<PlanId, Subscription['catalog']> }>('/subscriptions/catalog')
}
export async function previewUpgrade(plan: PlanId, billingCycle: BillingCycle) {
  return request<{ plan: PlanId; billingCycle: BillingCycle; price: number; paymentRequired: boolean; checkoutReady: boolean }>('/subscriptions/preview', {
    method: 'POST', body: JSON.stringify({ plan, billingCycle }),
  })
}