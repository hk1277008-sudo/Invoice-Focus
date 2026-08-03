import { supabase } from './supabase'

export type ReportPeriod = 'week' | 'month' | 'year'
export interface CurrencyAmount { currency: string; amount: number }
export interface CurrencyRate { currency: string; value: number }
export interface ReportsOverview {
  range: { start: string | null; end: string | null; period: ReportPeriod }
  summary: {
    totalRevenue: CurrencyAmount[]; outstandingRevenue: CurrencyAmount[]; paidRevenue: CurrencyAmount[]; overdueRevenue: CurrencyAmount[]
    totalInvoices: number; paidInvoices: number; outstandingInvoices: number; overdueInvoices: number
    activeClients: number; averageInvoiceValue: CurrencyAmount[]; averageClientRevenue: CurrencyAmount[]; newClients: number; returningClients: number
  }
  revenue: Array<{ label: string; currency: string; value: number }>
  invoiceStatus: Array<{ status: string; count: number }>
  topClients: Array<{ name: string; revenue: CurrencyAmount[]; invoices: number; paidInvoices: number }>
  payments: { collectionRate: CurrencyRate[]; outstandingBalance: CurrencyAmount[]; paidAmount: CurrencyAmount[]; partialPayments: number; monthlyCollections: Array<{ label: string; currency: string; value: number }> }
  kpis: { monthlyRevenue: CurrencyAmount[]; annualRevenue: CurrencyAmount[]; averageInvoiceValue: CurrencyAmount[]; averagePaymentTime: number; invoiceConversionRate: number; collectionPercentage: CurrencyRate[]; clientGrowth: number; revenueGrowth: CurrencyRate[] }
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