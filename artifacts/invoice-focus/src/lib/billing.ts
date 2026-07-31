import { supabase } from './supabase'

export type PaymentMethod = {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

export type PaymentHistoryItem = {
  id: string
  date: string
  invoiceNumber: string
  plan: string
  amount: number
  currency: string
  status: 'paid' | 'failed' | 'pending' | 'refunded'
  description: string
  invoiceUrl?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}`, ...(init?.headers || {}) },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error || 'Billing request failed')
  return body as T
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return (await getBillingOverview()).paymentMethods
}

export async function getPaymentHistory(): Promise<PaymentHistoryItem[]> {
  const response = await getBillingOverview()
  return response.paymentHistory.map((item) => ({
    id: item.id,
    date: item.occurred_at,
    invoiceNumber: item.invoice_number || `IF-${item.id.slice(0, 8).toUpperCase()}`,
    plan: item.plan || 'InvoiceFocus',
    amount: item.amount || 0,
    currency: item.currency || 'USD',
    status: (['paid', 'failed', 'pending', 'refunded'].includes(item.status) ? item.status : 'pending') as PaymentHistoryItem['status'],
    description: item.event_type,
    invoiceUrl: item.receipt_url || undefined,
  }))
}

type BillingOverview = {
  paymentMethods: PaymentMethod[]
  paymentHistory: Array<{ id: string; occurred_at: string; amount: number | null; currency: string | null; status: string; event_type: string; invoice_number?: string | null; plan?: string | null; receipt_url?: string | null }>
}

export async function getBillingOverview(): Promise<BillingOverview> {
  return request<BillingOverview>('/billing/overview')
}

export async function updateSubscriptionAction(action: 'upgrade' | 'downgrade' | 'cancel' | 'renew' | 'reactivate', planId?: string, billingCycle: 'monthly' | 'yearly' = 'monthly') {
  return request<{ subscription: unknown }>('/billing/actions', { method: 'POST', body: JSON.stringify({ action, plan: planId, billingCycle }) })
}

export async function createCheckout(plan: string, billingCycle: 'monthly' | 'yearly') {
  return request<{ checkoutUrl: string | null; transactionId?: string | null; clientToken?: string | null; priceId?: string | null; environment?: 'sandbox' | 'production'; status: string; provider: string; message?: string }>('/billing/checkout', {
    method: 'POST', body: JSON.stringify({ plan, billingCycle, returnUrl: window.location.href }),
  })
}

export async function openBillingPortal() {
  return request<{ portalUrl: string | null; status: string; provider: string; message?: string }>('/billing/portal', {
    method: 'POST', body: JSON.stringify({ returnUrl: window.location.href }),
  })
}
