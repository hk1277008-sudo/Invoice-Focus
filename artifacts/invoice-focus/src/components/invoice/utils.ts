import type { InvoiceAdditional, InvoiceItem, InvoiceCalculations } from './types'

export function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function calculateItemValues(item: InvoiceItem) {
  const quantity = parseNumber(item.quantity)
  const unitPrice = parseNumber(item.unitPrice)
  const taxPercent = parseNumber(item.taxPercent)
  const discountPercent = parseNumber(item.discountPercent)

  const base = quantity * unitPrice
  const discount = base * (discountPercent / 100)
  const taxable = base - discount
  const tax = taxable * (taxPercent / 100)
  const lineTotal = taxable + tax

  return { quantity, unitPrice, taxPercent, discountPercent, base, discount, taxable, tax, lineTotal }
}

export function calculateInvoiceTotals(items: InvoiceItem[], additional?: Pick<InvoiceAdditional, 'shipping'>): InvoiceCalculations {
  let subtotal = 0
  let tax = 0
  let discount = 0

  for (const item of items) {
    const values = calculateItemValues(item)
    subtotal += values.base
    discount += values.discount
    tax += values.tax
  }

  const grandTotal = subtotal - discount + tax
  const shipping = parseNumber(additional?.shipping || '')

  return { subtotal, tax, discount, shipping, grandTotal: grandTotal + shipping }
}
