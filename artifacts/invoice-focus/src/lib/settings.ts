import { supabase } from './supabase'

export type ThemeMode = 'system' | 'light' | 'dark'

export interface UserSettings {
  businessName: string
  businessLogo: string
  businessEmail: string
  businessPhone: string
  website: string
  taxId: string
  registrationNumber: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  defaultCurrency: string
  defaultLanguage: string
  defaultTaxRate: number
  defaultPaymentTerms: string
  defaultDueDays: number
  invoiceNumberFormat: string
  invoicePrefix: string
  startingInvoiceNumber: number
  defaultNotes: string
  defaultTerms: string
  invoiceSentEmails: boolean
  paymentReminderEmails: boolean
  productUpdates: boolean
  securityAlerts: boolean
  marketingEmails: boolean
  theme: ThemeMode
  recurringDefaultTimezone: string
  recurringDefaultFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  recurringDefaultDueDateOffset: number
  recurringDefaultInvoiceStatus: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
  recurringDefaultAutoGeneration: boolean
}

export const defaultSettings: UserSettings = {
  businessName: '', businessLogo: '', businessEmail: '', businessPhone: '', website: '',
  taxId: '', registrationNumber: '', address: '', city: '', state: '', postalCode: '', country: '',
  defaultCurrency: 'USD', defaultLanguage: 'English', defaultTaxRate: 0, defaultPaymentTerms: 'Net 30',
  defaultDueDays: 30, invoiceNumberFormat: 'INV-{number}', invoicePrefix: 'INV',
  startingInvoiceNumber: 1, defaultNotes: '', defaultTerms: '', invoiceSentEmails: true,
  paymentReminderEmails: true, productUpdates: true, securityAlerts: true, marketingEmails: false, theme: 'system',
  recurringDefaultTimezone: 'UTC', recurringDefaultFrequency: 'monthly', recurringDefaultDueDateOffset: 14,
  recurringDefaultInvoiceStatus: 'Draft', recurringDefaultAutoGeneration: true,
}

async function request<T>(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}`, ...(init.headers || {}) },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || 'Settings request failed')
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export async function getSettings() {
  const result = await request<{ settings: UserSettings | null }>('/settings')
  return result.settings ? { ...defaultSettings, ...result.settings } : defaultSettings
}
export function saveSettings(settings: UserSettings) {
  return request<{ settings: UserSettings }>('/settings', { method: 'PUT', body: JSON.stringify(settings) })
}
export function exportSettingsData() {
  return request<Record<string, unknown>>('/settings/export')
}
export function deleteAccount() {
  return request<void>('/settings/delete-account', { method: 'POST', body: JSON.stringify({ confirmation: 'DELETE MY ACCOUNT' }) })
}