import { useState, useCallback, useMemo } from 'react'
import type { InvoiceData, InvoiceItem, InvoiceCalculations, CurrencyCode } from './types'
import { DEFAULT_CURRENCY, getCurrencyByCode } from './currencies'

function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  return `INV-${timestamp}`
}

function createEmptyItem(): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    quantity: '',
    unitPrice: '',
    taxPercent: '',
    discountPercent: '',
  }
}

export function createEmptyInvoice(): InvoiceData {
  return {
    business: {
      logo: null,
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      taxId: '',
    },
    client: {
      name: '',
      companyName: '',
      email: '',
      phone: '',
      billingAddress: '',
    },
    details: {
      number: generateInvoiceNumber(),
      issueDate: '',
      dueDate: '',
      paymentTerms: '',
      status: '',
      poNumber: '',
      currency: DEFAULT_CURRENCY,
    },
    items: [createEmptyItem()],
    additional: {
      notes: '',
      paymentInstructions: '',
      terms: '',
    },
  }
}

function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function calculateItemTotal(item: InvoiceItem): number {
  const quantity = parseNumber(item.quantity)
  const unitPrice = parseNumber(item.unitPrice)
  const taxPercent = parseNumber(item.taxPercent)
  const discountPercent = parseNumber(item.discountPercent)

  const base = quantity * unitPrice
  const discount = base * (discountPercent / 100)
  const taxable = base - discount
  const tax = taxable * (taxPercent / 100)

  return taxable + tax
}

export function useInvoice() {
  const [invoice, setInvoice] = useState<InvoiceData>(createEmptyInvoice())

  const updateBusiness = useCallback((field: keyof InvoiceData['business'], value: string) => {
    setInvoice((prev) => ({ ...prev, business: { ...prev.business, [field]: value } }))
  }, [])

  const updateClient = useCallback((field: keyof InvoiceData['client'], value: string) => {
    setInvoice((prev) => ({ ...prev, client: { ...prev.client, [field]: value } }))
  }, [])

  const updateDetails = useCallback((field: keyof InvoiceData['details'], value: string) => {
    setInvoice((prev) => ({ ...prev, details: { ...prev.details, [field]: value } }))
  }, [])

  const updateCurrency = useCallback((currency: CurrencyCode) => {
    setInvoice((prev) => ({ ...prev, details: { ...prev.details, currency } }))
  }, [])

  const updateAdditional = useCallback((field: keyof InvoiceData['additional'], value: string) => {
    setInvoice((prev) => ({ ...prev, additional: { ...prev.additional, [field]: value } }))
  }, [])

  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: string) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
  }, [])

  const addItem = useCallback(() => {
    setInvoice((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }))
  }, [])

  const removeItem = useCallback((id: string) => {
    setInvoice((prev) => {
      const items = prev.items.filter((item) => item.id !== id)
      return { ...prev, items: items.length > 0 ? items : [createEmptyItem()] }
    })
  }, [])

  const setLogo = useCallback((logo: string | null) => {
    setInvoice((prev) => ({ ...prev, business: { ...prev.business, logo } }))
  }, [])

  const reset = useCallback(() => {
    setInvoice(createEmptyInvoice())
  }, [])

  const calculations = useMemo<InvoiceCalculations>(() => {
    let subtotal = 0
    let totalTax = 0
    let totalDiscount = 0

    for (const item of invoice.items) {
      const quantity = parseNumber(item.quantity)
      const unitPrice = parseNumber(item.unitPrice)
      const taxPercent = parseNumber(item.taxPercent)
      const discountPercent = parseNumber(item.discountPercent)

      const base = quantity * unitPrice
      const discount = base * (discountPercent / 100)
      const taxable = base - discount
      const tax = taxable * (taxPercent / 100)

      subtotal += base
      totalDiscount += discount
      totalTax += tax
    }

    const grandTotal = subtotal - totalDiscount + totalTax

    return {
      subtotal,
      tax: totalTax,
      discount: totalDiscount,
      grandTotal,
    }
  }, [invoice.items])

  const currency = useMemo(() => getCurrencyByCode(invoice.details.currency), [invoice.details.currency])

  const hasAnyData = useMemo(() => {
    const { business, client, details, additional, items } = invoice
    return (
      business.logo !== null ||
      business.name.trim() !== '' ||
      business.contactPerson.trim() !== '' ||
      business.email.trim() !== '' ||
      business.phone.trim() !== '' ||
      business.website.trim() !== '' ||
      business.address.trim() !== '' ||
      business.taxId.trim() !== '' ||
      client.name.trim() !== '' ||
      client.companyName.trim() !== '' ||
      client.email.trim() !== '' ||
      client.phone.trim() !== '' ||
      client.billingAddress.trim() !== '' ||
      details.paymentTerms.trim() !== '' ||
      details.status.trim() !== '' ||
      details.poNumber.trim() !== '' ||
      additional.notes.trim() !== '' ||
      additional.paymentInstructions.trim() !== '' ||
      additional.terms.trim() !== '' ||
      items.some(
        (item) =>
          item.name.trim() !== '' ||
          item.description.trim() !== '' ||
          item.quantity.trim() !== '' ||
          item.unitPrice.trim() !== '' ||
          item.taxPercent.trim() !== '' ||
          item.discountPercent.trim() !== '',
      )
    )
  }, [invoice])

  return {
    invoice,
    currency,
    calculations,
    hasAnyData,
    updateBusiness,
    updateClient,
    updateDetails,
    updateCurrency,
    updateAdditional,
    updateItem,
    addItem,
    removeItem,
    setLogo,
    reset,
  }
}
