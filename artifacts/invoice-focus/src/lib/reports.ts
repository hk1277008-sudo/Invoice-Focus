import { supabase } from './supabase'

export type ReportPeriod = 'week' | 'month' | 'year'
export interface ReportsOverview {
  range: { start: string | null; end: string | null; period: ReportPeriod }
  summary: {
    totalRevenue: number; outstandingRevenue: number; paidRevenue: number; overdueRevenue: number
    totalInvoices: number; paidInvoices: number; outstandingInvoices: number; overdueInvoices: number
    activeClients: number; averageInvoiceValue: number; averageClientRevenue: number; newClients: number; returningClients: number
  }
  revenue: Array<{ label: string; value: number }>
  invoiceStatus: Array<{ status: string; count: number }>
  topClients: Array<{ name: string; revenue: number; invoices: number; paidInvoices: number }>
  payments: { collectionRate: number; outstandingBalance: number; paidAmount: number; partialPayments: number; monthlyCollections: Array<{ label: string; value: number }> }
  kpis: { monthlyRevenue: number; annualRevenue: number; averageInvoiceValue: number; averagePaymentTime: number; invoiceConversionRate: number; collectionPercentage: number; clientGrowth: number; revenueGrowth: number }
}

export async function getReportsOverview(range: { start?: string; end?: string; period?: ReportPeriod } = {}) {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const params = new URLSearchParams()
  Object.entries(range).forEach(([key, value]) => { if (value) params.set(key, value) })
  const response = await fetch(`/api/reports/overview?${params}`, { headers: { Authorization: `Bearer ${data.session.access_token}` } })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || 'Could not load reports')
  }
  return response.json() as Promise<ReportsOverview>
}