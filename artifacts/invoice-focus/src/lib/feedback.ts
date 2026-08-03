import { getApiBaseUrl, supabase } from './supabase'

export type FeedbackCategory = 'bug' | 'feature_request' | 'general_feedback' | 'improvement'

export interface FeedbackInput {
  rating?: number
  category?: FeedbackCategory
  message: string
  email?: string
  screenshotUrl?: string
  metadata?: {
    browser?: string
    device?: string
    screenSize?: string
    currentPage?: string
    appVersion?: string
  }
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
    throw new Error(body?.error || 'Feedback request failed')
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export function submitFeedback(input: FeedbackInput) {
  const metadata = {
    browser: navigator.userAgent,
    device: /iPad|Tablet/i.test(navigator.userAgent) ? 'Tablet' : /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    screenSize: `${window.screen.width}x${window.screen.height}`,
    currentPage: window.location.pathname,
    appVersion: 'private-beta',
    ...input.metadata,
  }
  return request<{ feedback: { id: string; created_at: string } }>('/feedback', {
    method: 'POST',
    body: JSON.stringify({ ...input, metadata }),
  })
}

export async function uploadFeedbackScreenshot(file: File): Promise<string> {
  if (!file.type.startsWith('image/') || file.size > 5_000_000) {
    throw new Error('Please upload an image smaller than 5MB.')
  }
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const formData = new FormData()
  formData.append('screenshot', file)
  const response = await fetch(`${getApiBaseUrl()}/api/feedback/screenshot`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    body: formData,
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.url) throw new Error(body?.error || 'Could not upload screenshot')
  return body.url
}
