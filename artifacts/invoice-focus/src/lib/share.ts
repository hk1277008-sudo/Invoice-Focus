import type { InvoiceData } from '@/components/invoice/types'

export interface PublicSharedInvoice {
  invoice_number: string
  status: string
  issue_date: string
  due_date: string | null
  total: number
  currency: string
  payload: InvoiceData
}

export interface ShareTokenRecord {
  id: string
  enabled: boolean
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  lastAccessedAt: string | null
  accessCount: number
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error || 'Share link request failed')
  return body as T
}

export function getPublicSharedInvoice(token: string) {
  return request<{ invoice: PublicSharedInvoice }>(`/share/${encodeURIComponent(token)}`)
}

export async function createShareToken(id: string, expiresAt?: string | null) {
  return request<{ shareToken: ShareTokenRecord; token: string }>(`/invoices/${id}/share-tokens`, { method: 'POST', body: JSON.stringify({ expiresAt }) })
}

export async function regenerateShareToken(id: string, expiresAt?: string | null) {
  return request<{ shareToken: ShareTokenRecord; token: string }>(`/invoices/${id}/share-tokens/regenerate`, { method: 'POST', body: JSON.stringify({ expiresAt }) })
}

export function listShareTokens(id: string) {
  return request<{ shareTokens: ShareTokenRecord[] }>(`/invoices/${id}/share-tokens`)
}

export function updateShareToken(id: string, tokenId: string, input: { enabled?: boolean; expiresAt?: string | null; revoked?: boolean }) {
  return request<{ shareToken: ShareTokenRecord }>(`/invoices/${id}/share-tokens/${tokenId}`, { method: 'PATCH', body: JSON.stringify(input) })
}