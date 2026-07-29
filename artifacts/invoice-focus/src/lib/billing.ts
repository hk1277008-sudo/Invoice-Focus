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
    amount: item.amount || 0,
    currency: item.currency || 'USD',
    status: (['paid', 'failed', 'pending', 'refunded'].includes(item.status) ? item.status : 'pending') as PaymentHistoryItem['status'],
    description: item.event_type,
  }))
}

type BillingOverview = {
  paymentMethods: PaymentMethod[]
  paymentHistory: Array<{ id: string; occurred_at: string; amount: number | null; currency: string | null; status: string; event_type: string }>
}

export async function getBillingOverview(): Promise<BillingOverview> {
  return request<BillingOverview>('/billing/overview')
}

export async function updateSubscriptionAction(action: 'upgrade' | 'downgrade' | 'cancel' | 'renew' | 'reactivate', planId?: string): Promise<void> {
  await request('/billing/actions', { method: 'POST', body: JSON.stringify({ action, plan: planId }) })
}
