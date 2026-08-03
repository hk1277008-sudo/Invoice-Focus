import { getApiBaseUrl, supabase } from './supabase'

export interface NotificationRecord {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

async function request<T>(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}`, ...(init?.headers || {}) },
  })
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Notification request failed')
  return response.json() as Promise<T>
}

export function getNotifications() {
  return request<{ notifications: NotificationRecord[] }>('/notifications')
}

export function markNotificationRead(id: string) {
  return request<{ notification: NotificationRecord }>(`/notifications/${id}/read`, { method: 'POST' })
}