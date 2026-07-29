import { useState, useCallback, useMemo, useEffect } from 'react'
import type { InvoiceData, InvoiceItem, InvoiceCalculations, CurrencyCode } from './types'
import { DEFAULT_CURRENCY, getCurrencyByCode } from './currencies'
import { calculateInvoiceTotals, parseNumber } from './utils'
import { loadDraft } from './useInvoiceDraft'
import { getSettings } from '@/lib/settings'
import { defaultPresentation, normalizePresentation } from './presentation'

function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  return `INV-${timestamp}`
}

function formatInvoiceNumber(format: string, prefix: string, number: number): string {
  return format
    .replaceAll('{prefix}', prefix || 'INV')
    .replaceAll('{number}', String(number))
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
    presentation: defaultPresentation,
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
      return
    }
    getSettings().then((settings) => {
      setInvoice((current) => {
        const hasUserData = Boolean(
          current.business.name || current.business.email || current.business.phone ||
          current.client.name || current.client.email || current.details.issueDate ||
          current.additional.notes || current.additional.terms ||
          current.items.some((item) => item.name || item.description || item.quantity || item.unitPrice),
        )
        if (hasUserData) return current
        const issueDate = new Date()
        const dueDate = new Date(issueDate)
        dueDate.setDate(dueDate.getDate() + settings.defaultDueDays)
        const formatDate = (value: Date) => value.toISOString().slice(0, 10)
        return {
          ...current,
          business: {
            ...current.business,
            name: settings.businessName,
            logo: settings.businessLogo || null,
            email: settings.businessEmail,
            phone: settings.businessPhone,
            website: settings.website,
            taxId: settings.taxId,
            address: [settings.address, settings.city, settings.state, settings.postalCode, settings.country].filter(Boolean).join(', '),
          },
          details: {
            ...current.details,
            number: formatInvoiceNumber(
              settings.invoiceNumberFormat,
              settings.invoicePrefix,
              settings.startingInvoiceNumber,
            ),
            currency: settings.defaultCurrency as CurrencyCode,
            issueDate: formatDate(issueDate),
            dueDate: formatDate(dueDate),
            paymentTerms: settings.defaultPaymentTerms,
          },
          additional: {
            ...current.additional,
            notes: settings.defaultNotes,
            terms: settings.defaultTerms,
          },
          presentation: normalizePresentation(settings.invoicePresentation),
          items: current.items.map((item, index) =>
            index === 0 && settings.defaultTaxRate > 0
              ? { ...item, taxPercent: String(settings.defaultTaxRate) }
              : item,
          ),
        }
      })
    }).catch(() => undefined)
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

  const updatePresentation = useCallback((field: keyof NonNullable<InvoiceData['presentation']>, value: string) => {
    setInvoice((prev) => ({
      ...prev,
      presentation: {
        ...normalizePresentation(prev.presentation),
        [field]: value,
      } as InvoiceData['presentation'],
    }))
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
    setInvoice({ ...data, presentation: normalizePresentation(data.presentation) })
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
    updatePresentation,
    updateItem,
    addItem,
    removeItem,
    setLogo,
    loadFromData,
    reset,
  }
}

export { parseNumber }
