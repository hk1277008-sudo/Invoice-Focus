import { memo, type CSSProperties } from 'react'
import { FileText } from 'lucide-react'
import type { InvoiceCalculations, InvoiceData, Currency } from './types'
import { formatCurrency } from './currencies'
import { buildDocumentRenderModel, type DocumentRenderDetail } from './document-rendering'

interface InvoicePreviewProps {
  invoice: InvoiceData
  currency: Currency
  calculations: InvoiceCalculations
  hasAnyData: boolean
}

function DetailGrid({ details, align = 'left' }: { details: DocumentRenderDetail[]; align?: 'left' | 'right' }) {
  if (!details.length) return null
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${align === 'right' ? 'text-left sm:text-right' : ''}`}>
      {details.map((item) => (
        <div key={`${item.label}-${item.value}`} className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
          <p className="mt-1 break-words whitespace-pre-line text-sm font-medium text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function TypeBlock({ title, details, family }: { title: string; details: DocumentRenderDetail[]; family: string }) {
  if (!details.length) return null
  return (
    <section className={`mt-7 grid gap-4 rounded-lg border p-4 sm:grid-cols-3 ${family === 'minimal' ? 'rounded-none border-x-0 bg-transparent' : 'bg-muted/20'} ${family === 'enterprise' ? 'border-t-2' : ''}`}>
      <div className="sm:col-span-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      </div>
      {details.map((item) => (
        <div key={`${item.label}-${item.value}`} className={item.value.length > 90 ? 'sm:col-span-2' : ''}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
          <p className="mt-1 break-words whitespace-pre-line text-sm font-medium text-foreground">{item.value}</p>
        </div>
      ))}
    </section>
  )
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
        <p className="mt-4 max-w-xs text-sm font-medium text-muted-foreground">
          Your document preview will appear here as you enter your details.
        </p>
      </div>
    )
  }

  const model = buildDocumentRenderModel(invoice, currency, calculations)
  const {
    documentMeta,
    family,
    invoice: source,
    presentation,
    visibleItems,
    showAdjustments,
    showSku,
    totals,
  } = model
  const style = {
    '--invoice-primary': presentation.primaryColor,
    '--invoice-accent': presentation.accentColor,
    fontFamily: model.fontFamily,
  } as CSSProperties
  const band = model.band
  const centered = model.centered
  const frameClass = family === 'minimal'
    ? 'rounded-none border-0 shadow-none'
    : family === 'enterprise'
      ? 'rounded-xl border-2 shadow-sm'
      : 'rounded-xl border shadow-sm'
  const surfaceClass = family === 'enterprise' ? 'bg-slate-50/40' : 'bg-white'
  const footerIsBar = presentation.footerLayout === 'Bar'
  const footerContact = [source.business.email, source.business.phone, source.business.website, source.business.address].filter(Boolean).join(' · ')

  return (
    <div
      className={`invoice-preview-container relative overflow-hidden ${frameClass} ${surfaceClass} text-foreground print:rounded-none print:border-0 print:shadow-none`}
      data-invoice-template={presentation.template}
      data-document-type={model.documentType}
      style={style}
    >
      {family === 'enterprise' && <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: presentation.primaryColor }} aria-hidden="true" />}
      {family === 'professional' && <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: presentation.primaryColor }} aria-hidden="true" />}
      {family === 'minimal' && <div className="absolute right-8 top-8 h-16 w-16 rounded-full opacity-10" style={{ backgroundColor: presentation.accentColor }} aria-hidden="true" />}

      <div className={`relative min-w-0 ${family === 'minimal' ? 'p-5 sm:p-10' : family === 'enterprise' ? 'p-4 sm:p-7' : 'p-4 sm:p-8'}`}>
        <header className={`grid gap-6 border-b border-border pb-6 sm:grid-cols-[minmax(0,1fr)_minmax(210px,.72fr)] ${centered ? 'sm:grid-cols-1 text-center' : ''} ${band ? 'rounded-lg border-0 p-5 text-white' : ''}`} style={band ? { backgroundColor: presentation.primaryColor } : undefined}>
          <div className={`min-w-0 ${centered ? 'mx-auto' : ''}`}>
            {source.business.logo && (
              <img
                src={source.business.logo}
                alt={`${source.business.name || 'Business'} logo`}
                className={`mb-3 h-14 w-auto max-w-[170px] object-contain ${centered ? 'mx-auto' : ''}`}
              />
            )}
            {source.business.name && <h2 className={`text-xl font-bold tracking-tight ${band ? 'text-white' : 'text-foreground'}`}>{source.business.name}</h2>}
            {source.business.contactPerson && <p className={`mt-1 text-sm ${band ? 'text-white/70' : 'text-muted-foreground'}`}>{source.business.contactPerson}</p>}
            {source.business.address && <p className={`mt-1 whitespace-pre-line text-sm ${band ? 'text-white/70' : 'text-muted-foreground'}`}>{source.business.address}</p>}
            {(source.business.email || source.business.phone || source.business.website) && (
              <p className={`mt-1 break-words text-sm ${band ? 'text-white/70' : 'text-muted-foreground'}`}>
                {[source.business.email, source.business.phone, source.business.website].filter(Boolean).join(' · ')}
              </p>
            )}
            {source.business.taxId && <p className={`mt-2 text-sm ${band ? 'text-white/70' : 'text-muted-foreground'}`}>Tax ID: {source.business.taxId}</p>}
          </div>

          <div className={`min-w-0 text-left sm:text-right ${centered ? 'mx-auto text-center sm:text-center' : ''}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${band ? 'text-white/65' : 'text-muted-foreground'}`}>{documentMeta.numberLabel}</p>
            <h2 className={`mt-1 font-bold tracking-tight ${presentation.titleStyle === 'compact' ? 'text-xl' : presentation.titleStyle === 'editorial' ? 'font-serif text-2xl tracking-[0.06em]' : 'text-2xl'} ${band ? 'text-white' : 'text-foreground'}`}>{documentMeta.title}</h2>
            {source.details.number && <p className={`mt-1 text-sm font-medium ${band ? 'text-white/70' : 'text-muted-foreground'}`}>{source.details.number}</p>}
            <div className={`mt-5 ${band ? '[&_p]:text-white/75 [&_p.text-foreground]:text-white' : ''}`}>
              <DetailGrid details={model.headerMeta} align={centered ? 'left' : 'right'} />
            </div>
          </div>
        </header>

        <section className={`mt-6 grid gap-6 border-y border-border py-4 ${model.paymentMeta.length ? 'sm:grid-cols-[minmax(0,1fr)_minmax(250px,.9fr)]' : ''}`}>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{documentMeta.billToLabel}</p>
            <div className="mt-2">
              {(source.client.name || source.client.companyName) && <p className="font-semibold text-foreground">{source.client.name || source.client.companyName}</p>}
              {source.client.companyName && source.client.name && <p className="text-sm text-muted-foreground">{source.client.companyName}</p>}
              {source.client.billingAddress && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{source.client.billingAddress}</p>}
              {(source.client.email || source.client.phone) && <p className="mt-1 break-words text-sm text-muted-foreground">{[source.client.email, source.client.phone].filter(Boolean).join(' · ')}</p>}
            </div>
          </div>
          {model.paymentMeta.length > 0 && (
            <div className="min-w-0 text-left sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Payment / Reference</p>
              <div className="mt-3"><DetailGrid details={model.paymentMeta} align="right" /></div>
            </div>
          )}
        </section>

        {model.typeBlock && <TypeBlock title={model.typeBlock.title} details={model.typeBlock.items} family={family} />}

        <section className={`mt-6 max-w-full overflow-hidden ${family === 'enterprise' ? 'border-t-2' : 'border-t'}`} style={{ borderColor: presentation.primaryColor }}>
          <table className="hidden w-full min-w-0 table-fixed border-separate border-spacing-0 text-left text-xs sm:table sm:text-sm print:table" aria-label={documentMeta.itemsLabel}>
            <colgroup>
              <col className={showAdjustments ? (showSku ? 'w-[31%]' : 'w-[39%]') : (showSku ? 'w-[39%]' : 'w-[48%]')} />
              {showSku && <col className="w-[12%]" />}
              <col className={showAdjustments ? 'w-[9%]' : 'w-[12%]'} />
              <col className={showAdjustments ? 'w-[15%]' : 'w-[20%]'} />
              {showAdjustments && <><col className="w-[12%]" /><col className="w-[13%]" /></>}
              <col className={showAdjustments ? 'w-[13%]' : 'w-[20%]'} />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <PreviewHeader>{documentMeta.itemsLabel}</PreviewHeader>
                {showSku && <PreviewHeader>SKU</PreviewHeader>}
                <PreviewHeader numeric>Qty</PreviewHeader>
                <PreviewHeader numeric>Price</PreviewHeader>
                {showAdjustments && <><PreviewHeader numeric>Tax</PreviewHeader><PreviewHeader numeric>Discount</PreviewHeader></>}
                <PreviewHeader numeric>Amount</PreviewHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleItems.map(({ item, values }) => (
                <tr key={item.id}>
                  <td className="min-w-0 break-words px-2.5 py-4 align-top sm:px-3">
                    <p className="break-words font-medium leading-5 text-foreground">{item.name || item.description}</p>
                    {item.name && item.description && <p className="mt-1 break-words whitespace-pre-line text-xs leading-5 text-muted-foreground">{item.description}</p>}
                  </td>
                  {showSku && <td className="break-words px-2.5 py-4 align-top text-xs text-muted-foreground sm:px-3">{item.sku}</td>}
                  <PreviewCell>{values.quantity}</PreviewCell>
                  <PreviewCell>{formatCurrency(values.unitPrice, currency)}</PreviewCell>
                  {showAdjustments && <><PreviewCell>{values.taxPercent > 0 ? `${values.taxPercent}%` : ''}</PreviewCell><PreviewCell>{values.discountPercent > 0 ? `${values.discountPercent}%` : ''}</PreviewCell></>}
                  <PreviewCell strong>{formatCurrency(values.lineTotal, currency)}</PreviewCell>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-3 pt-3 sm:hidden print:hidden" aria-label={documentMeta.itemsLabel}>
            {visibleItems.map(({ item, values }) => (
              <article key={item.id} className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="break-words font-semibold leading-5 text-foreground">{item.name || item.description}</p>
                {showSku && item.sku && <p className="mt-1 text-xs text-muted-foreground">SKU: {item.sku}</p>}
                {item.name && item.description && <p className="mt-1 break-words whitespace-pre-line text-xs leading-5 text-muted-foreground">{item.description}</p>}
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <PreviewMobileValue label="Qty" value={String(values.quantity)} />
                  <PreviewMobileValue label="Price" value={formatCurrency(values.unitPrice, currency)} />
                  {showAdjustments && <><PreviewMobileValue label="Tax" value={values.taxPercent > 0 ? `${values.taxPercent}%` : ''} /><PreviewMobileValue label="Discount" value={values.discountPercent > 0 ? `${values.discountPercent}%` : ''} /></>}
                  <div className="col-span-2 border-t border-border pt-3"><PreviewMobileValue label="Amount" value={formatCurrency(values.lineTotal, currency)} large /></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 flex justify-end">
          <div className={`w-full max-w-xs border-t border-border pt-2 ${family === 'enterprise' ? 'rounded-lg border-0 bg-muted/40 px-3 py-2' : ''}`}>
            {totals.rows.map((row) => <PreviewTotal key={`${row.label}-${row.value}`} label={row.label} value={row.value} />)}
            <div className="mt-2 flex justify-between gap-4 border-t border-border pt-3 text-base font-bold text-foreground">
              <span>{totals.total.label}</span>
              <span className="break-all text-right tabular-nums" style={{ color: presentation.primaryColor }}>{totals.total.value}</span>
            </div>
          </div>
        </section>

        {model.additional.length > 0 && (
          <section className="mt-6 grid gap-5 border-t border-border pt-4 sm:grid-cols-3">
            {model.additional.map((item) => (
              <div key={`${item.label}-${item.value}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                <p className="mt-1 break-words whitespace-pre-line text-sm text-foreground">{item.value}</p>
              </div>
            ))}
          </section>
        )}

        <footer
          className={`mt-6 flex flex-col gap-2 border-t pt-3 text-xs sm:flex-row sm:items-center sm:justify-between ${footerIsBar ? 'rounded-md border-0 px-3 py-2 text-white' : 'border-border text-muted-foreground'}`}
          style={footerIsBar ? { backgroundColor: presentation.accentColor } : undefined}
        >
          <span>Thank you for your business.</span>
          <span className="break-words sm:text-right">{presentation.footerLayout === 'Detailed' ? footerContact : footerContact || source.details.number}</span>
        </footer>
      </div>
    </div>
  )
})

function PreviewHeader({ children, numeric = false }: { children: React.ReactNode; numeric?: boolean }) {
  return <th className={`break-words px-2.5 py-3 text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground sm:px-3 ${numeric ? 'text-right' : ''}`}>{children}</th>
}

function PreviewCell({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={`break-words px-2.5 py-4 text-right align-top text-sm tabular-nums sm:px-3 ${strong ? 'font-semibold' : ''}`}>{children}</td>
}

function PreviewMobileValue({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      {value && <p className={`mt-1 break-words tabular-nums ${large ? 'text-base font-semibold' : 'text-sm'}`}>{value}</p>}
    </div>
  )
}

function PreviewTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="break-all text-right tabular-nums">{value}</span>
    </div>
  )
}