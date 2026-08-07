import { getApiBaseUrl, supabase } from './supabase'
import type { CurrencyAmount } from './dashboard'

export interface ClientRecord {
  id: string
  full_name: string
  company_name: string
  email: string
  phone: string
  billing_address: string
  city: string
  state: string
  postal_code: string
  country: string
  tax_id: string
  notes: string
  created_at: string
  updated_at: string
}

export interface ClientInput {
  fullName: string
  companyName: string
  email: string
  phone: string
  billingAddress: string
  city: string
  state: string
  postalCode: string
  country: string
  taxId: string
  notes: string
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}`, ...(init.headers || {}) },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || 'Client request failed')
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export function listClients(filters: { search?: string; sort?: string; direction?: 'asc' | 'desc' } = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.direction) params.set('direction', filters.direction)
  return request<{ clients: ClientRecord[] }>(`/clients?${params}`)
}

export function getClient(id: string) {
  return request<{
    client: ClientRecord
    stats: { invoiceCount: number; totalInvoiced: CurrencyAmount[]; totalPaid: CurrencyAmount[]; outstanding: CurrencyAmount[] }
    businessCurrency: string
    excludedCurrencies: string[]
    recentInvoices: Array<{ id: string; invoice_number: string; status: string; issue_date: string; total: number; currency: string }>
  }>(`/clients/${id}`)
}

export function createClient(input: ClientInput) {
  return request<{ client: ClientRecord }>('/clients', { method: 'POST', body: JSON.stringify(input) })
}

export function updateClient(id: string, input: Partial<ClientInput>) {
  return request<{ client: ClientRecord }>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function deleteClient(id: string) {
  return request<void>(`/clients/${id}`, { method: 'DELETE' })
}