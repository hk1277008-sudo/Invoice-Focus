import type { InvoiceDocumentDetails } from './types'

export type InvoiceDocumentType = 'invoice' | 'receipt' | 'estimate' | 'quote' | 'credit-note'

export interface InvoiceDocumentMeta {
  title: string
  numberLabel: string
  issueDateLabel: string
  dueDateLabel: string
  termsLabel: string
  referenceLabel: string
  billToLabel: string
  itemsLabel: string
  subtotalLabel: string
  taxLabel: string
  totalLabel: string
  notesLabel: string
  statusLabel?: string
  statusTone?: 'success' | 'info'
  hideDueDate: boolean
  description: string
}

export const documentTypes: Array<{
  id: InvoiceDocumentType
  name: string
  description: string
}> = [
  { id: 'invoice', name: 'Invoice', description: 'Request payment for completed work or delivered goods.' },
  { id: 'receipt', name: 'Receipt', description: 'Confirm that payment has been received.' },
  { id: 'estimate', name: 'Estimate', description: 'Share an expected project cost before work begins.' },
  { id: 'quote', name: 'Quote', description: 'Present a formal price proposal with validity terms.' },
  { id: 'credit-note', name: 'Credit Note', description: 'Record a refund, adjustment, or credit against an invoice.' },
]

export const defaultDocumentType: InvoiceDocumentType = 'invoice'

export function normalizeDocumentType(value: unknown): InvoiceDocumentType {
  return documentTypes.some((item) => item.id === value) ? value as InvoiceDocumentType : defaultDocumentType
}

export function documentTypeLabel(type: InvoiceDocumentType): string {
  return documentTypes.find((item) => item.id === type)?.name ?? 'Invoice'
}

export function documentTypeMeta(type: InvoiceDocumentType): InvoiceDocumentMeta {
  switch (type) {
    case 'receipt':
      return {
        title: 'Receipt',
        numberLabel: 'Receipt No.',
        issueDateLabel: 'Payment Date',
        dueDateLabel: '',
        termsLabel: 'Payment Method',
        referenceLabel: 'Transaction ID',
        billToLabel: 'Received From',
        itemsLabel: 'Paid Items',
        subtotalLabel: 'Paid Subtotal',
        taxLabel: 'Tax Included',
        totalLabel: 'Total Paid',
        notesLabel: 'Notes',
        statusLabel: 'PAID',
        statusTone: 'success' as const,
        hideDueDate: true,
        description: 'Confirm payment received with a professional receipt.',
      }
    case 'estimate':
      return {
        title: 'Estimate',
        numberLabel: 'Estimate No.',
        issueDateLabel: 'Estimate Date',
        dueDateLabel: 'Expiration Date',
        termsLabel: 'Terms',
        referenceLabel: 'Reference',
        billToLabel: 'Prepared For',
        itemsLabel: 'Estimated Items',
        subtotalLabel: 'Estimated Subtotal',
        taxLabel: 'Estimated Tax',
        totalLabel: 'Estimated Total',
        notesLabel: 'Notes',
        hideDueDate: false,
        description: 'Share an estimated project cost before work begins.',
      }
    case 'quote':
      return {
        title: 'Quote',
        numberLabel: 'Quote No.',
        issueDateLabel: 'Quote Date',
        dueDateLabel: 'Valid Until',
        termsLabel: 'Terms',
        referenceLabel: 'Reference',
        billToLabel: 'Prepared For',
        itemsLabel: 'Quoted Items',
        subtotalLabel: 'Quoted Subtotal',
        taxLabel: 'Quoted Tax',
        totalLabel: 'Quoted Total',
        notesLabel: 'Notes',
        hideDueDate: false,
        description: 'Present a formal price proposal for your customer.',
      }
    case 'credit-note':
      return {
        title: 'Credit Note',
        numberLabel: 'Credit Note No.',
        issueDateLabel: 'Issue Date',
        dueDateLabel: '',
        termsLabel: 'Original Invoice',
        referenceLabel: 'Credit Reason',
        billToLabel: 'Credited To',
        itemsLabel: 'Credited Items',
        subtotalLabel: 'Credit Subtotal',
        taxLabel: 'Credit Tax',
        totalLabel: 'Credit Amount',
        notesLabel: 'Notes',
        hideDueDate: true,
        description: 'Record a refund or adjustment against an original invoice.',
      }
    default:
      return {
        title: 'Invoice',
        numberLabel: 'Invoice No.',
        issueDateLabel: 'Issue Date',
        dueDateLabel: 'Due Date',
        termsLabel: 'Payment Terms',
        referenceLabel: 'PO Number',
        billToLabel: 'Bill To',
        itemsLabel: 'Invoice Items',
        subtotalLabel: 'Subtotal',
        taxLabel: 'Tax',
        totalLabel: 'Grand Total',
        notesLabel: 'Notes',
        hideDueDate: false,
        description: 'Request payment for completed work or delivered goods.',
      }
  }
}

export function defaultDocumentDetails(): InvoiceDocumentDetails {
  return {
    transactionId: '',
    originalInvoiceReference: '',
    reasonForCredit: '',
    remainingBalance: '',
    estimatedTimeline: '',
    scope: '',
    acceptanceNote: '',
    approvalName: '',
    approvalDate: '',
  }
}

export function normalizeDocumentDetails(value: unknown): InvoiceDocumentDetails {
  const candidate = (value && typeof value === 'object' ? value : {}) as Partial<InvoiceDocumentDetails>
  const defaults = defaultDocumentDetails()
  return {
    transactionId: typeof candidate.transactionId === 'string' ? candidate.transactionId : defaults.transactionId,
    originalInvoiceReference: typeof candidate.originalInvoiceReference === 'string' ? candidate.originalInvoiceReference : defaults.originalInvoiceReference,
    reasonForCredit: typeof candidate.reasonForCredit === 'string' ? candidate.reasonForCredit : defaults.reasonForCredit,
    remainingBalance: typeof candidate.remainingBalance === 'string' ? candidate.remainingBalance : defaults.remainingBalance,
    estimatedTimeline: typeof candidate.estimatedTimeline === 'string' ? candidate.estimatedTimeline : defaults.estimatedTimeline,
    scope: typeof candidate.scope === 'string' ? candidate.scope : defaults.scope,
    acceptanceNote: typeof candidate.acceptanceNote === 'string' ? candidate.acceptanceNote : defaults.acceptanceNote,
    approvalName: typeof candidate.approvalName === 'string' ? candidate.approvalName : defaults.approvalName,
    approvalDate: typeof candidate.approvalDate === 'string' ? candidate.approvalDate : defaults.approvalDate,
  }
}