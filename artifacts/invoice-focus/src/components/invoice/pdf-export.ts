import type { InvoiceData } from './types'
import { formatCurrency, getCurrencyByCode } from './currencies'
import { calculateInvoiceTotals, calculateItemValues } from './utils'
import { normalizePresentation, presentationFontFamily, templateFamily } from './presentation'
import { documentTypeMeta, normalizeDocumentType } from './document-types'

export function generateInvoiceFileName(invoice: InvoiceData): string {
  const number = invoice.details.number?.trim() || 'invoice'
  return `${number.replace(/\s+/g, '_').toLowerCase()}.pdf`
}

export function buildPrintableInvoiceHTML(invoice: InvoiceData): { html: string; fileName: string } {
  const currency = getCurrencyByCode(invoice.details.currency)
  const calculations = calculateInvoiceTotals(invoice.items)
  const presentation = normalizePresentation(invoice.presentation)
  const documentType = normalizeDocumentType(invoice.documentType)
  const documentMeta = documentTypeMeta(documentType)
  const family = templateFamily(presentation.template)
  const fileName = generateInvoiceFileName(invoice)
  const dark = family === 'enterprise'
  const band = family === 'enterprise' || presentation.headerLayout === 'Band'
  const centered = family === 'minimal' || presentation.headerLayout === 'Centered'
  const pageWidth = presentation.paperSize === 'Letter' ? '8.5in' : '210mm'
  const font = presentationFontFamily(presentation.font)
  const visibleItems = invoice.items
    .filter((item) => item.name.trim() || item.description.trim() || Number(item.quantity) > 0 || Number(item.unitPrice) > 0)
  const showAdjustments = visibleItems.some((item) => {
    const values = calculateItemValues(item)
    return values.taxPercent > 0 || values.discountPercent > 0
  })
  const itemsHTML = visibleItems
    .map((item) => {
      const values = calculateItemValues(item)
      const adjustments = showAdjustments
        ? `<td class="num">${values.taxPercent > 0 ? values.taxPercent + '%' : '—'}</td><td class="num">${values.discountPercent > 0 ? values.discountPercent + '%' : '—'}</td>`
        : ''
      return `<tr><td><div class="item-name">${escapeHtml(item.name || 'Item')}</div>${item.description ? `<div class="item-description">${escapeHtml(item.description)}</div>` : ''}</td><td class="num">${values.quantity}</td><td class="num">${formatCurrency(values.unitPrice, currency)}</td>${adjustments}<td class="num">${formatCurrency(values.lineTotal, currency)}</td></tr>`
    })
    .join('')
  const tableColumns = showAdjustments
    ? '<col class="description"><col class="qty"><col class="price"><col class="tax"><col class="discount"><col class="amount">'
    : '<col class="description-simple"><col class="qty-simple"><col class="price-simple"><col class="amount-simple">'
  const tableHeaders = showAdjustments
    ? '<th>Description</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Tax</th><th class="num">Discount</th><th class="num">Amount</th>'
    : '<th>Description</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th>'

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(invoice.details.number || 'Invoice')}</title>
<style>
  @page { size: ${presentation.paperSize}; margin: ${family === 'minimal' ? '20mm' : family === 'enterprise' ? '12mm' : '16mm'}; }
  * { box-sizing: border-box; }
  :root { --primary: ${presentation.primaryColor}; --accent: ${presentation.accentColor}; }
  body { font-family: ${font}; color: ${dark ? '#f5f8fc' : '#172033'}; background: ${dark ? '#182337' : '#fff'}; margin: 0; padding: 0; line-height: 1.5; font-size: 11px; }
  .invoice { position: relative; width: 100%; max-width: ${pageWidth}; margin: 0 auto; padding: ${family === 'minimal' ? '12px' : family === 'enterprise' ? '0' : '6px'}; overflow: hidden; }
  .rail { position: absolute; inset: 0 auto 0 0; width: 4px; background: var(--primary); }
  .topbar { position: absolute; inset: 0 0 auto; height: 6px; background: var(--primary); }
  .orb { position: absolute; right: -55px; top: -55px; width: 180px; height: 180px; border-radius: 50%; background: var(--accent); opacity: .2; }
  .header { position: relative; display: flex; justify-content: ${centered ? 'center' : 'space-between'}; align-items: flex-start; gap: 24px; margin-bottom: ${family === 'minimal' ? '38px' : '28px'}; ${band ? `background: var(--primary); color: #fff; border-radius: 10px; padding: 18px;` : ''} }
  .header-left { flex: 1; ${centered ? 'text-align: center;' : ''} }
  .header-right { text-align: right; ${centered ? 'margin: 0 auto; text-align: center;' : ''} }
  .logo { max-height: 56px; max-width: 160px; object-fit: contain; margin-bottom: 8px; }
  .business-name { font-size: 20px; font-weight: 700; margin: 0; }
  .muted { color: ${dark || band ? 'rgba(255,255,255,.62)' : '#6b7280'}; margin: 0; }
  .meta-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; color: ${dark ? 'rgba(255,255,255,.48)' : '#7c8798'}; margin-bottom: 3px; }
  .meta-value { font-size: 11px; color: ${dark ? '#fff' : '#172033'}; margin: 0; }
  .columns { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 26px; border-top: ${family === 'minimal' ? '0' : `1px solid ${dark ? 'rgba(255,255,255,.1)' : '#e5eaf0'}`}; border-bottom: ${family === 'minimal' ? '0' : `1px solid ${dark ? 'rgba(255,255,255,.1)' : '#e5eaf0'}`}; padding: 14px 0; }
  .column { flex: 1; } .column-right { text-align: right; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .status { display: inline-block; padding: 4px 9px; border-radius: 999px; background: ${dark || band ? 'rgba(255,255,255,.15)' : `${presentation.primaryColor}18`}; color: ${dark || band ? '#fff' : presentation.primaryColor}; font-size: 9px; font-weight: 700; margin-top: 6px; }
  table { width: 100%; table-layout: fixed; border-collapse: collapse; margin-bottom: 22px; page-break-inside: auto; }
  thead { display: table-header-group; } tr { page-break-inside: avoid; page-break-after: auto; }
  col.description { width: 36%; } col.qty { width: 9%; } col.price { width: 15%; } col.tax { width: 13%; } col.discount { width: 14%; } col.amount { width: 13%; }
  col.description-simple { width: 46%; } col.qty-simple { width: 12%; } col.price-simple { width: 20%; } col.amount-simple { width: 22%; }
  th { text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: ${dark ? 'rgba(255,255,255,.55)' : '#7c8798'}; border-bottom: ${family === 'enterprise' ? `2px solid ${presentation.primaryColor}` : family === 'professional' ? `1px solid ${presentation.primaryColor}` : `1px solid ${dark ? 'rgba(255,255,255,.15)' : '#e5e7eb'}`}; padding: 10px 7px; overflow-wrap: anywhere; }
  td { padding: 12px 7px; border-bottom: 1px solid ${dark ? 'rgba(255,255,255,.1)' : '#e5e7eb'}; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; }
  th.num, td.num { text-align: right; } .item-name { font-weight: 600; } .item-description { font-size: 10px; color: ${dark ? 'rgba(255,255,255,.55)' : '#6b7280'}; margin-top: 2px; }
  .totals { margin-left: auto; width: 100%; max-width: 240px; } .totals-row { display: flex; justify-content: space-between; padding: 4px 0; color: ${dark ? 'rgba(255,255,255,.6)' : '#6b7280'}; }
  .totals-row.total { border-top: 1px solid ${dark ? 'rgba(255,255,255,.15)' : '#e5e7eb'}; margin-top: 6px; padding: ${family === 'enterprise' ? '10px' : '8px 0 0'}; ${family === 'enterprise' ? 'border-radius: 6px; background: rgba(255,255,255,.06);' : ''} font-weight: 700; color: ${dark ? '#fff' : '#172033'}; font-size: 14px; }
  .additional { margin-top: 24px; border-top: 1px solid ${dark ? 'rgba(255,255,255,.1)' : '#e5e7eb'}; padding-top: 16px; page-break-inside: avoid; } .additional-block { margin-bottom: 14px; }
  .additional-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: ${dark ? 'rgba(255,255,255,.5)' : '#7c8798'}; margin-bottom: 4px; } .additional-text { white-space: pre-line; margin: 0; }
  .footer { margin-top: 32px; border-top: 1px solid ${dark ? 'rgba(255,255,255,.1)' : '#e5e7eb'}; padding-top: 12px; color: ${dark ? 'rgba(255,255,255,.5)' : '#8b96a6'}; font-size: 9px; }
  .footer-bar { background: var(--accent); border: 0; border-radius: 6px; padding: 7px 9px; color: #fff; }
  @media screen and (max-width: 680px) { .invoice { padding: 5mm; } .header, .columns { flex-direction: column; } .header-right, .column-right { text-align: left; } .column-right { grid-template-columns: 1fr 1fr; } }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .invoice { padding: 0; } img { break-inside: avoid; } }
</style></head><body>
<main class="invoice">${family === 'enterprise' ? '<div class="topbar"></div>' : family === 'professional' ? '<div class="rail"></div>' : '<div class="orb"></div>'}
  <header class="header"><div class="header-left">${invoice.business.logo ? `<img class="logo" src="${escapeHtml(invoice.business.logo)}" alt="${escapeHtml(invoice.business.name || 'Business')} logo">` : ''}<p class="business-name">${escapeHtml(invoice.business.name || 'Business Name')}</p>${invoice.business.contactPerson ? `<p class="muted">${escapeHtml(invoice.business.contactPerson)}</p>` : ''}${invoice.business.address ? `<p class="muted">${escapeHtml(invoice.business.address).replace(/\n/g, '<br>')}</p>` : ''}<div style="margin-top:6px">${invoice.business.email ? `<p class="muted">${escapeHtml(invoice.business.email)}</p>` : ''}${invoice.business.phone ? `<p class="muted">${escapeHtml(invoice.business.phone)}</p>` : ''}${invoice.business.website ? `<p class="muted">${escapeHtml(invoice.business.website)}</p>` : ''}</div>${invoice.business.taxId ? `<p class="muted" style="margin-top:8px">Tax ID: ${escapeHtml(invoice.business.taxId)}</p>` : ''}</div><div class="header-right"><p class="meta-label">${escapeHtml(documentMeta.numberLabel)}</p><p class="business-name" style="font-size:${presentation.titleStyle === 'compact' ? '19px' : '24px'}">${escapeHtml(documentMeta.title)}</p>${invoice.details.number ? `<p class="meta-value">${escapeHtml(invoice.details.number)}</p>` : ''}${documentType === 'receipt' ? '<span class="status">PAYMENT RECEIVED</span>' : invoice.details.status ? `<span class="status">${escapeHtml(invoice.details.status)}</span>` : ''}</div></header>
  <section class="columns"><div class="column"><p class="meta-label">${escapeHtml(documentMeta.billToLabel)}</p><p class="meta-value">${escapeHtml(invoice.client.name || invoice.client.companyName || 'Client Name')}</p>${invoice.client.companyName && invoice.client.name ? `<p class="muted">${escapeHtml(invoice.client.companyName)}</p>` : ''}${invoice.client.billingAddress ? `<p class="muted">${escapeHtml(invoice.client.billingAddress).replace(/\n/g, '<br>')}</p>` : ''}<div style="margin-top:6px">${invoice.client.email ? `<p class="muted">${escapeHtml(invoice.client.email)}</p>` : ''}${invoice.client.phone ? `<p class="muted">${escapeHtml(invoice.client.phone)}</p>` : ''}</div></div><div class="column column-right"><div><p class="meta-label">${escapeHtml(documentMeta.issueDateLabel)}</p><p class="meta-value">${invoice.details.issueDate || '—'}</p></div><div><p class="meta-label">${escapeHtml(documentMeta.dueDateLabel)}</p><p class="meta-value">${invoice.details.dueDate || '—'}</p></div><div><p class="meta-label">${escapeHtml(documentMeta.termsLabel)}</p><p class="meta-value">${escapeHtml(invoice.details.paymentTerms || '—')}</p></div><div><p class="meta-label">${escapeHtml(documentMeta.referenceLabel)}</p><p class="meta-value">${escapeHtml(invoice.details.poNumber || '—')}</p></div></div></section>
     <table><colgroup>${tableColumns}</colgroup><thead><tr>${tableHeaders.replace('<th>Description</th>', `<th>${documentMeta.itemsLabel}</th>`)}</tr></thead><tbody>${itemsHTML}</tbody></table>
  <div class="totals"><div class="totals-row"><span>${documentMeta.subtotalLabel}</span><span>${formatCurrency(calculations.subtotal, currency)}</span></div>${calculations.discount > 0 ? `<div class="totals-row"><span>Discount</span><span>-${formatCurrency(calculations.discount, currency)}</span></div>` : ''}${calculations.tax > 0 ? `<div class="totals-row"><span>${documentMeta.taxLabel}</span><span>${formatCurrency(calculations.tax, currency)}</span></div>` : ''}<div class="totals-row total"><span>${documentMeta.totalLabel}</span><span style="color:${dark ? '#fff' : presentation.primaryColor}">${formatCurrency(calculations.grandTotal, currency)}</span></div></div>
   ${invoice.additional.notes || invoice.additional.paymentInstructions || invoice.additional.terms ? `<div class="additional">${invoice.additional.notes ? `<div class="additional-block"><p class="additional-title">${documentMeta.notesLabel}</p><p class="additional-text">${escapeHtml(invoice.additional.notes)}</p></div>` : ''}${invoice.additional.paymentInstructions ? `<div class="additional-block"><p class="additional-title">Payment Instructions</p><p class="additional-text">${escapeHtml(invoice.additional.paymentInstructions)}</p></div>` : ''}${invoice.additional.terms ? `<div class="additional-block"><p class="additional-title">Terms</p><p class="additional-text">${escapeHtml(invoice.additional.terms)}</p></div>` : ''}</div>` : ''}
  <footer class="footer ${presentation.footerLayout === 'Bar' ? 'footer-bar' : ''}">${presentation.footerLayout === 'Detailed' ? 'Payment details available on request. · ' : ''}Thank you for your business.${presentation.footerLayout === 'Detailed' ? ` · ${escapeHtml(invoice.business.website || invoice.business.email || '')}` : ''}</footer>
</main></body></html>`
  return { html, fileName }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export function printInvoice(invoice: InvoiceData): boolean {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    return false
  }
  printWindow.document.write(buildPrintableInvoiceHTML(invoice).html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
  return true
}

export function downloadPDF(invoice: InvoiceData): void {
  printInvoice(invoice)
}