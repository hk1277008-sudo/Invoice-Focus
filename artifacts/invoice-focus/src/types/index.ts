// ─── Core domain types ────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  ref: string             // e.g. "INV-2024-001"
  clientId: string
  workspaceId: string
  status: InvoiceStatus
  issueDate: string       // ISO 8601 date string
  dueDate: string
  lineItems: LineItem[]
  subtotal: number
  taxRate: number         // percentage, e.g. 20 for 20%
  taxAmount: number
  total: number
  currency: string        // ISO 4217, e.g. "USD"
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  workspaceId: string
  name: string
  email: string
  company?: string
  address?: string
  currency: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface Workspace {
  id: string
  name: string
  logoUrl?: string
  currency: string
  taxRate: number
  createdAt: string
}

// ─── API utility types ────────────────────────────────────────────────────────

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number }
