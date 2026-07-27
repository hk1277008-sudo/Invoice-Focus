import { Plus, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencySelector } from './CurrencySelector'
import type { InvoiceData, InvoiceItem } from './types'

interface InvoiceEditorProps {
  invoice: InvoiceData
  onUpdateBusiness: (field: keyof InvoiceData['business'], value: string) => void
  onUpdateClient: (field: keyof InvoiceData['client'], value: string) => void
  onUpdateDetails: (field: keyof InvoiceData['details'], value: string) => void
  onUpdateCurrency: (value: InvoiceData['details']['currency']) => void
  onUpdateAdditional: (field: keyof InvoiceData['additional'], value: string) => void
  onUpdateItem: (id: string, field: keyof InvoiceItem, value: string) => void
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onSetLogo: (logo: string | null) => void
}

export function InvoiceEditor({
  invoice,
  onUpdateBusiness,
  onUpdateClient,
  onUpdateDetails,
  onUpdateCurrency,
  onUpdateAdditional,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onSetLogo,
}: InvoiceEditorProps) {
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
      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Enter the invoice number, dates, and terms.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoice-number">Invoice Number</Label>
            <Input
              id="invoice-number"
              value={invoice.details.number}
              onChange={(e) => onUpdateDetails('number', e.target.value)}
              placeholder="INV-001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <CurrencySelector
              value={invoice.details.currency}
              onChange={onUpdateCurrency}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue-date">Issue Date</Label>
            <Input
              id="issue-date"
              type="date"
              value={invoice.details.issueDate}
              onChange={(e) => onUpdateDetails('issueDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={invoice.details.dueDate}
              onChange={(e) => onUpdateDetails('dueDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-terms">Payment Terms</Label>
            <Input
              id="payment-terms"
              value={invoice.details.paymentTerms}
              onChange={(e) => onUpdateDetails('paymentTerms', e.target.value)}
              placeholder="Net 30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Invoice Status</Label>
            <Input
              id="status"
              value={invoice.details.status}
              onChange={(e) => onUpdateDetails('status', e.target.value)}
              placeholder="Draft"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="po-number">Purchase Order Number (optional)</Label>
            <Input
              id="po-number"
              value={invoice.details.poNumber}
              onChange={(e) => onUpdateDetails('poNumber', e.target.value)}
              placeholder="PO-12345"
            />
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={invoice.business.name}
                onChange={(e) => onUpdateBusiness('name', e.target.value)}
                placeholder="Business Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-person">Contact Person</Label>
              <Input
                id="contact-person"
                value={invoice.business.contactPerson}
                onChange={(e) => onUpdateBusiness('contactPerson', e.target.value)}
                placeholder="Contact Person"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-email">Email</Label>
              <Input
                id="business-email"
                type="email"
                value={invoice.business.email}
                onChange={(e) => onUpdateBusiness('email', e.target.value)}
                placeholder="Email Address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-phone">Phone</Label>
              <Input
                id="business-phone"
                type="tel"
                value={invoice.business.phone}
                onChange={(e) => onUpdateBusiness('phone', e.target.value)}
                placeholder="Phone Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-website">Website (optional)</Label>
              <Input
                id="business-website"
                type="url"
                value={invoice.business.website}
                onChange={(e) => onUpdateBusiness('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-id">Tax ID / VAT ID (optional)</Label>
              <Input
                id="tax-id"
                value={invoice.business.taxId}
                onChange={(e) => onUpdateBusiness('taxId', e.target.value)}
                placeholder="Tax ID / VAT ID"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="business-address">Address</Label>
              <Textarea
                id="business-address"
                value={invoice.business.address}
                onChange={(e) => onUpdateBusiness('address', e.target.value)}
                placeholder="Street Address"
                rows={3}
              />
            </div>
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
          <div className="space-y-2">
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={invoice.client.name}
              onChange={(e) => onUpdateClient('name', e.target.value)}
              placeholder="Client Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-company">Company Name</Label>
            <Input
              id="client-company"
              value={invoice.client.companyName}
              onChange={(e) => onUpdateClient('companyName', e.target.value)}
              placeholder="Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              value={invoice.client.email}
              onChange={(e) => onUpdateClient('email', e.target.value)}
              placeholder="Email Address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-phone">Phone</Label>
            <Input
              id="client-phone"
              type="tel"
              value={invoice.client.phone}
              onChange={(e) => onUpdateClient('phone', e.target.value)}
              placeholder="Phone Number"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="client-address">Billing Address</Label>
            <Textarea
              id="client-address"
              value={invoice.client.billingAddress}
              onChange={(e) => onUpdateClient('billingAddress', e.target.value)}
              placeholder="Street Address"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
          <CardDescription>Add products or services to the invoice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border">
            <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/50 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="col-span-12 sm:col-span-4">Item</div>
              <div className="col-span-3 sm:col-span-1">Qty</div>
              <div className="col-span-4 sm:col-span-2">Price</div>
              <div className="col-span-2 sm:col-span-1">Tax %</div>
              <div className="col-span-2 sm:col-span-1">Disc %</div>
              <div className="col-span-1 sm:col-span-1">Total</div>
              <div className="col-span-1 sm:col-span-2"></div>
            </div>
            <div className="divide-y divide-border">
              {invoice.items.map((item) => (
                <InvoiceItemRow
                  key={item.id}
                  item={item}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                  canRemove={invoice.items.length > 1}
                />
              ))}
            </div>
          </div>
          <Button type="button" variant="outline" onClick={onAddItem} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Notes, payment instructions, and terms.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={invoice.additional.notes}
              onChange={(e) => onUpdateAdditional('notes', e.target.value)}
              placeholder="Add a note to your client"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-instructions">Payment Instructions</Label>
            <Textarea
              id="payment-instructions"
              value={invoice.additional.paymentInstructions}
              onChange={(e) => onUpdateAdditional('paymentInstructions', e.target.value)}
              placeholder="Bank transfer details, payment link, etc."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={invoice.additional.terms}
              onChange={(e) => onUpdateAdditional('terms', e.target.value)}
              placeholder="Terms & Conditions"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InvoiceItemRow({
  item,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: InvoiceItem
  onUpdate: (id: string, field: keyof InvoiceItem, value: string) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  const quantity = Number.parseFloat(item.quantity) || 0
  const unitPrice = Number.parseFloat(item.unitPrice) || 0
  const taxPercent = Number.parseFloat(item.taxPercent) || 0
  const discountPercent = Number.parseFloat(item.discountPercent) || 0
  const base = quantity * unitPrice
  const discount = base * (discountPercent / 100)
  const taxable = base - discount
  const tax = taxable * (taxPercent / 100)
  const lineTotal = taxable + tax

  return (
    <div className="grid grid-cols-12 gap-2 p-3">
      <div className="col-span-12 sm:col-span-4 space-y-1">
        <Input
          value={item.name}
          onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
          placeholder="Item Name"
          className="h-8"
        />
        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
          placeholder="Description"
          className="h-8"
        />
      </div>
      <div className="col-span-3 sm:col-span-1">
        <Input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, 'quantity', e.target.value)}
          placeholder="Qty"
          className="h-8"
        />
      </div>
      <div className="col-span-4 sm:col-span-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onUpdate(item.id, 'unitPrice', e.target.value)}
          placeholder="Price"
          className="h-8"
        />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.taxPercent}
          onChange={(e) => onUpdate(item.id, 'taxPercent', e.target.value)}
          placeholder="Tax %"
          className="h-8"
        />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.discountPercent}
          onChange={(e) => onUpdate(item.id, 'discountPercent', e.target.value)}
          placeholder="Disc %"
          className="h-8"
        />
      </div>
      <div className="col-span-1 sm:col-span-1 flex items-center text-sm font-medium tabular-nums">
        {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="col-span-1 sm:col-span-2 flex items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          disabled={!canRemove}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
