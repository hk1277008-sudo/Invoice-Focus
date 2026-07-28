import { useMemo } from 'react'
import type { InvoiceData, InvoiceItem } from './types'
import { parseNumber } from './utils'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ValidationError {
  field: string
  message: string
}

export interface InvoiceValidation {
  errors: ValidationError[]
  fieldErrors: Record<string, string>
  isValid: boolean
}

function validateEmail(email: string, fieldName: string): string | null {
  if (!email.trim()) return null
  return EMAIL_REGEX.test(email) ? null : `Please enter a valid ${fieldName}`
}

function validateItem(item: InvoiceItem, index: number): ValidationError[] {
  const errors: ValidationError[] = []
  const hasName = item.name.trim().length > 0
  const quantity = parseNumber(item.quantity)
  const unitPrice = parseNumber(item.unitPrice)

  if (hasName || quantity > 0 || unitPrice > 0) {
    if (!hasName) {
      errors.push({ field: `item-${index}-name`, message: 'Item name is required' })
    }
    if (quantity <= 0) {
      errors.push({ field: `item-${index}-quantity`, message: 'Quantity must be greater than 0' })
    }
    if (unitPrice <= 0) {
      errors.push({ field: `item-${index}-price`, message: 'Unit price must be greater than 0' })
    }
  }

  return errors
}

export function useInvoiceValidation(invoice: InvoiceData): InvoiceValidation {
  return useMemo(() => {
    const errors: ValidationError[] = []

    if (!invoice.business.name.trim()) {
      errors.push({ field: 'business-name', message: 'Business name is required' })
    }
    if (!invoice.client.name.trim()) {
      errors.push({ field: 'client-name', message: 'Client name is required' })
    }
    if (!invoice.details.issueDate) {
      errors.push({ field: 'issue-date', message: 'Invoice date is required' })
    }

    const businessEmailError = validateEmail(invoice.business.email, 'business email')
    if (businessEmailError) {
      errors.push({ field: 'business-email', message: businessEmailError })
    }
    const clientEmailError = validateEmail(invoice.client.email, 'client email')
    if (clientEmailError) {
      errors.push({ field: 'client-email', message: clientEmailError })
    }

    if (!invoice.details.dueDate) {
      errors.push({ field: 'due-date', message: 'Due date is required' })
    }
    if (!invoice.details.currency) {
      errors.push({ field: 'currency', message: 'Currency is required' })
    }

    invoice.items.forEach((item, index) => {
      errors.push(...validateItem(item, index))
    })

    const fieldErrors: Record<string, string> = {}
    for (const error of errors) {
      fieldErrors[error.field] = error.message
    }

    return { errors, fieldErrors, isValid: errors.length === 0 }
  }, [invoice])
}
