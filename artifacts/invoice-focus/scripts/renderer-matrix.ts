import assert from 'node:assert/strict'
import { buildPrintableInvoiceHTML } from '../src/components/invoice/pdf-export'
import { normalizeDocumentDetails, normalizeDocumentType, documentTypeMeta, type InvoiceDocumentType } from '../src/components/invoice/document-types'
import { buildDocumentRenderModel } from '../src/components/invoice/document-rendering'
import { normalizePresentation, templateFamily, type InvoiceTemplate } from '../src/components/invoice/presentation'
import type { InvoiceData } from '../src/components/invoice/types'

const baseInvoice: InvoiceData = {
  business: { logo: null, name: 'Matrix Studio', contactPerson: '', email: 'hello@example.com', phone: '', website: '', address: '', taxId: '' },
  client: { name: 'Client', companyName: '', email: 'client@example.com', phone: '', billingAddress: '', taxId: '' },
  details: { number: 'DOC-001', issueDate: '2026-08-03', dueDate: '2026-08-31', paymentTerms: 'Net 30', status: 'Draft', poNumber: '', currency: 'EUR' },
  items: [{ id: 'item-1', name: 'Service', description: 'A useful service', sku: 'SKU-001', quantity: '2', unitPrice: '125', taxPercent: '10', discountPercent: '' }],
  additional: { notes: 'Thank you', paymentInstructions: '', terms: '', shipping: '25' },
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
    deliveryDate: '2026-09-01',
    deliveryInstructions: 'Deliver to the receiving dock between 9am and 3pm.',
    authorizedBy: 'Procurement Lead',
    authorizationDate: '2026-08-04',
  }),
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const documentTypes: InvoiceDocumentType[] = ['invoice', 'receipt', 'estimate', 'quote', 'credit-note', 'purchase-order']
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
    const model = buildDocumentRenderModel(invoice)
    assert.equal(templateFamily(invoice.presentation!.template), family)
    assert.match(result.html, new RegExp(meta.title))
    assert.match(result.html, new RegExp(meta.totalLabel))
    assert.equal(model.totals.total.label, meta.totalLabel)
    assert.equal((result.html.match(/<section class="totals">/g) || []).length, 1)
    assert.equal((result.html.match(new RegExp(escapeRegExp(meta.totalLabel), 'g')) || []).length, 1)
    assert.match(result.html, /€/)
    if (documentType === 'receipt') assert.match(result.html, /Payment Confirmation|Payment Status/)
    if (documentType === 'quote') assert.match(result.html, /Quote Approval|Acceptance Contact/)
    if (documentType === 'estimate') assert.match(result.html, /Estimated Timeline/)
    if (documentType === 'credit-note') assert.match(result.html, /Original Invoice/)
    if (documentType === 'purchase-order') {
      assert.match(result.html, /Purchase Order/)
      assert.match(result.html, /Requested Delivery/)
      assert.match(result.html, /SKU/)
      assert.match(result.html, /Shipping \/ Handling/)
    }
  }
}

assert.equal(normalizeDocumentType(undefined), 'invoice')
assert.equal(normalizeDocumentType('not-a-document'), 'invoice')
assert.equal(templateFamily(normalizePresentation({ template: 'corporate' }).template), 'enterprise')
assert.equal(templateFamily(normalizePresentation({ template: 'elegant' }).template), 'minimal')
assert.equal(templateFamily(normalizePresentation({ template: 'modern' }).template), 'professional')

for (const [currency, expected] of [['JPY', '¥250'], ['CNY', '¥250'], ['AED', '250.00 د.إ'], ['SAR', '250.00 ﷼']] as const) {
  const result = buildPrintableInvoiceHTML({
    ...baseInvoice,
    details: { ...baseInvoice.details, currency },
  })
  assert.match(result.html, new RegExp(expected))
  if (currency === 'JPY' || currency === 'CNY') assert.doesNotMatch(result.html, /¥250\.00/)
}

for (const footerLayout of ['Simple', 'Detailed', 'Bar'] as const) {
  const result = buildPrintableInvoiceHTML({
    ...baseInvoice,
    presentation: normalizePresentation({ template: 'professional', footerLayout }),
  })
  assert.match(result.html, new RegExp(`footer-${footerLayout.toLowerCase()}`))
}

const receiptWithoutOptionalPaymentData = buildPrintableInvoiceHTML({
  ...baseInvoice,
  documentType: 'receipt',
  details: { ...baseInvoice.details, paymentTerms: '', status: '', poNumber: '' },
  documentDetails: normalizeDocumentDetails({}),
})
assert.doesNotMatch(receiptWithoutOptionalPaymentData.html, /PAID|Payment Method|Transaction ID|Payment \/ Reference/)

const longContentInvoice = buildPrintableInvoiceHTML({
  ...baseInvoice,
  additional: { ...baseInvoice.additional, notes: 'Long note '.repeat(400) },
  items: Array.from({ length: 70 }, (_, index) => ({
    ...baseInvoice.items[0],
    id: `long-${index}`,
    name: `Service ${index}`,
    description: 'A long description that should wrap safely without clipping across page boundaries. '.repeat(3),
  })),
})
assert.equal((longContentInvoice.html.match(/<tr>/g) || []).length, 71)
assert.match(longContentInvoice.html, /Service 69/)
assert.doesNotMatch(longContentInvoice.html, /To be confirmed|Approval requested|—/)

console.log(`Renderer matrix passed: ${documentTypes.length * familyTemplates.length} document/template combinations`)