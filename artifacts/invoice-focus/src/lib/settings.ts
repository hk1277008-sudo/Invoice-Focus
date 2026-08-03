import { getApiBaseUrl, supabase } from './supabase'
import { defaultPresentation, normalizePresentation, type InvoicePresentation } from '@/components/invoice/presentation'

export type ThemeMode = 'system' | 'light' | 'dark'
export type FontSize = 'small' | 'medium' | 'large'

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
  defaultDiscountBehavior: 'none' | 'percentage'
  defaultDiscountPercent: number
  invoiceSentEmails: boolean
  invoiceViewedEmails: boolean
  invoicePaidEmails: boolean
  invoiceOverdueEmails: boolean
  weeklySummaryEmails: boolean
  paymentReminderEmails: boolean
  productUpdates: boolean
  betaAnnouncements: boolean
  securityAlerts: boolean
  marketingEmails: boolean
  theme: ThemeMode
  accountTimezone: string
  accountCountry: string
  workspaceName: string
  workspaceLogo: string
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd'
  numberFormat: '1,234.56' | '1.234,56' | '1 234,56'
  passwordLastChangedAt: string | null
  compactMode: boolean
  fontSize: FontSize
  workspaceAccentColor: string
  recurringDefaultTimezone: string
  recurringDefaultFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
  recurringDefaultDueDateOffset: number
  recurringDefaultInvoiceStatus: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
  recurringDefaultAutoGeneration: boolean
  invoicePresentation: InvoicePresentation
}

export const defaultSettings: UserSettings = {
  businessName: '', businessLogo: '', businessEmail: '', businessPhone: '', website: '',
  taxId: '', registrationNumber: '', address: '', city: '', state: '', postalCode: '', country: '',
  defaultCurrency: 'USD', defaultLanguage: 'English', defaultTaxRate: 0, defaultPaymentTerms: 'Net 30',
  defaultDueDays: 30, invoiceNumberFormat: 'INV-{number}', invoicePrefix: 'INV',
  startingInvoiceNumber: 1, defaultNotes: '', defaultTerms: '', defaultDiscountBehavior: 'none', defaultDiscountPercent: 0, invoiceSentEmails: true,
  invoiceViewedEmails: true, invoicePaidEmails: true, invoiceOverdueEmails: true, weeklySummaryEmails: true,
  paymentReminderEmails: true, productUpdates: true, betaAnnouncements: true, securityAlerts: true, marketingEmails: false, theme: 'system',
  accountTimezone: 'UTC', accountCountry: '', workspaceName: '', workspaceLogo: '', dateFormat: 'MM/dd/yyyy', numberFormat: '1,234.56',
  compactMode: false, fontSize: 'medium', workspaceAccentColor: '#2e5bff',
  passwordLastChangedAt: null,
  recurringDefaultTimezone: 'UTC', recurringDefaultFrequency: 'monthly', recurringDefaultDueDateOffset: 14,
  recurringDefaultInvoiceStatus: 'Draft', recurringDefaultAutoGeneration: true,
  invoicePresentation: {
    template: 'modern', primaryColor: '#2e5bff', accentColor: '#13a6a6', font: 'Inter',
    headerLayout: 'Split', footerLayout: 'Simple', paperSize: 'A4', titleStyle: 'default',
  },
}

function hexToHsl(hex: string) {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16) / 255
  const green = Number.parseInt(value.slice(2, 4), 16) / 255
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  if (max === min) return `0 0% ${Math.round(lightness * 100)}%`
  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue = 0
  if (max === red) hue = ((green - blue) / delta + (green < blue ? 6 : 0)) / 6
  else if (max === green) hue = ((blue - red) / delta + 2) / 6
  else hue = ((red - green) / delta + 4) / 6
  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
}

export function applySettingsAppearance(settings: Pick<UserSettings, 'theme' | 'fontSize' | 'compactMode' | 'workspaceAccentColor'>) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) root.classList.add('dark')
  else root.classList.remove('dark')
  root.dataset.fontSize = settings.fontSize
  root.classList.toggle('compact-mode', settings.compactMode)
  const accent = /^#[0-9a-f]{6}$/i.test(settings.workspaceAccentColor) ? settings.workspaceAccentColor : defaultSettings.workspaceAccentColor
  const accentHsl = hexToHsl(accent)
  root.style.setProperty('--workspace-accent', accent)
  root.style.setProperty('--primary', accentHsl)
  root.style.setProperty('--ring', accentHsl)
  root.style.setProperty('--sidebar-primary', accentHsl)
  root.style.setProperty('--sidebar-ring', accentHsl)
  root.style.setProperty('--chart-1', accentHsl)
}

async function request<T>(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}`, ...(init.headers || {}) },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || 'Settings request failed')
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

const settingsCache = new Map<string, UserSettings>()
const settingsRequests = new Map<string, Promise<UserSettings>>()

export async function getSettings() {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) throw new Error('Your session has expired. Please sign in again.')
  const cached = settingsCache.get(userId)
  if (cached) return cached
  const existingRequest = settingsRequests.get(userId)
  if (existingRequest) return existingRequest
  const requestPromise = request<{ settings: UserSettings | null }>('/settings')
    .then((result) => {
      const normalized = result.settings ? {
        ...defaultSettings,
        ...result.settings,
        invoicePresentation: normalizePresentation(result.settings.invoicePresentation),
      } : defaultSettings
      settingsCache.set(userId, normalized)
      return normalized
    })
    .finally(() => settingsRequests.delete(userId))
  settingsRequests.set(userId, requestPromise)
  return requestPromise
}
export async function saveSettings(settings: UserSettings) {
  const result = await request<{ settings: UserSettings }>('/settings', { method: 'PUT', body: JSON.stringify(settings) })
  const normalized = {
    ...defaultSettings,
    ...result.settings,
    invoicePresentation: normalizePresentation(result.settings?.invoicePresentation ?? defaultPresentation),
  }
  const { data } = await supabase.auth.getSession()
  if (data.session?.user.id) settingsCache.set(data.session.user.id, normalized)
  return normalized
}
export function exportSettingsData() {
  return request<Record<string, unknown>>('/settings/export')
}
export function deleteAccount() {
  return request<void>('/settings/delete-account', { method: 'POST', body: JSON.stringify({ confirmation: 'DELETE MY ACCOUNT' }) })
}
export function deleteWorkspace() {
  return request<void>('/settings/delete-workspace', { method: 'POST', body: JSON.stringify({ confirmation: 'DELETE WORKSPACE' }) })
}