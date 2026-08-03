export type InvoiceDocumentType = 'invoice' | 'receipt' | 'estimate' | 'quote'

export const documentTypes: Array<{
  id: InvoiceDocumentType
  name: string
  description: string
}> = [
  { id: 'invoice', name: 'Invoice', description: 'Request payment for completed work or delivered goods.' },
  { id: 'receipt', name: 'Receipt', description: 'Confirm that payment has been received.' },
  { id: 'estimate', name: 'Estimate', description: 'Share an expected project cost before work begins.' },
  { id: 'quote', name: 'Quote', description: 'Present a formal price proposal with validity terms.' },
]

export const defaultDocumentType: InvoiceDocumentType = 'invoice'

export function normalizeDocumentType(value: unknown): InvoiceDocumentType {
  return documentTypes.some((item) => item.id === value) ? value as InvoiceDocumentType : defaultDocumentType
}

export function documentTypeLabel(type: InvoiceDocumentType): string {
  return documentTypes.find((item) => item.id === type)?.name ?? 'Invoice'
}

export function documentTypeMeta(type: InvoiceDocumentType) {
  switch (type) {
    case 'receipt':
      return {
        title: 'Receipt',
        numberLabel: 'Receipt No.',
        issueDateLabel: 'Payment Date',
        dueDateLabel: 'Original Invoice',
        termsLabel: 'Payment Method',
        referenceLabel: 'Reference',
        billToLabel: 'Received From',
        itemsLabel: 'Paid Items',
        subtotalLabel: 'Paid Subtotal',
        taxLabel: 'Tax Included',
        totalLabel: 'Total Paid',
        notesLabel: 'Notes',
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
        description: 'Present a formal price proposal for your customer.',
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
        description: 'Request payment for completed work or delivered goods.',
      }
  }
}