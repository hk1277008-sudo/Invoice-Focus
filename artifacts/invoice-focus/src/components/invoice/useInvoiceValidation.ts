import { useMemo } from 'react'
import type { InvoiceData, InvoiceItem } from './types'
import { parseNumber } from './utils'
import { normalizeDocumentType } from './document-types'

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

export function validateInvoice(invoice: InvoiceData): InvoiceValidation {
  const errors: ValidationError[] = []

  if (!invoice.business.name.trim()) {
    errors.push({ field: 'business-name', message: 'Business name is required' })
  }
  if (!invoice.client.name.trim()) {
    errors.push({ field: 'client-name', message: 'Client name is required' })
  }
  if (!invoice.details.issueDate) {
    errors.push({ field: 'issue-date', message: 'Issue date is required' })
  }
  const documentType = normalizeDocumentType(invoice.documentType)
  if (!invoice.details.dueDate && !['receipt', 'credit-note', 'purchase-order'].includes(documentType)) {
    errors.push({ field: 'due-date', message: 'Due date is required' })
  }
  const businessEmailError = validateEmail(invoice.business.email, 'business email')
  if (businessEmailError) {
    errors.push({ field: 'business-email', message: businessEmailError })
  }
  const clientEmailError = validateEmail(invoice.client.email, 'client email')
  if (clientEmailError) {
    errors.push({ field: 'client-email', message: clientEmailError })
  }

  const hasInvoiceItem = invoice.items.some((item) => (
    item.name.trim() || parseNumber(item.quantity) > 0 || parseNumber(item.unitPrice) > 0
  ))
  if (!hasInvoiceItem) {
    errors.push({ field: 'items', message: 'Add at least one invoice item before continuing' })
  }
  invoice.items.forEach((item, index) => {
    errors.push(...validateItem(item, index))
  })

  const fieldErrors: Record<string, string> = {}
  for (const error of errors) {
    fieldErrors[error.field] = error.message
  }
  return { errors, fieldErrors, isValid: errors.length === 0 }
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
  return useMemo(() => validateInvoice(invoice), [invoice])
}
