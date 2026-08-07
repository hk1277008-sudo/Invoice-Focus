import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencySelector } from './CurrencySelector'
import type { InvoiceData, InvoiceItem } from './types'
import type { ClientRecord } from '@/lib/clients'
import { calculateItemValues } from './utils'
import { InvoicePresentationControls } from './InvoicePresentationControls'
import type { InvoicePresentation } from './presentation'
import type { InvoiceDocumentType } from './document-types'
import { normalizeDocumentDetails, normalizeDocumentType } from './document-types'

interface InvoiceEditorProps {
  invoice: InvoiceData
  errors?: Record<string, string>
  onUpdateBusiness: (field: keyof InvoiceData['business'], value: string) => void
  onUpdateClient: (field: keyof InvoiceData['client'], value: string) => void
  onUpdateDetails: (field: keyof InvoiceData['details'], value: string) => void
  onUpdateCurrency: (value: InvoiceData['details']['currency']) => void
  onUpdateAdditional: (field: keyof InvoiceData['additional'], value: string) => void
  onUpdateDocumentDetails: (field: keyof NonNullable<InvoiceData['documentDetails']>, value: string) => void
  onUpdateItem: (id: string, field: keyof InvoiceItem, value: string) => void
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onSetLogo: (logo: string | null) => void
  clients?: ClientRecord[]
  onSelectClient?: (client: ClientRecord | null) => void
  onUpdatePresentation: (field: keyof InvoicePresentation, value: string) => void
  onUpdateDocumentType: (value: InvoiceDocumentType) => void
}

export function InvoiceEditor({
  invoice,
  errors = {},
  onUpdateBusiness,
  onUpdateClient,
  onUpdateDetails,
  onUpdateCurrency,
  onUpdateAdditional,
  onUpdateDocumentDetails,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onSetLogo,
  clients = [],
  onSelectClient,
  onUpdatePresentation,
  onUpdateDocumentType,
}: InvoiceEditorProps) {
  const documentType = normalizeDocumentType(invoice.documentType)
  const [clientSearch, setClientSearch] = useState('')
  const previousItemIds = useRef(invoice.items.map((item) => item.id))
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(() =>
    invoice.items.some((item) => Number.parseFloat(item.taxPercent) > 0 || Number.parseFloat(item.discountPercent) > 0),
  )
  useEffect(() => {
    const currentIds = invoice.items.map((item) => item.id)
    const addedId = currentIds.find((id) => !previousItemIds.current.includes(id))
    previousItemIds.current = currentIds
    if (!addedId) return
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>(`[data-item-description="${addedId}"]`)?.focus()
    }, 0)
  }, [invoice.items])
  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase()
    if (!query) return clients
    return clients.filter((client) => [client.full_name, client.company_name, client.email, client.phone].some((value) => value.toLowerCase().includes(query)))
  }, [clientSearch, clients])
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      onSetLogo(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <InvoicePresentationControls value={invoice.presentation} documentType={invoice.documentType} onDocumentTypeChange={onUpdateDocumentType} onChange={onUpdatePresentation} />
      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>{documentType === 'receipt' ? 'Receipt Details' : documentType === 'estimate' ? 'Estimate Details' : documentType === 'quote' ? 'Quote Details' : documentType === 'credit-note' ? 'Credit Note Details' : documentType === 'purchase-order' ? 'Purchase Order Details' : 'Invoice Details'}</CardTitle>
          <CardDescription>{documentType === 'purchase-order' ? 'Enter the order number, date, supplier reference, and payment terms.' : 'Enter the document number, dates, and terms.'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField label={documentType === 'receipt' ? 'Receipt Number' : documentType === 'estimate' ? 'Estimate Number' : documentType === 'quote' ? 'Quote Number' : documentType === 'credit-note' ? 'Credit Note Number' : documentType === 'purchase-order' ? 'Purchase Order Number' : 'Invoice Number'} htmlFor="invoice-number" error={errors['invoice-number']}>
            <Input
              id="invoice-number"
              value={invoice.details.number}
              onChange={(e) => onUpdateDetails('number', e.target.value)}
              placeholder="INV-001"
              aria-invalid={!!errors['invoice-number']}
            />
          </FormField>
          <FormField label="Currency" htmlFor="currency" error={errors['currency']}>
            <CurrencySelector value={invoice.details.currency} onChange={onUpdateCurrency} />
          </FormField>
             <FormField label={documentType === 'receipt' ? 'Payment Date' : documentType === 'estimate' ? 'Estimate Date' : documentType === 'quote' ? 'Quote Date' : 'Issue Date'} htmlFor="issue-date" error={errors['issue-date']}>
            <Input
              id="issue-date"
              type="date"
              value={invoice.details.issueDate}
              onChange={(e) => onUpdateDetails('issueDate', e.target.value)}
               aria-invalid={!!errors['issue-date']}
            />
          </FormField>
          {documentType !== 'receipt' && documentType !== 'credit-note' && documentType !== 'purchase-order' && <FormField label={documentType === 'estimate' ? 'Valid Until' : documentType === 'quote' ? 'Quote Valid Until' : 'Due Date'} htmlFor="due-date" error={errors['due-date']}>
            <Input
              id="due-date"
              type="date"
              value={invoice.details.dueDate}
              onChange={(e) => onUpdateDetails('dueDate', e.target.value)}
              aria-invalid={!!errors['due-date']}
            />
          </FormField>}
           <FormField label={documentType === 'receipt' ? 'Payment Method' : documentType === 'credit-note' ? 'Adjustment Terms' : 'Terms'} htmlFor="payment-terms">
            <Input
              id="payment-terms"
              value={invoice.details.paymentTerms}
              onChange={(e) => onUpdateDetails('paymentTerms', e.target.value)}
              placeholder={documentType === 'receipt' ? 'Card, bank transfer, cash...' : documentType === 'credit-note' ? 'Refund or account credit...' : 'Net 30'}
            />
          </FormField>
          <FormField label={`${documentType === 'receipt' ? 'Receipt' : documentType[0].toUpperCase() + documentType.slice(1)} Status`} htmlFor="status">
            <select
              id="status"
              value={invoice.details.status}
              onChange={(e) => onUpdateDetails('status', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Draft</option>
              {['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">Only valid lifecycle transitions can be saved. You can also manage status from the invoice details page.</p>
          </FormField>
           <FormField label={`${documentType === 'receipt' ? 'Transaction ID' : documentType === 'credit-note' ? 'Adjustment Reference' : documentType === 'purchase-order' ? 'Supplier Reference' : 'Reference / PO Number'} (optional)`} htmlFor="po-number" className="sm:col-span-2">
            <Input
              id="po-number"
              value={invoice.details.poNumber}
              onChange={(e) => onUpdateDetails('poNumber', e.target.value)}
              placeholder="PO-12345"
            />
          </FormField>
        </CardContent>
      </Card>

      {documentType !== 'invoice' && (
        <DocumentDetailsCard
          invoice={invoice}
          onUpdate={onUpdateDocumentDetails}
        />
      )}

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Your business details will appear on the invoice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Business Logo</Label>
            <div className="flex items-center gap-4">
              {invoice.business.logo ? (
                <div className="relative">
                  <img
                    src={invoice.business.logo}
                    alt="Business logo"
                    className="h-20 w-20 rounded-lg border border-border object-contain p-1"
                  />
                  <button
                    type="button"
                    onClick={() => onSetLogo(null)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                    aria-label="Remove logo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
              )}
              <div>
                <Label
                  htmlFor="logo-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
                >
                  <Upload className="h-4 w-4" />
                  Upload logo
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="sr-only"
                />
                <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or SVG. Max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Business Name" htmlFor="business-name" error={errors['business-name']}>
              <Input
                id="business-name"
                value={invoice.business.name}
                onChange={(e) => onUpdateBusiness('name', e.target.value)}
                placeholder="Business Name"
                aria-invalid={!!errors['business-name']}
              />
            </FormField>
            <FormField label="Contact Person" htmlFor="contact-person">
              <Input
                id="contact-person"
                value={invoice.business.contactPerson}
                onChange={(e) => onUpdateBusiness('contactPerson', e.target.value)}
                placeholder="Contact Person"
              />
            </FormField>
            <FormField label="Email" htmlFor="business-email" error={errors['business-email']}>
              <Input
                id="business-email"
                type="email"
                value={invoice.business.email}
                onChange={(e) => onUpdateBusiness('email', e.target.value)}
                placeholder="Email Address"
                aria-invalid={!!errors['business-email']}
              />
            </FormField>
            <FormField label="Phone" htmlFor="business-phone">
              <Input
                id="business-phone"
                type="tel"
                value={invoice.business.phone}
                onChange={(e) => onUpdateBusiness('phone', e.target.value)}
                placeholder="Phone Number"
              />
            </FormField>
            <FormField label="Website (optional)" htmlFor="business-website">
              <Input
                id="business-website"
                type="url"
                value={invoice.business.website}
                onChange={(e) => onUpdateBusiness('website', e.target.value)}
                placeholder="https://example.com"
              />
            </FormField>
            <FormField label="Tax ID / VAT ID (optional)" htmlFor="tax-id">
              <Input
                id="tax-id"
                value={invoice.business.taxId}
                onChange={(e) => onUpdateBusiness('taxId', e.target.value)}
                placeholder="Tax ID / VAT ID"
              />
            </FormField>
            <FormField label="Address" htmlFor="business-address" className="sm:col-span-2">
              <Textarea
                id="business-address"
                value={invoice.business.address}
                onChange={(e) => onUpdateBusiness('address', e.target.value)}
                placeholder="Street Address"
                rows={3}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Who is this invoice for?</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {onSelectClient && (
            <FormField label="Select Saved Client" htmlFor="saved-client" className="sm:col-span-2">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                  placeholder="Search saved clients by name, company, email, or phone"
                  className="pl-9"
                  aria-label="Search saved clients"
                />
              </div>
              <select
                id="saved-client"
                value={invoice.client.clientId || ''}
                onChange={(event) => onSelectClient(clients.find((client) => client.id === event.target.value) || null)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose a client or enter details below</option>
                {filteredClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}{client.company_name ? ` — ${client.company_name}` : ''}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="Client Name" htmlFor="client-name" error={errors['client-name']}>
            <Input
              id="client-name"
              value={invoice.client.name}
              onChange={(e) => onUpdateClient('name', e.target.value)}
              placeholder="Client Name"
              aria-invalid={!!errors['client-name']}
            />
          </FormField>
          <FormField label="Company Name" htmlFor="client-company">
            <Input
              id="client-company"
              value={invoice.client.companyName}
              onChange={(e) => onUpdateClient('companyName', e.target.value)}
              placeholder="Company Name"
            />
          </FormField>
          <FormField label="Email" htmlFor="client-email" error={errors['client-email']}>
            <Input
              id="client-email"
              type="email"
              value={invoice.client.email}
              onChange={(e) => onUpdateClient('email', e.target.value)}
              placeholder="Email Address"
              aria-invalid={!!errors['client-email']}
            />
          </FormField>
          <FormField label="Phone" htmlFor="client-phone">
            <Input
              id="client-phone"
              type="tel"
              value={invoice.client.phone}
              onChange={(e) => onUpdateClient('phone', e.target.value)}
              placeholder="Phone Number"
            />
          </FormField>
          <FormField label="Tax ID / VAT Number" htmlFor="client-tax-id">
            <Input
              id="client-tax-id"
              value={invoice.client.taxId}
              onChange={(e) => onUpdateClient('taxId', e.target.value)}
              placeholder="Tax ID / VAT Number"
            />
          </FormField>
          <FormField label="Billing Address" htmlFor="client-address" className="sm:col-span-2">
            <Textarea
              id="client-address"
              value={invoice.client.billingAddress}
              onChange={(e) => onUpdateClient('billingAddress', e.target.value)}
              placeholder="Street Address"
              rows={3}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>{documentType === 'receipt' ? 'Paid Items' : documentType === 'estimate' ? 'Estimated Items' : documentType === 'quote' ? 'Quoted Items' : documentType === 'credit-note' ? 'Credited Items' : documentType === 'purchase-order' ? 'Ordered Items' : 'Invoice Items'}</CardTitle>
          <CardDescription>{documentType === 'purchase-order' ? 'Add the goods or services being ordered, including optional SKU codes.' : 'Add products or services to this document.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="overflow-x-auto rounded-lg border border-border" data-invoice-items>
             <div className={`${advancedOptionsOpen ? (documentType === 'purchase-order' ? 'sm:grid-cols-[minmax(14rem,3fr)_minmax(5rem,0.9fr)_minmax(4rem,0.8fr)_minmax(7rem,1.4fr)_minmax(4.5rem,0.8fr)_minmax(5rem,0.9fr)_minmax(6rem,1.2fr)_2.5rem]' : 'sm:grid-cols-[minmax(14rem,3fr)_minmax(4rem,0.8fr)_minmax(7rem,1.4fr)_minmax(4.5rem,0.8fr)_minmax(5rem,0.9fr)_minmax(6rem,1.2fr)_2.5rem]') : (documentType === 'purchase-order' ? 'sm:grid-cols-[minmax(14rem,3fr)_minmax(5rem,0.9fr)_minmax(4rem,0.8fr)_minmax(7rem,1.4fr)_minmax(6rem,1.2fr)_2.5rem]' : 'sm:grid-cols-[minmax(14rem,3fr)_minmax(4rem,0.8fr)_minmax(7rem,1.4fr)_minmax(6rem,1.2fr)_2.5rem]')} hidden min-w-[42rem] gap-3 overflow-hidden border-b border-border bg-muted/50 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid`}>
                <div>{documentType === 'purchase-order' ? 'Item / SKU' : 'Description'}</div>
                {documentType === 'purchase-order' && <div>SKU</div>}
               <div>Qty</div>
               <div>Price</div>
               {advancedOptionsOpen && <><div>Tax %</div><div>Discount %</div></>}
               <div className="text-right">Total</div>
               <div aria-hidden="true" />
            </div>
            <div className="divide-y divide-border">
              {invoice.items.map((item, index) => (
                <InvoiceItemRow
                  key={item.id}
                  index={index}
                  item={item}
                  errors={errors}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                  canRemove={invoice.items.length > 1}
                  showAdjustments={advancedOptionsOpen}
                   showSku={documentType === 'purchase-order'}
                />
              ))}
            </div>
            {errors.items && <p id="items-error" className="px-3 pb-3 text-xs text-destructive">{errors.items}</p>}
          </div>
          <Button type="button" variant="outline" onClick={onAddItem} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
          <button
            type="button"
            onClick={() => setAdvancedOptionsOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-lg border border-dashed border-border px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            aria-expanded={advancedOptionsOpen}
          >
            <span>Advanced options</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${advancedOptionsOpen ? 'rotate-180' : ''}`} />
          </button>
          {advancedOptionsOpen && <p className="text-xs text-muted-foreground">Use tax and discount percentages only when they apply to this invoice. They will appear in the preview and export.</p>}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>{documentType === 'purchase-order' ? 'Order notes, payment instructions, terms, and shipping charges.' : 'Notes, payment instructions, and terms.'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormField label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              value={invoice.additional.notes}
              onChange={(e) => onUpdateAdditional('notes', e.target.value)}
              placeholder="Add a note to your client"
              rows={3}
            />
          </FormField>
          <FormField label="Payment Instructions" htmlFor="payment-instructions">
            <Textarea
              id="payment-instructions"
              value={invoice.additional.paymentInstructions}
              onChange={(e) => onUpdateAdditional('paymentInstructions', e.target.value)}
              placeholder="Bank transfer details, payment link, etc."
              rows={3}
            />
          </FormField>
          <FormField label="Terms & Conditions" htmlFor="terms">
            <Textarea
              id="terms"
              value={invoice.additional.terms}
              onChange={(e) => onUpdateAdditional('terms', e.target.value)}
              placeholder="Terms & Conditions"
              rows={3}
            />
          </FormField>
          {documentType === 'purchase-order' && (
            <FormField label="Shipping / Handling" htmlFor="shipping">
              <Input
                id="shipping"
                type="number"
                min="0"
                step="0.01"
                value={invoice.additional.shipping || ''}
                onChange={(e) => onUpdateAdditional('shipping', e.target.value)}
                placeholder="0.00"
              />
            </FormField>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FormField({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} aria-invalid={!!error}>
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function DocumentDetailsCard({
  invoice,
  onUpdate,
}: {
  invoice: InvoiceData
  onUpdate: (field: keyof NonNullable<InvoiceData['documentDetails']>, value: string) => void
}) {
  const documentType = normalizeDocumentType(invoice.documentType)
  const details = normalizeDocumentDetails(invoice.documentDetails)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {documentType === 'receipt'
            ? 'Payment Confirmation'
            : documentType === 'quote'
              ? 'Quote Approval'
              : documentType === 'estimate'
                ? 'Project Scope'
              : documentType === 'purchase-order'
                ? 'Order Authorization'
                : 'Credit Adjustment'}
        </CardTitle>
        <CardDescription>
          {documentType === 'receipt'
            ? 'Add the payment reference and original invoice information.'
            : documentType === 'quote'
              ? 'Make approval expectations clear for your client.'
              : documentType === 'estimate'
                ? 'Give your client context around the projected work.'
                : documentType === 'purchase-order'
                  ? 'Add delivery and authorization details for the supplier.'
                : 'Document the invoice being adjusted and the reason for the credit.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {documentType === 'receipt' && (
          <>
            <FormField label="Transaction ID" htmlFor="transaction-id">
              <Input id="transaction-id" value={details.transactionId} onChange={(event) => onUpdate('transactionId', event.target.value)} placeholder="TXN-12345" />
            </FormField>
            <FormField label="Original Invoice Reference" htmlFor="original-invoice-reference">
              <Input id="original-invoice-reference" value={details.originalInvoiceReference} onChange={(event) => onUpdate('originalInvoiceReference', event.target.value)} placeholder="INV-001" />
            </FormField>
          </>
        )}
        {documentType === 'quote' && (
          <>
            <FormField label="Acceptance Contact" htmlFor="approval-name">
              <Input id="approval-name" value={details.approvalName} onChange={(event) => onUpdate('approvalName', event.target.value)} placeholder="Client approver name" />
            </FormField>
            <FormField label="Acceptance Date" htmlFor="approval-date">
              <Input id="approval-date" type="date" value={details.approvalDate} onChange={(event) => onUpdate('approvalDate', event.target.value)} />
            </FormField>
            <FormField label="Acceptance Section" htmlFor="acceptance-note" className="sm:col-span-2">
              <Textarea id="acceptance-note" value={details.acceptanceNote} onChange={(event) => onUpdate('acceptanceNote', event.target.value)} placeholder="Approval is requested by the validity date above." rows={3} />
            </FormField>
          </>
        )}
        {documentType === 'estimate' && (
          <>
            <FormField label="Estimated Timeline" htmlFor="estimated-timeline">
              <Input id="estimated-timeline" value={details.estimatedTimeline} onChange={(event) => onUpdate('estimatedTimeline', event.target.value)} placeholder="4–6 weeks" />
            </FormField>
            <FormField label="Scope" htmlFor="estimate-scope" className="sm:col-span-2">
              <Textarea id="estimate-scope" value={details.scope} onChange={(event) => onUpdate('scope', event.target.value)} placeholder="Describe what this estimate includes." rows={3} />
            </FormField>
          </>
        )}
        {documentType === 'credit-note' && (
          <>
            <FormField label="Original Invoice Reference" htmlFor="credit-original-invoice">
              <Input id="credit-original-invoice" value={details.originalInvoiceReference} onChange={(event) => onUpdate('originalInvoiceReference', event.target.value)} placeholder="INV-001" />
            </FormField>
            <FormField label="Remaining Balance" htmlFor="remaining-balance">
              <Input id="remaining-balance" type="number" min="0" step="0.01" value={details.remainingBalance} onChange={(event) => onUpdate('remainingBalance', event.target.value)} placeholder="0.00" />
            </FormField>
            <FormField label="Reason for Credit" htmlFor="reason-for-credit" className="sm:col-span-2">
              <Textarea id="reason-for-credit" value={details.reasonForCredit} onChange={(event) => onUpdate('reasonForCredit', event.target.value)} placeholder="Explain the refund or adjustment." rows={3} />
            </FormField>
          </>
        )}
        {documentType === 'purchase-order' && (
          <>
            <FormField label="Requested Delivery Date" htmlFor="delivery-date">
              <Input id="delivery-date" type="date" value={details.deliveryDate} onChange={(event) => onUpdate('deliveryDate', event.target.value)} />
            </FormField>
            <FormField label="Authorized By" htmlFor="authorized-by">
              <Input id="authorized-by" value={details.authorizedBy} onChange={(event) => onUpdate('authorizedBy', event.target.value)} placeholder="Purchasing manager or approver" />
            </FormField>
            <FormField label="Delivery Instructions" htmlFor="delivery-instructions" className="sm:col-span-2">
              <Textarea id="delivery-instructions" value={details.deliveryInstructions} onChange={(event) => onUpdate('deliveryInstructions', event.target.value)} placeholder="Ship-to details, delivery window, or receiving instructions." rows={3} />
            </FormField>
            <FormField label="Authorization Date" htmlFor="authorization-date">
              <Input id="authorization-date" type="date" value={details.authorizationDate} onChange={(event) => onUpdate('authorizationDate', event.target.value)} />
            </FormField>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function InvoiceItemRow({
  index,
  item,
  errors,
  onUpdate,
  onRemove,
  canRemove,
  showAdjustments,
  showSku,
}: {
  index: number
  item: InvoiceItem
  errors: Record<string, string>
  onUpdate: (id: string, field: keyof InvoiceItem, value: string) => void
  onRemove: (id: string) => void
  canRemove: boolean
  showAdjustments: boolean
  showSku: boolean
}) {
  const { lineTotal } = calculateItemValues(item)
  const nameError = errors[`item-${index}-name`]
  const qtyError = errors[`item-${index}-quantity`]
  const priceError = errors[`item-${index}-price`]

  return (
    <div className={`grid min-w-0 grid-cols-2 items-center gap-3 overflow-hidden p-3 sm:min-w-[42rem] ${showAdjustments ? 'sm:grid-cols-[minmax(14rem,3fr)_minmax(5rem,0.9fr)_minmax(4rem,0.8fr)_minmax(7rem,1.4fr)_minmax(4.5rem,0.8fr)_minmax(5rem,0.9fr)_minmax(6rem,1.2fr)_2.5rem]' : showSku ? 'sm:grid-cols-[minmax(14rem,3fr)_minmax(5rem,0.9fr)_minmax(4rem,0.8fr)_minmax(7rem,1.4fr)_minmax(6rem,1.2fr)_2.5rem]' : 'sm:grid-cols-[minmax(14rem,3fr)_minmax(4rem,0.8fr)_minmax(7rem,1.4fr)_minmax(6rem,1.2fr)_2.5rem]'}`}>
      <div className="col-span-2 min-w-0 space-y-1 sm:col-span-1">
        <Input
          value={item.name}
          onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
          placeholder="Description"
          className="h-9"
          data-item-description={item.id}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? `item-${index}-name-error` : undefined}
        />
         {nameError && (
          <p id={`item-${index}-name-error`} className="text-xs text-destructive">
            {nameError}
          </p>
        )}
      </div>
      {showSku && <div className="col-span-1 min-w-0 sm:col-span-1">
        <Input
          value={item.sku || ''}
          onChange={(e) => onUpdate(item.id, 'sku', e.target.value)}
          placeholder="SKU"
          className="h-9"
        />
      </div>}
      <div className="col-span-1 min-w-0 sm:col-span-1">
        <Input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, 'quantity', e.target.value)}
          placeholder="Qty"
          className="h-9"
          aria-invalid={!!qtyError}
        />
        {qtyError && <p className="text-xs text-destructive">{qtyError}</p>}
      </div>
      <div className="col-span-1 min-w-0 sm:col-span-1">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onUpdate(item.id, 'unitPrice', e.target.value)}
          placeholder="Price"
          className="h-9"
          aria-invalid={!!priceError}
        />
        {priceError && <p className="text-xs text-destructive">{priceError}</p>}
      </div>
      {showAdjustments && <div className="col-span-1 min-w-0 sm:col-span-1">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.taxPercent}
          onChange={(e) => onUpdate(item.id, 'taxPercent', e.target.value)}
          placeholder="Tax %"
          className="h-9"
        />
      </div>}
      {showAdjustments && <div className="col-span-1 min-w-0 sm:col-span-1">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.discountPercent}
          onChange={(e) => onUpdate(item.id, 'discountPercent', e.target.value)}
          placeholder="Discount %"
          className="h-9"
        />
      </div>}
      <div className="col-span-1 flex min-h-9 min-w-0 items-center justify-end overflow-hidden text-right text-xs font-medium tabular-nums">
        <span className="mr-1 text-[10px] font-normal text-muted-foreground sm:hidden">Total</span>
        {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="col-span-1 flex min-h-9 items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
          aria-label="Remove item"
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
