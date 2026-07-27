import { memo } from 'react'
import { FileText } from 'lucide-react'
import type { InvoiceData, InvoiceCalculations, Currency } from './types'
import { formatCurrency, getCurrencyDecimals } from './currencies'
import { calculateItemValues } from './utils'

interface InvoicePreviewProps {
  invoice: InvoiceData
  currency: Currency
  calculations: InvoiceCalculations
  hasAnyData: boolean
}

export const InvoicePreview = memo(function InvoicePreview({
  invoice,
  currency,
  calculations,
  hasAnyData,
}: InvoicePreviewProps) {
  if (!hasAnyData) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Your invoice preview will appear here as you enter your invoice details.
        </p>
      </div>
    )
  }

  const decimals = getCurrencyDecimals(currency.code)

  return (
    <div className="invoice-preview-container overflow-hidden rounded-xl border border-border bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="p-8 sm:p-10">
        {/* Header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            {invoice.business.logo && (
              <img
                src={invoice.business.logo}
                alt="Business logo"
                className="h-16 w-auto max-w-[160px] object-contain"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {invoice.business.name || 'Business Name'}
              </h2>
              {invoice.business.contactPerson && (
                <p className="text-sm text-muted-foreground">{invoice.business.contactPerson}</p>
              )}
              {invoice.business.address && (
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {invoice.business.address}
                </p>
              )}
              <div className="mt-1 text-sm text-muted-foreground">
                {invoice.business.email && <p>{invoice.business.email}</p>}
                {invoice.business.phone && <p>{invoice.business.phone}</p>}
                {invoice.business.website && <p>{invoice.business.website}</p>}
              </div>
              {invoice.business.taxId && (
                <p className="mt-2 text-sm text-muted-foreground">Tax ID: {invoice.business.taxId}</p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">INVOICE</h1>
            {invoice.details.number && (
              <p className="text-sm font-medium text-muted-foreground">{invoice.details.number}</p>
            )}
            {invoice.details.status && (
              <p className="mt-1 inline-flex rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {invoice.details.status}
              </p>
            )}
          </div>
        </div>

        {/* Bill To & Invoice Meta */}
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bill To</p>
            <div className="mt-2">
              <p className="font-semibold text-foreground">
                {invoice.client.name || invoice.client.companyName || 'Client Name'}
              </p>
              {invoice.client.companyName && invoice.client.name && (
                <p className="text-sm text-muted-foreground">{invoice.client.companyName}</p>
              )}
              {invoice.client.billingAddress && (
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {invoice.client.billingAddress}
                </p>
              )}
              <div className="mt-1 text-sm text-muted-foreground">
                {invoice.client.email && <p>{invoice.client.email}</p>}
                {invoice.client.phone && <p>{invoice.client.phone}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:text-right">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue Date</p>
              <p className="text-sm font-medium text-foreground">
                {invoice.details.issueDate || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Date</p>
              <p className="text-sm font-medium text-foreground">
                {invoice.details.dueDate || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Terms</p>
              <p className="text-sm font-medium text-foreground">
                {invoice.details.paymentTerms || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PO Number</p>
              <p className="text-sm font-medium text-foreground">
                {invoice.details.poNumber || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-10">
          <table className="w-full text-left" aria-label="Invoice items">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax</th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disc</th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.items.map((item) => {
                const values = calculateItemValues(item)
                const showItem = item.name || item.description || values.quantity > 0 || values.unitPrice > 0

                if (!showItem) return null

                return (
                  <tr key={item.id}>
                    <td className="py-3">
                      <p className="font-medium text-foreground">{item.name || 'Item'}</p>
                      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                    </td>
                    <td className="py-3 text-right text-sm tabular-nums text-foreground">{values.quantity}</td>
                    <td className="py-3 text-right text-sm tabular-nums text-foreground">
                      {formatCurrency(values.unitPrice, currency)}
                    </td>
                    <td className="py-3 text-right text-sm tabular-nums text-foreground">
                      {values.taxPercent > 0 ? `${values.taxPercent}%` : '—'}
                    </td>
                    <td className="py-3 text-right text-sm tabular-nums text-foreground">
                      {values.discountPercent > 0 ? `${values.discountPercent}%` : '—'}
                    </td>
                    <td className="py-3 text-right text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(values.lineTotal, currency)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(calculations.subtotal, currency)}</span>
            </div>
            {calculations.discount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Discount</span>
                <span className="tabular-nums">-{formatCurrency(calculations.discount, currency)}</span>
              </div>
            )}
            {calculations.tax > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">{formatCurrency(calculations.tax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
              <span>Grand Total</span>
              <span className="tabular-nums">{formatCurrency(calculations.grandTotal, currency)}</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(invoice.additional.notes || invoice.additional.paymentInstructions || invoice.additional.terms) && (
          <div className="mt-10 space-y-4 border-t border-border pt-6">
            {invoice.additional.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">{invoice.additional.notes}</p>
              </div>
            )}
            {invoice.additional.paymentInstructions && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Instructions</p>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">{invoice.additional.paymentInstructions}</p>
              </div>
            )}
            {invoice.additional.terms && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Terms & Conditions</p>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">{invoice.additional.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
