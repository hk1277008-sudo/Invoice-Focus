import type { InvoiceCalculations, InvoiceData, InvoiceDocumentDetails, InvoiceItem, Currency } from './types'
import { formatCurrency, getCurrencyByCode } from './currencies'
import { calculateInvoiceTotals, calculateItemValues } from './utils'
import {
  documentTypeMeta,
  normalizeDocumentDetails,
  normalizeDocumentType,
  type InvoiceDocumentMeta,
  type InvoiceDocumentType,
} from './document-types'
import {
  normalizePresentation,
  presentationFontFamily,
  templateFamily,
  type InvoicePresentation,
  type InvoiceTemplateFamily,
} from './presentation'

export interface DocumentRenderDetail {
  label: string
  value: string
}

export interface DocumentRenderItem {
  item: InvoiceItem
  values: ReturnType<typeof calculateItemValues>
}

export interface DocumentRenderTypeBlock {
  title: string
  items: DocumentRenderDetail[]
}

export interface DocumentRenderTotals {
  rows: DocumentRenderDetail[]
  total: DocumentRenderDetail
}

export interface DocumentRenderModel {
  invoice: InvoiceData
  currency: Currency
  calculations: InvoiceCalculations
  presentation: InvoicePresentation
  documentType: InvoiceDocumentType
  documentMeta: InvoiceDocumentMeta
  documentDetails: InvoiceDocumentDetails
  family: InvoiceTemplateFamily
  fontFamily: string
  centered: boolean
  band: boolean
  visibleItems: DocumentRenderItem[]
  showAdjustments: boolean
  showSku: boolean
  headerMeta: DocumentRenderDetail[]
  paymentMeta: DocumentRenderDetail[]
  typeBlock: DocumentRenderTypeBlock | null
  additional: DocumentRenderDetail[]
  totals: DocumentRenderTotals
}

function nonEmpty(value: string | undefined | null): string | null {
  const normalized = value?.trim() ?? ''
  return normalized ? normalized : null
}

function detail(label: string, value: string | undefined | null): DocumentRenderDetail | null {
  const normalized = nonEmpty(value)
  return normalized ? { label, value: normalized } : null
}

function typeBlockFor(
  documentType: InvoiceDocumentType,
  details: InvoiceDocumentDetails,
  invoice: InvoiceData,
): DocumentRenderTypeBlock | null {
  const candidates: Array<DocumentRenderDetail | null> = []

  switch (documentType) {
    case 'receipt':
      candidates.push(
        detail('Payment Status', invoice.details.status),
        detail('Payment Method', invoice.details.paymentTerms),
        detail('Transaction ID', details.transactionId || invoice.details.poNumber),
      )
      break
    case 'quote':
      candidates.push(
        detail('Acceptance Contact', details.approvalName),
        detail('Accepted On', details.approvalDate),
        detail('Acceptance Note', details.acceptanceNote),
      )
      break
    case 'estimate':
      candidates.push(
        detail('Scope', details.scope),
        detail('Estimated Timeline', details.estimatedTimeline),
      )
      break
    case 'credit-note':
      candidates.push(
        detail('Original Invoice', details.originalInvoiceReference),
        detail('Reason for Credit', details.reasonForCredit),
        detail('Remaining Balance', details.remainingBalance),
      )
      break
    case 'purchase-order':
      candidates.push(
        detail('Requested Delivery', details.deliveryDate),
        detail('Authorized By', details.authorizedBy),
        detail('Authorization Date', details.authorizationDate),
        detail('Delivery Instructions', details.deliveryInstructions),
      )
      break
    default:
      break
  }

  const items = candidates.filter((item): item is DocumentRenderDetail => item !== null)
  if (!items.length) return null
  const title = {
    receipt: 'Payment Confirmation',
    quote: 'Quote Approval',
    estimate: 'Project Scope',
    'credit-note': 'Credit Adjustment',
    'purchase-order': 'Order Authorization',
    invoice: '',
  }[documentType]
  return { title, items }
}

export function buildDocumentRenderModel(
  invoice: InvoiceData,
  currency: Currency = getCurrencyByCode(invoice.details.currency),
  calculations: InvoiceCalculations = calculateInvoiceTotals(invoice.items, invoice.additional),
): DocumentRenderModel {
  const presentation = normalizePresentation(invoice.presentation)
  const documentType = normalizeDocumentType(invoice.documentType)
  const documentMeta = documentTypeMeta(documentType)
  const documentDetails = normalizeDocumentDetails(invoice.documentDetails)
  const family = templateFamily(presentation.template)
  const visibleItems = invoice.items
    .filter((item) => item.name.trim() || item.description.trim() || Number(item.quantity) > 0 || Number(item.unitPrice) > 0)
    .map((item) => ({ item, values: calculateItemValues(item) }))
  const showAdjustments = visibleItems.some(({ values }) => values.taxPercent > 0 || values.discountPercent > 0)

  const headerMeta = [
    detail(documentMeta.issueDateLabel, invoice.details.issueDate),
    !documentMeta.hideDueDate ? detail(documentMeta.dueDateLabel, invoice.details.dueDate) : null,
    detail('Status', invoice.details.status),
  ].filter((item): item is DocumentRenderDetail => item !== null)

  const paymentMeta = [
    detail(documentMeta.termsLabel, invoice.details.paymentTerms),
    detail(documentMeta.referenceLabel, documentType === 'receipt' ? documentDetails.transactionId || invoice.details.poNumber : documentType === 'credit-note' ? documentDetails.originalInvoiceReference : invoice.details.poNumber),
  ].filter((item): item is DocumentRenderDetail => item !== null)

  const additional = [
    detail(documentMeta.notesLabel, invoice.additional.notes),
    detail('Payment Instructions', invoice.additional.paymentInstructions),
    detail('Terms & Conditions', invoice.additional.terms),
  ].filter((item): item is DocumentRenderDetail => item !== null)
  const totals: DocumentRenderTotals = {
    rows: [
      { label: documentMeta.subtotalLabel, value: formatCurrency(calculations.subtotal, currency) },
      ...(calculations.discount > 0 ? [{ label: 'Discount', value: `-${formatCurrency(calculations.discount, currency)}` }] : []),
      ...(calculations.tax > 0 ? [{ label: documentMeta.taxLabel, value: formatCurrency(calculations.tax, currency) }] : []),
      ...(calculations.shipping > 0 ? [{ label: 'Shipping / Handling', value: formatCurrency(calculations.shipping, currency) }] : []),
    ],
    total: { label: documentMeta.totalLabel, value: formatCurrency(calculations.grandTotal, currency) },
  }

  return {
    invoice,
    currency,
    calculations,
    presentation,
    documentType,
    documentMeta,
    documentDetails,
    family,
    fontFamily: presentationFontFamily(presentation.font),
    centered: presentation.headerLayout === 'Centered',
    band: presentation.headerLayout === 'Band',
    visibleItems,
    showAdjustments,
    showSku: documentType === 'purchase-order' && visibleItems.some(({ item }) => Boolean(item.sku?.trim())),
    headerMeta,
    paymentMeta,
    typeBlock: typeBlockFor(documentType, documentDetails, invoice),
    additional,
    totals,
  }
}