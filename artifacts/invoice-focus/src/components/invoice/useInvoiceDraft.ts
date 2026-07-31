import { useEffect, useRef } from 'react'
import type { InvoiceData } from './types'

const DRAFT_KEY = 'invoice-focus-draft-v1'

export function useInvoiceDraft(invoice: InvoiceData) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(invoice))
      } catch (error) {
        console.error('Failed to save draft:', error)
      }
    }, 800)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [invoice])
}

export function loadDraft(): InvoiceData | null {
  try {
    const data = localStorage.getItem(DRAFT_KEY)
    if (!data) return null
    return JSON.parse(data) as InvoiceData
  } catch (error) {
    console.error('Failed to load draft:', error)
    return null
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch (error) {
    console.error('Failed to clear draft:', error)
  }
}
