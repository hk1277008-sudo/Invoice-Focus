import { memo } from 'react'
import { FileText } from 'lucide-react'
import type { InvoiceData, InvoiceCalculations, Currency } from './types'
import { formatCurrency, getCurrencyDecimals } from './currencies'
import { calculateItemValues } from './utils'
import { normalizePresentation, presentationFontFamily } from './presentation'

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

  const presentation = normalizePresentation(invoice.presentation)
  const dark = presentation.template === 'executive'
  const serif = presentation.template === 'elegant'
  const band = presentation.headerLayout === 'Band'
  const centered = presentation.headerLayout === 'Centered'
  const titleClass = presentation.titleStyle === 'editorial' ? 'font-serif tracking-[0.12em]' : presentation.titleStyle === 'compact' ? 'text-xl tracking-tight' : 'text-2xl tracking-tight'

  return (
    <div
      className={`invoice-preview-container relative overflow-hidden rounded-xl border shadow-sm print:rounded-none print:border-0 print:shadow-none ${dark ? 'bg-[#182337] text-white' : 'bg-white text-foreground'} ${serif ? 'font-serif' : ''}`}
      data-invoice-template={presentation.template}
      style={{
        '--invoice-primary': presentation.primaryColor,
        '--invoice-accent': presentation.accentColor,
        fontFamily: presentationFontFamily(presentation.font),
      } as React.CSSProperties}
    >
      {presentation.template === 'modern' && <div className="absolute inset-y-0 left-0 w-1.5 print:w-1" style={{ backgroundColor: presentation.primaryColor }} aria-hidden="true" />}
      {presentation.template === 'corporate' && <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: presentation.primaryColor }} aria-hidden="true" />}
      {presentation.template === 'creative' && <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-20" style={{ backgroundColor: presentation.accentColor }} aria-hidden="true" />}
      <div className="min-w-0 p-4 sm:p-10">
        {/* Header */}
        <div className={`relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between ${centered ? 'text-center' : ''} ${band ? 'rounded-xl p-5 text-white' : ''}`} style={band ? { backgroundColor: presentation.primaryColor } : undefined}>
          <div className={`${centered ? 'mx-auto' : ''} space-y-2`}>
            {invoice.business.logo && (
              <img
                src={invoice.business.logo}
                alt={`${invoice.business.name || 'Business'} logo`}
                className="h-16 w-auto max-w-[160px] object-contain"
              />
            )}
            <div>
              <h2 className={`text-xl font-bold ${dark || band ? 'text-white' : 'text-foreground'}`}>
                {invoice.business.name || 'Business Name'}
              </h2>
              {invoice.business.contactPerson && (
                <p className={dark || band ? 'text-sm text-white/65' : 'text-sm text-muted-foreground'}>{invoice.business.contactPerson}</p>
              )}
              {invoice.business.address && (
                <p className={`mt-1 whitespace-pre-line text-sm ${dark || band ? 'text-white/65' : 'text-muted-foreground'}`}>
                  {invoice.business.address}
                </p>
              )}
              <div className={`mt-1 text-sm ${dark || band ? 'text-white/65' : 'text-muted-foreground'}`}>
                {invoice.business.email && <p>{invoice.business.email}</p>}
                {invoice.business.phone && <p>{invoice.business.phone}</p>}
                {invoice.business.website && <p>{invoice.business.website}</p>}
              </div>
              {invoice.business.taxId && (
                <p className={`mt-2 text-sm ${dark || band ? 'text-white/65' : 'text-muted-foreground'}`}>Tax ID: {invoice.business.taxId}</p>
              )}
            </div>
          </div>

          <div className={`text-left sm:text-right ${centered ? 'hidden' : ''}`}>
            <h1 className={`font-bold ${titleClass} ${dark || band ? 'text-white' : 'text-foreground'}`}>INVOICE</h1>
            {invoice.details.number && (
              <p className={dark || band ? 'text-sm font-medium text-white/65' : 'text-sm font-medium text-muted-foreground'}>{invoice.details.number}</p>
            )}
            {invoice.details.status && (
              <p className="mt-1 inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${presentation.primaryColor}18`, color: dark || band ? '#fff' : presentation.primaryColor }}>
                {invoice.details.status}
              </p>
            )}
          </div>
        </div>

        {/* Bill To & Invoice Meta */}
        <div className={`relative mt-10 grid gap-8 border-y py-5 sm:grid-cols-2 ${dark ? 'border-white/10' : 'border-border'}`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>Bill To</p>
            <div className="mt-2">
                <p className={`font-semibold ${dark ? 'text-white' : 'text-foreground'}`}>
                {invoice.client.name || invoice.client.companyName || 'Client Name'}
              </p>
              {invoice.client.companyName && invoice.client.name && (
                <p className={dark ? 'text-sm text-white/60' : 'text-sm text-muted-foreground'}>{invoice.client.companyName}</p>
              )}
              {invoice.client.billingAddress && (
                <p className={`mt-1 whitespace-pre-line text-sm ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {invoice.client.billingAddress}
                </p>
              )}
              <div className={`mt-1 text-sm ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>
                {invoice.client.email && <p>{invoice.client.email}</p>}
                {invoice.client.phone && <p>{invoice.client.phone}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:text-right">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>Issue Date</p>
              <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>
                {invoice.details.issueDate || '—'}
              </p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>Due Date</p>
              <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>
                {invoice.details.dueDate || '—'}
              </p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>Payment Terms</p>
              <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>
                {invoice.details.paymentTerms || '—'}
              </p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>PO Number</p>
              <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>
                {invoice.details.poNumber || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className={`mt-10 max-w-full overflow-x-auto ${presentation.template === 'corporate' || presentation.template === 'professional' ? 'border-t-2' : ''}`} style={{ borderColor: presentation.primaryColor }}>
          <table className="w-full min-w-[520px] table-fixed text-left" aria-label="Invoice items">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[10%]" />
              <col className="w-[15%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead>
              <tr className={`border-b ${dark ? 'border-white/10' : 'border-border'}`}>
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
                      <p className={`font-medium ${dark ? 'text-white' : 'text-foreground'}`}>{item.name || 'Item'}</p>
                      {item.description && <p className={dark ? 'text-sm text-white/55' : 'text-sm text-muted-foreground'}>{item.description}</p>}
                    </td>
                    <td className={`py-3 text-right text-sm tabular-nums ${dark ? 'text-white' : 'text-foreground'}`}>{values.quantity}</td>
                    <td className={`py-3 text-right text-sm tabular-nums ${dark ? 'text-white' : 'text-foreground'}`}>
                      {formatCurrency(values.unitPrice, currency)}
                    </td>
                    <td className={`py-3 text-right text-sm tabular-nums ${dark ? 'text-white' : 'text-foreground'}`}>
                      {values.taxPercent > 0 ? `${values.taxPercent}%` : '—'}
                    </td>
                    <td className={`py-3 text-right text-sm tabular-nums ${dark ? 'text-white' : 'text-foreground'}`}>
                      {values.discountPercent > 0 ? `${values.discountPercent}%` : '—'}
                    </td>
                    <td className={`py-3 text-right text-sm font-medium tabular-nums ${dark ? 'text-white' : 'text-foreground'}`}>
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
          <div className="w-full min-w-0 max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="min-w-0">Subtotal</span>
              <span className="min-w-0 break-all text-right tabular-nums">{formatCurrency(calculations.subtotal, currency)}</span>
            </div>
            {calculations.discount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="min-w-0">Discount</span>
                <span className="min-w-0 break-all text-right tabular-nums">-{formatCurrency(calculations.discount, currency)}</span>
              </div>
            )}
            {calculations.tax > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="min-w-0">Tax</span>
                <span className="min-w-0 break-all text-right tabular-nums">{formatCurrency(calculations.tax, currency)}</span>
              </div>
            )}
            <div className={`flex justify-between border-t pt-2 text-base font-bold ${dark ? 'border-white/15 text-white' : 'border-border text-foreground'}`}>
              <span className="min-w-0">Grand Total</span>
              <span className="min-w-0 break-all text-right tabular-nums" style={{ color: dark ? '#fff' : presentation.primaryColor }}>{formatCurrency(calculations.grandTotal, currency)}</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(invoice.additional.notes || invoice.additional.paymentInstructions || invoice.additional.terms) && (
          <div className={`mt-10 space-y-4 border-t pt-6 ${dark ? 'border-white/10' : 'border-border'}`}>
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
