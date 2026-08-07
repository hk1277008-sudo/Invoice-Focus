import { memo } from 'react'
import { FileText } from 'lucide-react'
import type { InvoiceData, InvoiceCalculations, Currency } from './types'
import { formatCurrency, getCurrencyDecimals } from './currencies'
import { calculateItemValues } from './utils'
import { normalizePresentation, presentationFontFamily, templateFamily } from './presentation'
import { documentTypeMeta, normalizeDocumentDetails, normalizeDocumentType } from './document-types'

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
  const documentType = normalizeDocumentType(invoice.documentType)
  const documentMeta = documentTypeMeta(documentType)
  const documentDetails = normalizeDocumentDetails(invoice.documentDetails)
  const family = templateFamily(presentation.template)
  const dark = family === 'enterprise'
  const serif = family === 'minimal' || presentation.template === 'elegant'
  const band = family === 'enterprise' || presentation.headerLayout === 'Band'
  const centered = family === 'minimal' || presentation.headerLayout === 'Centered'
  const titleClass = presentation.titleStyle === 'editorial' ? 'font-serif tracking-[0.12em]' : presentation.titleStyle === 'compact' ? 'text-xl tracking-tight' : 'text-2xl tracking-tight'
  const visibleItems = invoice.items.filter((item) => {
    const values = calculateItemValues(item)
    return item.name || item.description || values.quantity > 0 || values.unitPrice > 0
  })
  const showAdjustments = visibleItems.some((item) => {
    const values = calculateItemValues(item)
    return values.taxPercent > 0 || values.discountPercent > 0
  })
  const showSku = documentType === 'purchase-order'

  return (
    <div
      className={`invoice-preview-container relative overflow-hidden ${family === 'minimal' ? 'rounded-none border-0 shadow-none' : 'rounded-xl border shadow-sm'} print:rounded-none print:border-0 print:shadow-none ${dark ? 'bg-[#182337] text-white' : 'bg-white text-foreground'} ${serif ? 'font-serif' : ''}`}
      data-invoice-template={presentation.template}
      data-document-type={documentType}
      style={{
        '--invoice-primary': presentation.primaryColor,
        '--invoice-accent': presentation.accentColor,
        fontFamily: presentationFontFamily(presentation.font),
      } as React.CSSProperties}
    >
      {family === 'enterprise' && <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: presentation.primaryColor }} aria-hidden="true" />}
      {family === 'professional' && <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: presentation.primaryColor }} aria-hidden="true" />}
      {family === 'minimal' && <div className="absolute right-8 top-8 h-16 w-16 rounded-full opacity-10" style={{ backgroundColor: presentation.accentColor }} aria-hidden="true" />}
      <div className={`relative min-w-0 ${family === 'minimal' ? 'p-5 sm:p-14' : family === 'enterprise' ? 'p-4 sm:p-8' : 'p-4 sm:p-10'}`}>
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

          <div className={`text-left sm:text-right ${centered ? 'mx-auto text-center sm:text-center' : ''}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark || band ? 'text-white/60' : 'text-muted-foreground'}`}>{documentMeta.numberLabel}</p>
            <h2 className={`font-bold ${titleClass} ${dark || band ? 'text-white' : 'text-foreground'}`}>{documentMeta.title}</h2>
            {invoice.details.number && (
              <p className={dark || band ? 'text-sm font-medium text-white/65' : 'text-sm font-medium text-muted-foreground'}>{invoice.details.number}</p>
            )}
            {(documentMeta.statusLabel || invoice.details.status) && (
              <p className="mt-1 inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${presentation.primaryColor}18`, color: dark || band ? '#fff' : presentation.primaryColor }}>
                {documentMeta.statusLabel || invoice.details.status}
              </p>
            )}
          </div>
        </div>

        {/* Bill To & Invoice Meta */}
        <div className={`relative mt-10 grid gap-8 ${family === 'minimal' ? 'border-0 py-2' : 'border-y py-5'} sm:grid-cols-2 ${dark ? 'border-white/10' : 'border-border'}`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>{documentMeta.billToLabel}</p>
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
               <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>{documentMeta.issueDateLabel}</p>
              <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>
                {invoice.details.issueDate || '—'}
              </p>
            </div>
            {!documentMeta.hideDueDate && (
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>{documentMeta.dueDateLabel}</p>
                <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>
                  {invoice.details.dueDate || '—'}
                </p>
              </div>
            )}
            <div>
               <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>{documentMeta.termsLabel}</p>
              <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>
                {invoice.details.paymentTerms || '—'}
              </p>
            </div>
            <div>
               <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>{documentMeta.referenceLabel}</p>
              <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>
                {invoice.details.poNumber || '—'}
              </p>
            </div>
          </div>
        </div>

        {documentType === 'receipt' && (
          <div className={`mt-8 grid gap-4 rounded-xl border p-4 sm:grid-cols-3 ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-emerald-200 bg-emerald-50/60'}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-emerald-700'}`}>Payment Received</p>
              <p className={`mt-1 text-sm font-semibold ${dark ? 'text-white' : 'text-emerald-950'}`}>Paid in full</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-emerald-700'}`}>Payment Method</p>
              <p className={`mt-1 text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>{invoice.details.paymentTerms || '—'}</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-emerald-700'}`}>Transaction ID</p>
              <p className={`mt-1 break-words text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>{documentDetails.transactionId || invoice.details.poNumber || '—'}</p>
            </div>
          </div>
        )}

        {documentType === 'quote' && (
          <div className={`mt-8 rounded-xl border p-5 ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-border bg-muted/20'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>Client Approval</p>
                <p className={`mt-1 text-sm font-semibold ${dark ? 'text-white' : 'text-foreground'}`}>{documentDetails.approvalName || 'Approval requested'}</p>
                {documentDetails.acceptanceNote && <p className={`mt-2 whitespace-pre-line text-sm ${dark ? 'text-white/65' : 'text-muted-foreground'}`}>{documentDetails.acceptanceNote}</p>}
              </div>
              {documentDetails.approvalDate && (
                <div className="shrink-0 sm:text-right">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>Accepted On</p>
                  <p className={`mt-1 text-sm font-medium ${dark ? 'text-white' : 'text-foreground'}`}>{documentDetails.approvalDate}</p>
                </div>
              )}
            </div>
            <div className={`mt-5 border-t pt-4 ${dark ? 'border-white/10' : 'border-border'}`}>
              <p className={`text-xs ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>Signature / approval</p>
              <div className={`mt-5 h-7 border-b ${dark ? 'border-white/25' : 'border-foreground/30'}`} />
            </div>
          </div>
        )}

        {documentType === 'estimate' && (
          <div className={`mt-8 grid gap-5 rounded-xl border p-5 sm:grid-cols-[minmax(0,1fr)_180px] ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-border bg-muted/20'}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>Scope</p>
              <p className={`mt-2 whitespace-pre-line text-sm leading-6 ${dark ? 'text-white/70' : 'text-muted-foreground'}`}>{documentDetails.scope || 'Project scope will be confirmed before work begins.'}</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-muted-foreground'}`}>Estimated Timeline</p>
              <p className={`mt-2 text-sm font-semibold ${dark ? 'text-white' : 'text-foreground'}`}>{documentDetails.estimatedTimeline || 'To be confirmed'}</p>
            </div>
          </div>
        )}

        {documentType === 'credit-note' && (
          <div className={`mt-8 grid gap-5 rounded-xl border p-5 sm:grid-cols-3 ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-rose-200 bg-rose-50/50'}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-rose-700'}`}>Original Invoice</p>
              <p className={`mt-1 text-sm font-semibold ${dark ? 'text-white' : 'text-foreground'}`}>{documentDetails.originalInvoiceReference || '—'}</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-rose-700'}`}>Reason for Credit</p>
              <p className={`mt-1 whitespace-pre-line text-sm ${dark ? 'text-white/70' : 'text-muted-foreground'}`}>{documentDetails.reasonForCredit || 'Refund or adjustment'}</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-rose-700'}`}>Remaining Balance</p>
              <p className={`mt-1 text-sm font-semibold ${dark ? 'text-white' : 'text-foreground'}`}>{documentDetails.remainingBalance || '—'}</p>
            </div>
          </div>
        )}
        {documentType === 'purchase-order' && (
          <div className={`mt-8 grid gap-5 rounded-xl border p-5 sm:grid-cols-3 ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-blue-200 bg-blue-50/50'}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-blue-700'}`}>Requested Delivery</p>
              <p className={`mt-1 text-sm font-semibold ${dark ? 'text-white' : 'text-foreground'}`}>{documentDetails.deliveryDate || 'To be confirmed'}</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-blue-700'}`}>Authorized By</p>
              <p className={`mt-1 text-sm font-semibold ${dark ? 'text-white' : 'text-foreground'}`}>{documentDetails.authorizedBy || '—'}</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-blue-700'}`}>Authorization Date</p>
              <p className={`mt-1 text-sm font-semibold ${dark ? 'text-white' : 'text-foreground'}`}>{documentDetails.authorizationDate || '—'}</p>
            </div>
            {documentDetails.deliveryInstructions && (
              <div className={`border-t pt-4 sm:col-span-3 ${dark ? 'border-white/10' : 'border-blue-200'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-blue-700'}`}>Delivery Instructions</p>
                <p className={`mt-1 whitespace-pre-line text-sm ${dark ? 'text-white/70' : 'text-muted-foreground'}`}>{documentDetails.deliveryInstructions}</p>
              </div>
            )}
          </div>
        )}

        {/* Items Table */}
        <div className={`mt-10 max-w-full overflow-hidden ${family === 'enterprise' ? 'border-t-2' : family === 'professional' ? 'border-t' : ''}`} style={{ borderColor: presentation.primaryColor }}>
          <table className="hidden w-full min-w-0 table-fixed border-separate border-spacing-0 text-left text-xs sm:table sm:text-sm print:table" aria-label="Invoice items">
            <colgroup>
              <col className={showAdjustments ? (showSku ? 'w-[31%]' : 'w-[36%]') : (showSku ? 'w-[38%]' : 'w-[46%]')} />
              {showSku && <col className="w-[13%]" />}
              <col className={showAdjustments ? 'w-[9%]' : 'w-[12%]'} />
              <col className={showAdjustments ? 'w-[15%]' : 'w-[20%]'} />
              {showAdjustments && <><col className="w-[13%]" /><col className="w-[14%]" /></>}
              <col className={showAdjustments ? 'w-[13%]' : 'w-[22%]'} />
            </colgroup>
            <thead>
              <tr className={`border-b ${dark ? 'border-white/10' : 'border-border'}`}>
                 <th className="break-words px-2.5 py-3 text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:px-3">{documentMeta.itemsLabel}</th>
                 {showSku && <th className="break-words px-2.5 py-3 text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:px-3">SKU</th>}
                 <th className="break-words px-2.5 py-3 text-right text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:px-3">Qty</th>
                <th className="break-words px-2.5 py-3 text-right text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:px-3">Price</th>
                {showAdjustments && <><th className="break-words px-2.5 py-3 text-right text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:px-3">Tax</th><th className="break-words px-2.5 py-3 text-right text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:px-3">Discount</th></>}
                <th className="break-words px-2.5 py-3 text-right text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:px-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleItems.map((item) => {
                const values = calculateItemValues(item)

                return (
                  <tr key={item.id}>
                     <td className="min-w-0 break-words px-2.5 py-4 align-top sm:px-3">
                 <p className={`break-words font-medium leading-5 ${dark ? 'text-white' : 'text-foreground'}`}>{item.name || 'Item'}</p>
                       {showSku && item.sku && <p className={`mt-1 text-xs ${dark ? 'text-white/55' : 'text-muted-foreground'}`}>SKU: {item.sku}</p>}
                      {item.description && <p className={`mt-1 break-words text-xs leading-5 ${dark ? 'text-white/55' : 'text-muted-foreground'}`}>{item.description}</p>}
                    </td>
                      {showSku && <td className={`break-words px-2.5 py-4 align-top text-xs ${dark ? 'text-white/70' : 'text-muted-foreground'} sm:px-3`}>{item.sku || '—'}</td>}
                      <td className={`break-words px-2.5 py-4 text-right align-top text-sm tabular-nums ${dark ? 'text-white' : 'text-foreground'} sm:px-3`}>{values.quantity}</td>
                     <td className={`break-words px-2.5 py-4 text-right align-top text-sm tabular-nums ${dark ? 'text-white' : 'text-foreground'} sm:px-3`}>
                      {formatCurrency(values.unitPrice, currency)}
                    </td>
                     {showAdjustments && <><td className={`break-words px-2.5 py-4 text-right align-top text-sm tabular-nums ${dark ? 'text-white' : 'text-foreground'} sm:px-3`}>{values.taxPercent > 0 ? `${values.taxPercent}%` : '—'}</td><td className={`break-words px-2.5 py-4 text-right align-top text-sm tabular-nums ${dark ? 'text-white' : 'text-foreground'} sm:px-3`}>{values.discountPercent > 0 ? `${values.discountPercent}%` : '—'}</td></>}
                     <td className={`break-words px-2.5 py-4 text-right align-top text-sm font-semibold tabular-nums ${dark ? 'text-white' : 'text-foreground'} sm:px-3`}>
                      {formatCurrency(values.lineTotal, currency)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
            <div className="space-y-3 sm:hidden print:hidden" aria-label="Invoice items">
               {visibleItems.map((item) => {
                const values = calculateItemValues(item)
                return (
                  <article key={item.id} className={`rounded-lg border p-3 ${dark ? 'border-white/10 bg-white/[0.03]' : 'border-border bg-muted/20'}`}>
                    <div className="min-w-0">
                       <p className={`break-words font-semibold leading-5 ${dark ? 'text-white' : 'text-foreground'}`}>{item.name || 'Item'}</p>
                       {showSku && item.sku && <p className={`mt-1 text-xs ${dark ? 'text-white/55' : 'text-muted-foreground'}`}>SKU: {item.sku}</p>}
                      {item.description && <p className={`mt-1 break-words text-xs leading-5 ${dark ? 'text-white/55' : 'text-muted-foreground'}`}>{item.description}</p>}
                    </div>
                    <div className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 ${dark ? 'border-white/10' : 'border-border'}`}>
                      <div><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Qty</p><p className="mt-1 text-sm tabular-nums">{values.quantity}</p></div>
                      <div><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Price</p><p className="mt-1 break-words text-sm tabular-nums">{formatCurrency(values.unitPrice, currency)}</p></div>
                      {showAdjustments && <><div><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Tax</p><p className="mt-1 text-sm tabular-nums">{values.taxPercent > 0 ? `${values.taxPercent}%` : '—'}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Discount</p><p className="mt-1 text-sm tabular-nums">{values.discountPercent > 0 ? `${values.discountPercent}%` : '—'}</p></div></>}
                      <div className="col-span-2 border-t pt-3" style={{ borderColor: dark ? 'rgba(255,255,255,.1)' : undefined }}><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Amount</p><p className={`mt-1 text-base font-semibold tabular-nums ${dark ? 'text-white' : 'text-foreground'}`}>{formatCurrency(values.lineTotal, currency)}</p></div>
                    </div>
                  </article>
                )
              })}
            </div>
        </div>

        {/* Totals */}
        <div className="mt-8 flex justify-end">
          <div className="w-full min-w-0 max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="min-w-0">{documentMeta.subtotalLabel}</span>
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
               <span className="min-w-0">{documentMeta.taxLabel}</span>
                <span className="min-w-0 break-all text-right tabular-nums">{formatCurrency(calculations.tax, currency)}</span>
              </div>
            )}
            {calculations.shipping > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="min-w-0">Shipping / Handling</span>
                <span className="min-w-0 break-all text-right tabular-nums">{formatCurrency(calculations.shipping, currency)}</span>
              </div>
            )}
             <div className={`flex justify-between border-t pt-2 text-base font-bold ${family === 'enterprise' ? 'rounded-lg border-0 px-3 py-3' : ''} ${dark ? 'border-white/15 bg-white/[0.06] text-white' : 'border-border text-foreground'}`}>
               <span className="min-w-0">{documentMeta.totalLabel}</span>
              <span className="min-w-0 break-all text-right tabular-nums" style={{ color: dark ? '#fff' : presentation.primaryColor }}>{formatCurrency(calculations.grandTotal, currency)}</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(invoice.additional.notes || invoice.additional.paymentInstructions || invoice.additional.terms) && (
          <div className={`mt-10 space-y-4 border-t pt-6 ${dark ? 'border-white/10' : 'border-border'}`}>
            {invoice.additional.notes && (
              <div>
               <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{documentMeta.notesLabel}</p>
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
