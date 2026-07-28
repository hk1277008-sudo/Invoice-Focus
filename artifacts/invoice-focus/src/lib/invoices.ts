import { supabase } from './supabase'
import type { InvoiceData } from '@/components/invoice/types'

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'

export interface InvoiceRecord {
  id: string
  invoice_number: string
  status: InvoiceStatus
  issue_date: string
  due_date: string | null
  client: string
  company: string
  total: number
  currency: string
  created_at: string
  updated_at: string
  payload?: InvoiceData
}

export interface InvoiceInput {
  clientId?: string | null
  invoiceNumber?: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string | null
  client: string
  company: string
  total: number
  currency: string
  payload: InvoiceData
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
    const error = new Error(body?.error || 'Invoice request failed') as Error & {
      code?: string
      subscription?: unknown
    }
    error.code = body?.code
    error.subscription = body?.subscription
    throw error
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export function invoiceInput(invoice: InvoiceData, total: number): InvoiceInput {
  const status = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].includes(invoice.details.status)
    ? invoice.details.status
    : 'Draft'
  const today = new Date().toISOString().slice(0, 10)
  return {
    invoiceNumber: invoice.details.number,
    clientId: invoice.client.clientId || null,
    status: status as InvoiceStatus,
    issueDate: invoice.details.issueDate || today,
    dueDate: invoice.details.dueDate || null,
    client: invoice.client.name,
    company: invoice.client.companyName || invoice.business.name,
    total,
    currency: invoice.details.currency,
    payload: invoice,
  }
}

export async function listInvoices(filters: {
  search?: string
  status?: InvoiceStatus | 'all'
  sort?: string
  direction?: 'asc' | 'desc'
} = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.direction) params.set('direction', filters.direction)
  return request<{ invoices: InvoiceRecord[] }>(`/invoices?${params}`)
}

export async function getInvoice(id: string) {
  return request<{ invoice: InvoiceRecord }>(`/invoices/${id}`)
}

export async function createInvoice(input: InvoiceInput) {
  return request<{ invoice: InvoiceRecord }>('/invoices', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateInvoice(id: string, input: Partial<InvoiceInput>) {
  return request<{ invoice: InvoiceRecord }>(`/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function duplicateInvoice(id: string) {
  return request<{ invoice: InvoiceRecord }>(`/invoices/${id}/duplicate`, { method: 'POST' })
}

export async function deleteInvoice(id: string) {
  return request<void>(`/invoices/${id}`, { method: 'DELETE' })
}