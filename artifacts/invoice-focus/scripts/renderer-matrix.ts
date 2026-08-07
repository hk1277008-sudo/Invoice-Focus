import assert from 'node:assert/strict'
import { buildPrintableInvoiceHTML } from '../src/components/invoice/pdf-export'
import { normalizeDocumentDetails, normalizeDocumentType, documentTypeMeta, type InvoiceDocumentType } from '../src/components/invoice/document-types'
import { normalizePresentation, templateFamily, type InvoiceTemplate } from '../src/components/invoice/presentation'
import type { InvoiceData } from '../src/components/invoice/types'

const baseInvoice: InvoiceData = {
  business: { logo: null, name: 'Matrix Studio', contactPerson: '', email: 'hello@example.com', phone: '', website: '', address: '', taxId: '' },
  client: { name: 'Client', companyName: '', email: 'client@example.com', phone: '', billingAddress: '', taxId: '' },
  details: { number: 'DOC-001', issueDate: '2026-08-03', dueDate: '2026-08-31', paymentTerms: 'Net 30', status: 'Draft', poNumber: '', currency: 'EUR' },
  items: [{ id: 'item-1', name: 'Service', description: 'A useful service', quantity: '2', unitPrice: '125', taxPercent: '10', discountPercent: '' }],
  additional: { notes: 'Thank you', paymentInstructions: '', terms: '' },
  documentDetails: normalizeDocumentDetails({
    transactionId: 'TXN-001',
    originalInvoiceReference: 'INV-000',
    reasonForCredit: 'Duplicate charge adjustment',
    remainingBalance: '250.00',
    estimatedTimeline: '4 weeks',
    scope: 'Design and development services',
    acceptanceNote: 'Approval requested by the validity date.',
    approvalName: 'Client Approver',
    approvalDate: '2026-08-15',
  }),
}

const documentTypes: InvoiceDocumentType[] = ['invoice', 'receipt', 'estimate', 'quote', 'credit-note']
const familyTemplates: Array<[InvoiceTemplate, 'minimal' | 'professional' | 'enterprise']> = [
  ['minimal', 'minimal'],
  ['professional', 'professional'],
  ['enterprise', 'enterprise'],
]

for (const documentType of documentTypes) {
  for (const [template, family] of familyTemplates) {
    const invoice = { ...baseInvoice, documentType, presentation: normalizePresentation({ template }) }
    const result = buildPrintableInvoiceHTML(invoice)
    const meta = documentTypeMeta(documentType)
    assert.equal(templateFamily(invoice.presentation!.template), family)
    assert.match(result.html, new RegExp(meta.title))
    assert.match(result.html, new RegExp(meta.totalLabel))
    assert.match(result.html, /€/)
    if (documentType === 'receipt') assert.match(result.html, /PAID|Payment Received/)
    if (documentType === 'quote') assert.match(result.html, /Client Approval/)
    if (documentType === 'estimate') assert.match(result.html, /Estimated Timeline/)
    if (documentType === 'credit-note') assert.match(result.html, /Original Invoice/)
  }
}

assert.equal(normalizeDocumentType(undefined), 'invoice')
assert.equal(normalizeDocumentType('not-a-document'), 'invoice')
assert.equal(templateFamily(normalizePresentation({ template: 'corporate' }).template), 'enterprise')
assert.equal(templateFamily(normalizePresentation({ template: 'elegant' }).template), 'minimal')
assert.equal(templateFamily(normalizePresentation({ template: 'modern' }).template), 'professional')

console.log(`Renderer matrix passed: ${documentTypes.length * familyTemplates.length} document/template combinations`)