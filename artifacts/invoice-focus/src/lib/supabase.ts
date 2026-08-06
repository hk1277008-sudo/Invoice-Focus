import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}
// Kept as harmless placeholders so the Login page checkbox still works visually.
// Storage is now always localStorage, so this no longer changes real behavior.
export function setRememberMe(_value: boolean) {
  // no-op — intentionally does nothing now
}
export function getRememberMe() {
  return true
}
const customStorage = {
  getItem: (key: string): string | null => {
    return window.localStorage.getItem(key)
  },
  setItem: (key: string, value: string): void => {
    window.localStorage.setItem(key, value)
  },
  removeItem: (key: string): void => {
    window.localStorage.removeItem(key)
  },
}
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
export function getApiBaseUrl(): string {
  const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl.replace(/\/+$/, '')
  }
  // Keep Replit's artifact proxy working locally while allowing Vercel to
  // point directly at the separately hosted Express API in production.
  return import.meta.env.BASE_URL.replace(/\/$/, '')
}
