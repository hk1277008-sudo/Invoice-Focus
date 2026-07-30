import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

const REMEMBER_ME_KEY = 'invoicefocus-remember-me'
let rememberMe = typeof window !== 'undefined' && window.localStorage.getItem(REMEMBER_ME_KEY) === 'true'

export function setRememberMe(value: boolean) {
  rememberMe = value
  if (value) window.localStorage.setItem(REMEMBER_ME_KEY, 'true')
  else window.localStorage.removeItem(REMEMBER_ME_KEY)
}

export function getRememberMe() {
  return rememberMe
}

const customStorage = {
  getItem: (key: string): string | null => {
    const storage = rememberMe ? window.localStorage : window.sessionStorage
    return storage.getItem(key)
  },
  setItem: (key: string, value: string): void => {
    const storage = rememberMe ? window.localStorage : window.sessionStorage
    storage.setItem(key, value)
  },
  removeItem: (key: string): void => {
    const storage = rememberMe ? window.localStorage : window.sessionStorage
    storage.removeItem(key)
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
  // For artifact-routed apps, use the current origin with the base path.
  return import.meta.env.BASE_URL.replace(/\/$/, '')
}
