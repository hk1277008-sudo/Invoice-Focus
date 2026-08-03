import { supabase } from './supabase'
import type { InvoiceStatus, InvoiceRecord } from './invoices'

export interface CurrencyAmount {
  currency: string
  amount: number
}

export interface DashboardOverview {
  range: { start: string | null; end: string | null }
  stats: {
    totalInvoices: number
    draftInvoices: number
    sentInvoices: number
    viewedInvoices: number
    partiallyPaidInvoices: number
    paidInvoices: number
    overdueInvoices: number
    cancelledInvoices: number
    totalRevenue: CurrencyAmount[]
    outstandingAmount: CurrencyAmount[]
    totalClients: number
  }
  revenue: Array<{ date: string; currency: string; amount: number }>
  statusDistribution: Array<{ status: InvoiceStatus; count: number }>
  recentInvoices: InvoiceRecord[]
  recentActivity: Array<{ id: string; invoice_id: string; action: string; description: string; created_at: string }>
  recentClients: Array<{
    id: string
    full_name: string
    company_name: string
    email: string
    created_at: string
    updated_at: string
    invoice_count: number
    outstanding: CurrencyAmount[]
  }>
}

export async function getDashboardOverview(range: { start?: string; end?: string } = {}) {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const params = new URLSearchParams()
  if (range.start) params.set('start', range.start)
  if (range.end) params.set('end', range.end)
  const response = await fetch(`/api/dashboard/overview?${params}`, {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || 'Could not load dashboard overview')
  }
  return response.json() as Promise<DashboardOverview>
}