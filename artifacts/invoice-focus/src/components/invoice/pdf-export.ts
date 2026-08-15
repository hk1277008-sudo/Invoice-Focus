import type { InvoiceData } from './types'
import { buildDocumentRenderModel, type DocumentRenderDetail } from './document-rendering'
import { formatCurrency } from './currencies'

export function generateInvoiceFileName(invoice: InvoiceData): string {
  const number = invoice.details.number?.trim() || 'invoice'
  return `${number.replace(/\s+/g, '_').toLowerCase()}.pdf`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function textHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>')
}

function detailsHtml(details: DocumentRenderDetail[], className = ''): string {
  if (!details.length) return ''
  return `<div class="detail-grid ${className}">${details.map((item) => `<div class="detail"><p class="detail-label">${escapeHtml(item.label)}</p><p class="detail-value">${textHtml(item.value)}</p></div>`).join('')}</div>`
}

export function buildPrintableInvoiceHTML(invoice: InvoiceData): { html: string; fileName: string } {
  const model = buildDocumentRenderModel(invoice)
  const {
    calculations,
    documentMeta,
    family,
    fontFamily,
    invoice: source,
    paymentMeta,
    presentation,
    typeBlock,
    totals,
    visibleItems,
    showAdjustments,
    showSku,
  } = model
  const fileName = generateInvoiceFileName(invoice)
  const headerMeta = detailsHtml(model.headerMeta, 'header-meta')
  const paymentDetails = detailsHtml(paymentMeta)
  const itemColumns = [
    '<col class="description">',
    ...(showSku ? ['<col class="sku">'] : []),
    '<col class="qty"><col class="price">',
    ...(showAdjustments ? ['<col class="adjustment"><col class="adjustment">'] : []),
    '<col class="amount">',
  ].join('')
  const itemHeaders = [
    `<th>${escapeHtml(documentMeta.itemsLabel)}</th>`,
    ...(showSku ? ['<th>SKU</th>'] : []),
    ['<th class="numeric">Qty</th>', '<th class="numeric">Price</th>'],
    ...(showAdjustments ? ['<th class="numeric">Tax</th>', '<th class="numeric">Discount</th>'] : []),
    ['<th class="numeric">Amount</th>'],
  ].flat().join('')
  const itemsHtml = visibleItems.map(({ item, values }) => `<tr>${[
    `<td><p class="item-name">${escapeHtml(item.name || item.description)}</p>${item.name && item.description ? `<p class="item-description">${textHtml(item.description)}</p>` : ''}</td>`,
    ...(showSku ? [`<td>${textHtml(item.sku || '')}</td>`] : []),
    `<td class="numeric">${values.quantity}</td>`,
    `<td class="numeric">${escapeHtml(formatCurrency(values.unitPrice, model.currency))}</td>`,
    ...(showAdjustments ? [
      `<td class="numeric">${values.taxPercent > 0 ? `${values.taxPercent}%` : ''}</td>`,
      `<td class="numeric">${values.discountPercent > 0 ? `${values.discountPercent}%` : ''}</td>`,
    ] : []),
    `<td class="numeric strong">${escapeHtml(formatCurrency(values.lineTotal, model.currency))}</td>`,
  ].join('')}</tr>`).join('')
  const subtotalRow = totals.rows.find((row) => /subtotal/i.test(row.label))
  const discountRow = totals.rows.find((row) => /discount/i.test(row.label))
  const taxRow = totals.rows.find((row) => /tax/i.test(row.label))
  const shippingRow = totals.rows.find((row) => /shipping|handling/i.test(row.label))
  const totalsHtml = [
    `<div class="totals-row"><span>${escapeHtml(subtotalRow?.label || 'Subtotal')}</span><span>${escapeHtml(subtotalRow?.value || '—')}</span></div>`,
    `<div class="totals-row"><span>Discount</span><span>${escapeHtml(discountRow?.value || '—')}</span></div>`,
    `<div class="totals-row"><span>${escapeHtml(taxRow?.label || documentMeta.taxLabel)}</span><span>${escapeHtml(taxRow?.value || '—')}</span></div>`,
    ...(shippingRow ? [`<div class="totals-row"><span>${escapeHtml(shippingRow.label)}</span><span>${escapeHtml(shippingRow.value)}</span></div>`] : []),
    `<div class="totals-row total"><span>${escapeHtml(totals.total.label)}</span><span>${escapeHtml(totals.total.value)}</span></div>`,
  ].join('')
  const typeBlockHtml = typeBlock
    ? `<section class="type-block type-block-${family}"><div class="type-block-title">${escapeHtml(typeBlock.title)}</div>${typeBlock.items.map((item) => `<div class="detail"><p class="detail-label">${escapeHtml(item.label)}</p><p class="detail-value">${textHtml(item.value)}</p></div>`).join('')}</section>`
    : ''
  const additionalHtml = model.additional.length
    ? `<section class="additional">${model.additional.map((item) => `<div class="additional-block"><p class="detail-label">${escapeHtml(item.label)}</p><p class="additional-text">${textHtml(item.value)}</p></div>`).join('')}</section>`
    : ''
  const businessContact = source.business.website || source.business.email || source.business.phone
  const detailedFooter = [source.business.email, source.business.phone, source.business.website, source.business.address].filter(Boolean).join(' · ')
  const footerClass = `footer footer-${presentation.footerLayout.toLowerCase()}`
  const headerClass = `document-header ${model.centered ? 'document-header-centered' : ''} ${model.band ? 'document-header-band' : ''}`

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(source.details.number || documentMeta.title)}</title>
    <style>
      @page { size: ${presentation.paperSize} portrait; margin: 0; }
      * { box-sizing: border-box; }
      :root {
        --primary: ${presentation.primaryColor};
        --accent: ${presentation.accentColor};
        --ink: #0f172a;
        --muted: #64748b;
        --border: #e2e8f0;
        --surface: #f8fafc;
      }
      html, body { width: 100%; min-height: 100%; }
      body { margin: 0; background: #fff; color: var(--ink); font-family: ${fontFamily}; font-size: 11px; line-height: 1.5; }
      .document { position: relative; width: 100%; min-height: 100%; padding: 13mm 15mm 10mm; overflow: visible; }
      .document--minimal { padding-top: 14mm; }
      .document--minimal::after { position: absolute; top: 9mm; right: 14mm; width: 34px; height: 34px; border-radius: 999px; background: var(--accent); opacity: .12; content: ''; }
      .document--professional::before { position: absolute; inset: 0 auto 0 0; width: 4px; background: var(--primary); content: ''; }
      .document--enterprise { border-top: 7px solid var(--primary); }
      .document-header { display: grid; grid-template-columns: minmax(0, 1fr) minmax(235px, .72fr); align-items: start; gap: 34px; padding-bottom: 15px; border-bottom: 1px solid var(--border); }
      .document-header-centered { grid-template-columns: 1fr; text-align: center; }
      .document-header-band { padding: 20px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; }
      .header-left, .header-right, .party, .payment { min-width: 0; }
      .header-right { text-align: right; }
      .document-header-centered .header-right { text-align: center; }
      .logo { display: block; max-width: 120px; max-height: 52px; margin: 0 0 8px; object-fit: contain; }
      .document-header-centered .logo { margin-right: auto; margin-left: auto; }
      .business-name { margin: 0; font-size: 22px; font-weight: 750; line-height: 1.15; letter-spacing: -.02em; }
      .business-contact, .muted { margin: 3px 0 0; color: var(--muted); white-space: pre-line; overflow-wrap: anywhere; }
      .document-header-band .business-contact, .document-header-band .muted, .document-header-band .detail-label { color: rgba(255,255,255,.68); }
      .document-header-band .detail-value, .document-header-band .document-title, .document-header-band .document-number { color: #fff; }
      .eyebrow, .detail-label { margin: 0 0 4px; color: #64748b; font-size: 8.5px; font-weight: 750; line-height: 1.2; letter-spacing: .15em; text-transform: uppercase; }
      .document-title { margin: 0; color: var(--ink); font-size: 29px; font-weight: 800; letter-spacing: -.035em; line-height: 1.05; }
      .document-number { margin: 4px 0 0; color: var(--muted); font-size: 11px; font-weight: 650; }
      .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 18px; }
      .header-meta { margin-top: 13px; }
      .header-meta .detail { min-width: 0; }
      .detail-value { margin: 0; color: var(--ink); font-size: 10.5px; font-weight: 650; overflow-wrap: anywhere; white-space: pre-line; }
      .party-section { display: grid; grid-template-columns: minmax(0, 1fr) minmax(250px, .9fr); gap: 38px; margin: 15px 0 17px; padding: 12px 0 13px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
      .party-name { margin: 0; font-size: 13.5px; font-weight: 750; }
      .payment { text-align: right; }
      .payment-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 25px; text-align: right; }
      .payment .detail-value { font-weight: 650; }
      .type-block { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 0 0 17px; padding: 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); }
      .type-block-title { grid-column: 1 / -1; color: var(--muted); font-size: 8.5px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; }
      .type-block-minimal { border-radius: 0; border-right: 0; border-left: 0; background: transparent; }
      .type-block-enterprise { border-top: 2px solid var(--primary); }
      .items { margin-top: 2px; }
      table { width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0; page-break-inside: auto; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      col.description { width: 47%; }
      col.sku { width: 12%; }
      col.qty { width: 9%; }
      col.price { width: 15%; }
      col.adjustment { width: 8%; }
      col.amount { width: 17%; }
      th { padding: 7px 8px; border-bottom: 2px solid var(--primary); color: var(--muted); font-size: 8.5px; font-weight: 750; letter-spacing: .08em; text-align: left; text-transform: uppercase; overflow-wrap: anywhere; }
      td { padding: 9px 8px; border-bottom: 1px solid var(--border); vertical-align: top; overflow-wrap: anywhere; word-break: break-word; }
      th:first-child, td:first-child { padding-left: 0; }
      th:last-child, td:last-child { padding-right: 0; }
      .numeric { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .item-name { margin: 0; font-weight: 750; line-height: 1.3; }
      .item-description { margin: 3px 0 0; color: var(--muted); font-size: 9.5px; line-height: 1.35; white-space: pre-line; }
      .strong { font-weight: 750; }
      .totals { width: 100%; max-width: 310px; margin: 14px 0 0 auto; border-top: 1px solid var(--border); padding-top: 5px; page-break-inside: avoid; }
      .totals-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 20px; align-items: baseline; padding: 4px 0; color: var(--muted); }
      .totals-row span:last-child { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .totals-row.total { margin-top: 5px; padding: 9px 0 0; border-top: 1px solid var(--ink); color: var(--ink); font-size: 15px; font-weight: 800; }
      .document--professional .totals-row.total span:last-child { color: var(--primary); }
      .document--enterprise .totals-row.total { margin-top: 7px; padding: 10px 12px; border: 0; border-radius: 5px; background: var(--primary); color: #fff; }
      .document--enterprise .totals-row.total span:last-child { color: #fff; }
      .additional { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 17px; border-top: 1px solid var(--border); padding-top: 11px; }
      .additional-block { min-width: 0; }
      .additional-text { margin: 0; color: var(--ink); white-space: pre-line; overflow-wrap: anywhere; font-size: 9.5px; }
      .footer { display: flex; justify-content: space-between; gap: 20px; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 8px; color: var(--muted); font-size: 8.5px; page-break-inside: avoid; }
      .footer-detailed { align-items: flex-start; }
      .footer-bar { border: 0; border-radius: 4px; background: var(--accent); padding: 8px 10px; color: #fff; }
      .footer span:last-child { text-align: right; overflow-wrap: anywhere; }
      @media screen and (max-width: 680px) {
        .document { padding: 7mm; }
        .document-header, .party-section { grid-template-columns: 1fr; }
        .header-right, .payment, .payment .detail-grid { text-align: left; }
        .type-block, .additional { grid-template-columns: 1fr; }
        .type-block .detail:last-child:nth-child(2), .type-block .detail:last-child:nth-child(1) { grid-column: auto; }
        .footer { align-items: flex-start; flex-direction: column; }
        .footer span:last-child { text-align: left; }
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .document { width: 100%; max-width: none; }
        img, .totals, .footer { break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <main class="document document--${family}">
      <header class="${headerClass}">
        <div class="header-left">
          ${source.business.logo ? `<img class="logo" src="${escapeHtml(source.business.logo)}" alt="${escapeHtml(source.business.name || 'Business')} logo">` : ''}
          ${source.business.name ? `<p class="business-name">${escapeHtml(source.business.name)}</p>` : ''}
          ${source.business.contactPerson ? `<p class="business-contact">${textHtml(source.business.contactPerson)}</p>` : ''}
          ${source.business.address ? `<p class="business-contact">${textHtml(source.business.address)}</p>` : ''}
          ${source.business.email || source.business.phone || source.business.website ? `<p class="business-contact">${[source.business.email, source.business.phone, source.business.website].filter(Boolean).map((value) => textHtml(value)).join('<br>')}</p>` : ''}
          ${source.business.taxId ? `<p class="business-contact">Tax ID: ${escapeHtml(source.business.taxId)}</p>` : ''}
        </div>
        <div class="header-right">
          <p class="eyebrow">${escapeHtml(documentMeta.numberLabel)}</p>
          <h1 class="document-title">${escapeHtml(documentMeta.title)}</h1>
          ${source.details.number ? `<p class="document-number">${escapeHtml(source.details.number)}</p>` : ''}
          ${headerMeta}
        </div>
      </header>

      <section class="party-section">
        <div class="party">
          <p class="eyebrow">${escapeHtml(documentMeta.billToLabel)}</p>
          ${(source.client.name || source.client.companyName) ? `<p class="party-name">${escapeHtml(source.client.name || source.client.companyName)}</p>` : ''}
          ${source.client.companyName && source.client.name ? `<p class="muted">${escapeHtml(source.client.companyName)}</p>` : ''}
          ${source.client.billingAddress ? `<p class="muted">${textHtml(source.client.billingAddress)}</p>` : ''}
          ${source.client.email || source.client.phone ? `<p class="muted">${[source.client.email, source.client.phone].filter(Boolean).map((value) => textHtml(value)).join('<br>')}</p>` : ''}
        </div>
        <div class="payment">
          <p class="eyebrow">Payment</p>
          <div class="payment-grid">
            <div class="detail"><p class="detail-label">${escapeHtml(documentMeta.termsLabel)}</p><p class="detail-value">${textHtml(paymentMeta[0]?.value || '—')}</p></div>
            <div class="detail"><p class="detail-label">${escapeHtml(documentMeta.referenceLabel)}</p><p class="detail-value">${textHtml(paymentMeta[1]?.value || '—')}</p></div>
          </div>
        </div>
      </section>

      ${typeBlockHtml}

      <section class="items">
        <table aria-label="${escapeHtml(documentMeta.itemsLabel)}">
          <colgroup>${itemColumns}</colgroup>
          <thead><tr>${itemHeaders}</tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </section>

      <section class="totals">${totalsHtml}</section>
      ${additionalHtml}
      <footer class="${footerClass}">
        <span>Thank you for your business.</span>
        <span>${escapeHtml(presentation.footerLayout === 'Detailed' ? detailedFooter : businessContact || source.details.number || '')}</span>
      </footer>
    </main>
  </body>
</html>`

  return { html, fileName }
}

export function printInvoice(invoice: InvoiceData): boolean {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return false
  printWindow.document.write(buildPrintableInvoiceHTML(invoice).html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
  return true
}

export function downloadPDF(invoice: InvoiceData): void {
  printInvoice(invoice)
}
