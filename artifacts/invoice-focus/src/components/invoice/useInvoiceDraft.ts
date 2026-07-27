import { useEffect, useRef, useState, useCallback } from 'react'
import type { InvoiceData } from './types'

const DRAFT_KEY = 'invoice-focus-draft-v1'

export interface DraftStatus {
  status: 'saved' | 'saving' | 'idle'
  lastSavedAt: number | null
}

export function useInvoiceDraft(invoice: InvoiceData) {
  const [draftStatus, setDraftStatus] = useState<DraftStatus>({ status: 'idle', lastSavedAt: null })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveDraft = useCallback(() => {
    try {
      const data = JSON.stringify(invoice)
      localStorage.setItem(DRAFT_KEY, data)
      setDraftStatus({ status: 'saved', lastSavedAt: Date.now() })
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [invoice])

  useEffect(() => {
    setDraftStatus((prev) => (prev.status === 'saved' ? { ...prev, status: 'saving' } : prev))
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      saveDraft()
    }, 800)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [invoice, saveDraft])

  return { draftStatus }
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
