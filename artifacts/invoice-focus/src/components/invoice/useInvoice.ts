import { useState, useCallback, useMemo, useEffect } from 'react'
import type { InvoiceData, InvoiceItem, InvoiceCalculations, CurrencyCode } from './types'
import { DEFAULT_CURRENCY, getCurrencyByCode } from './currencies'
import { calculateInvoiceTotals, parseNumber } from './utils'
import { loadDraft } from './useInvoiceDraft'

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
        clientId: '',
      name: '',
      companyName: '',
      email: '',
      phone: '',
      billingAddress: '',
        taxId: '',
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

export function useInvoice() {
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    const draft = loadDraft()
    return draft ?? createEmptyInvoice()
  })

  useEffect(() => {
    const saved = loadDraft()
    if (saved) {
      setInvoice(saved)
    }
  }, [])

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

  const loadFromData = useCallback((data: InvoiceData) => {
    setInvoice(data)
  }, [])

  const reset = useCallback(() => {
    setInvoice(createEmptyInvoice())
  }, [])

  const calculations = useMemo<InvoiceCalculations>(() => {
    return calculateInvoiceTotals(invoice.items)
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
    loadFromData,
    reset,
  }
}

export { parseNumber }
