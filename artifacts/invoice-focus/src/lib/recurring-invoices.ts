import { supabase } from './supabase'
import type { InvoiceData } from '@/components/invoice/types'

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
export type RecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface RecurringInvoice {
  id: string
  user_id: string
  client_id: string | null
  client_name: string
  frequency: RecurringFrequency
  interval_count: number
  start_date: string
  end_date: string | null
  next_run_date: string
  last_generated_at: string | null
  timezone: string
  due_date_offset: number
  auto_invoice_number: boolean
  auto_generation: boolean
  invoice_status: 'Draft' | 'Sent' | 'Viewed' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled'
  status: RecurringStatus
  template_data: InvoiceData
  generated_invoice_count: number
  created_at: string
  updated_at: string
}

export type RecurringInvoiceInput = Partial<
  Omit<
    RecurringInvoice,
    | 'id'
    | 'user_id'
    | 'next_run_date'
    | 'last_generated_at'
    | 'status'
    | 'generated_invoice_count'
    | 'created_at'
    | 'updated_at'
  >
> & {
  client_name: string
  frequency: RecurringFrequency
  interval_count: number
  start_date: string
  timezone: string
  due_date_offset: number
  auto_invoice_number: boolean
  auto_generation?: boolean
  invoice_status?: 'Draft' | 'Sent' | 'Viewed' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled'
  template_data: InvoiceData
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Your session has expired. Please sign in again.')

  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const error = new Error(body?.error || 'Request failed') as Error & { code?: string }
    error.code = body?.code
    throw error
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export async function listRecurringInvoices(
  filters: {
    search?: string
    status?: RecurringStatus | 'all'
    frequency?: RecurringFrequency | 'all'
    sort?: string
    direction?: 'asc' | 'desc'
  } = {}
) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters.frequency && filters.frequency !== 'all') params.set('frequency', filters.frequency)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.direction) params.set('direction', filters.direction)
  return request<{ recurringInvoices: RecurringInvoice[] }>(`/recurring-invoices?${params}`)
}

export async function getRecurringInvoice(id: string) {
  return request<{ recurringInvoice: RecurringInvoice }>(`/recurring-invoices/${id}`)
}

export async function createRecurringInvoice(input: RecurringInvoiceInput) {
  return request<{ recurringInvoice: RecurringInvoice }>('/recurring-invoices', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateRecurringInvoice(id: string, input: Partial<RecurringInvoiceInput>) {
  return request<{ recurringInvoice: RecurringInvoice }>(`/recurring-invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function pauseRecurringInvoice(id: string) {
  return request<{ recurringInvoice: RecurringInvoice }>(`/recurring-invoices/${id}/pause`, { method: 'POST' })
}

export async function resumeRecurringInvoice(id: string) {
  return request<{ recurringInvoice: RecurringInvoice }>(`/recurring-invoices/${id}/resume`, { method: 'POST' })
}

export async function cancelRecurringInvoice(id: string) {
  return request<{ recurringInvoice: RecurringInvoice }>(`/recurring-invoices/${id}/cancel`, { method: 'POST' })
}

export async function duplicateRecurringInvoice(id: string) {
  return request<{ recurringInvoice: RecurringInvoice }>(`/recurring-invoices/${id}/duplicate`, { method: 'POST' })
}

export async function deleteRecurringInvoice(id: string) {
  return request<void>(`/recurring-invoices/${id}`, { method: 'DELETE' })
}
