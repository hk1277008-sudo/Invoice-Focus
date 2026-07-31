import { supabase } from './supabase'
import type { UserSettings } from './settings'
import type { ClientInput } from './clients'
import type { InvoiceData } from '@/components/invoice/types'

export interface OnboardingBusinessProfile {
  businessName: string
  businessLogo: string
  businessEmail: string
  businessPhone: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface OnboardingClientDraft {
  id?: string
  fullName: string
  companyName: string
  email: string
  phone: string
}

export interface OnboardingState {
  completed: boolean
  currentStep: number
  businessProfile?: OnboardingBusinessProfile | null
  firstClient?: OnboardingClientDraft | null
  firstInvoice?: { description: string; quantity: string; price: string } | null
  skipped: boolean
  needsOnboarding?: boolean
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}`, ...(init.headers || {}) },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || 'Onboarding request failed')
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export function getOnboarding() {
  return request<{ onboarding: OnboardingState }>('/onboarding')
}

export function saveOnboarding(state: Partial<OnboardingState>) {
  return request<{ onboarding: OnboardingState }>('/onboarding', { method: 'PUT', body: JSON.stringify(state) })
}

export function skipOnboarding() {
  return request<{ onboarding: OnboardingState }>('/onboarding/skip', { method: 'POST' })
}

export function completeOnboarding() {
  return request<{ onboarding: OnboardingState }>('/onboarding/complete', { method: 'POST' })
}
