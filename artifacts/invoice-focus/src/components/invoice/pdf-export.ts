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
  const paymentSection = paymentMeta.length
    ? paymentDetails
    : `<div class="empty-detail"><span>Payment Terms</span><strong>—</strong></div><div class="empty-detail"><span>Reference</span><strong>—</strong></div>`

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
    ...(showSku ? [`<td class="muted-cell">${textHtml(item.sku || '—')}</td>`] : []),
    `<td class="numeric">${values.quantity}</td>`,
    `<td class="numeric">${escapeHtml(formatCurrency(values.unitPrice, model.currency))}</td>`,
    ...(showAdjustments ? [
      `<td class="numeric muted-cell">${values.taxPercent > 0 ? `${values.taxPercent}%` : '—'}</td>`,
      `<td class="numeric muted-cell">${values.discountPercent > 0 ? `${values.discountPercent}%` : '—'}</td>`,
    ] : []),
    `<td class="numeric strong">${escapeHtml(formatCurrency(values.lineTotal, model.currency))}</td>`,
  ].join('')}</tr>`).join('')

  const totalsHtml = [
    ...totals.rows.map((row) => `<div class="totals-row"><span>${escapeHtml(row.label)}</span><span>${escapeHtml(row.value)}</span></div>`),
    `<div class="totals-row total"><span>${escapeHtml(totals.total.label)}</span><span>${escapeHtml(totals.total.value)}</span></div>`,
  ].join('')

  const typeBlockHtml = typeBlock
    ? `<section class="type-block type-block-${family}"><div class="type-block-title">${escapeHtml(typeBlock.title)}</div>${typeBlock.items.map((item) => `<div class="detail"><p class="detail-label">${escapeHtml(item.label)}</p><p class="detail-value">${textHtml(item.value)}</p></div>`).join('')}</section>`
    : ''

  const additionalHtml = model.additional.length
    ? `<section class="additional"><div class="additional-heading">Additional Information</div>${model.additional.map((item) => `<div class="additional-block"><p class="detail-label">${escapeHtml(item.label)}</p><p class="additional-text">${textHtml(item.value)}</p></div>`).join('')}</section>`
    : `<section class="additional additional-empty"><div class="additional-block"><p class="detail-label">Notes</p><p class="additional-text">Thank you for your business.</p></div></section>`

  const detailedFooter = [source.business.email, source.business.phone, source.business.website].filter(Boolean).join(' · ')
  const footerClass = `footer footer-${presentation.footerLayout.toLowerCase()}`
  const headerClass = `document-header ${model.centered ? 'document-header-centered' : ''} ${model.band ? 'document-header-band' : ''}`
  const businessAddress = source.business.address ? textHtml(source.business.address) : ''
  const clientAddress = source.client.billingAddress ? textHtml(source.client.billingAddress) : ''
  const clientContact = [source.client.email, source.client.phone].filter(Boolean).map((value) => textHtml(value)).join('<br>')

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
        --ink: #111827;
        --muted: #667085;
        --soft: #98a2b3;
        --border: #e4e7ec;
        --surface: #f8fafc;
        --surface-strong: #f2f4f7;
      }
      html, body { width: 100%; min-height: 100%; }
      body {
        margin: 0;
        background: #fff;
        color: var(--ink);
        font-family: ${fontFamily};
        font-size: 10.5px;
        line-height: 1.45;
        -webkit-font-smoothing: antialiased;
      }
      .document {
        position: relative;
        width: 100%;
        min-height: 100%;
        padding: 14mm 15mm 11mm;
        overflow: visible;
      }
      .document--minimal { padding-top: 16mm; }
      .document--minimal::after {
        position: absolute;
        top: 10mm;
        right: 14mm;
        width: 34px;
        height: 34px;
        border: 1px solid var(--accent);
        border-radius: 50%;
        opacity: .16;
        content: '';
      }
      .document--professional::before {
        position: absolute;
        inset: 0 auto 0 0;
        width: 4px;
        background: var(--primary);
        content: '';
      }
      .document--enterprise {
        border-top: 7px solid var(--primary);
        padding-top: 12mm;
      }

      /* HEADER */
      .document-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 245px;
        align-items: start;
        gap: 28px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
      }
      .document-header-centered {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .document-header-band {
        padding: 20px;
        border: 0;
        border-radius: 9px;
        background: var(--primary);
        color: #fff;
      }
      .header-left, .header-right, .party, .payment { min-width: 0; }
      .header-right { text-align: right; }
      .document-header-centered .header-right { text-align: center; }
      .logo {
        display: block;
        max-width: 165px;
        max-height: 54px;
        margin: 0 0 9px;
        object-fit: contain;
        object-position: left center;
      }
      .document-header-centered .logo { margin-right: auto; margin-left: auto; object-position: center; }
      .business-name {
        margin: 0;
        font-size: 19px;
        font-weight: 750;
        line-height: 1.15;
        letter-spacing: -.025em;
      }
      .business-contact {
        margin: 3px 0 0;
        color: var(--muted);
        white-space: pre-line;
        overflow-wrap: anywhere;
      }
      .document-header-band .business-contact,
      .document-header-band .muted,
      .document-header-band .detail-label { color: rgba(255,255,255,.7); }
      .document-header-band .detail-value,
      .document-header-band .document-title,
      .document-header-band .document-number { color: #fff; }
      .eyebrow, .detail-label {
        margin: 0 0 4px;
        color: var(--muted);
        font-size: 8px;
        font-weight: 750;
        line-height: 1.2;
        letter-spacing: .13em;
        text-transform: uppercase;
      }
      .document-title {
        margin: 0;
        color: var(--ink);
        font-size: ${presentation.titleStyle === 'compact' ? '23px' : '28px'};
        font-weight: 750;
        letter-spacing: -.035em;
        line-height: 1.05;
      }
      .document-number {
        margin: 5px 0 0;
        color: var(--muted);
        font-size: 11px;
        font-weight: 650;
      }
      .header-meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px 18px;
        margin-top: 14px;
      }
      .header-meta .detail { min-width: 0; }
      .header-meta .detail-label { margin-bottom: 3px; }
      .detail-value {
        margin: 0;
        color: var(--ink);
        font-size: 10px;
        font-weight: 650;
        overflow-wrap: anywhere;
        white-space: pre-line;
      }

      /* BILLING / PAYMENT */
      .party-section {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
        gap: 30px;
        margin: 18px 0 22px;
        padding: 15px 0;
        border-bottom: 1px solid var(--border);
      }
      .party-section.party-only { grid-template-columns: 1fr 1fr; }
      .party-name {
        margin: 0 0 2px;
        font-size: 13px;
        font-weight: 750;
        line-height: 1.25;
      }
      .muted {
        margin: 3px 0 0;
        color: var(--muted);
        white-space: pre-line;
        overflow-wrap: anywhere;
      }
      .payment {
        padding-left: 24px;
        border-left: 1px solid var(--border);
      }
      .payment .detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }
      .payment .detail-value { font-weight: 650; }
      .empty-detail {
        display: flex;
        justify-content: space-between;
        gap: 15px;
        padding: 5px 0;
        border-bottom: 1px solid #f0f2f5;
        color: var(--muted);
      }
      .empty-detail strong { color: var(--ink); font-weight: 650; }

      /* DOCUMENT-SPECIFIC BLOCK */
      .type-block {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px 20px;
        margin: 0 0 21px;
        padding: 13px 14px;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--surface);
      }
      .type-block-title {
        grid-column: 1 / -1;
        color: var(--muted);
        font-size: 8px;
        font-weight: 750;
        letter-spacing: .13em;
        text-transform: uppercase;
      }
      .type-block-minimal { border-radius: 0; border-right: 0; border-left: 0; background: transparent; }
      .type-block-enterprise { border-top: 2px solid var(--primary); }

      /* ITEMS */
      .items { margin-top: 3px; }
      table { width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0; page-break-inside: auto; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      col.description { width: 45%; }
      col.sku { width: 12%; }
      col.qty { width: 8%; }
      col.price { width: 15%; }
      col.adjustment { width: 9%; }
      col.amount { width: 14%; }
      th {
        padding: 8px 8px 7px;
        border-top: 1px solid var(--border);
        border-bottom: 2px solid var(--primary);
        color: var(--muted);
        font-size: 8px;
        font-weight: 750;
        letter-spacing: .09em;
        text-align: left;
        text-transform: uppercase;
        overflow-wrap: anywhere;
      }
      td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      th:first-child, td:first-child { padding-left: 0; }
      th:last-child, td:last-child { padding-right: 0; }
      .numeric { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .item-name { margin: 0; font-weight: 700; line-height: 1.3; }
      .item-description { margin: 3px 0 0; color: var(--muted); font-size: 9px; line-height: 1.35; white-space: pre-line; }
      .muted-cell { color: var(--muted); }
      .strong { font-weight: 750; }

      /* TOTALS */
      .summary-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 315px;
        gap: 32px;
        align-items: start;
        margin-top: 17px;
      }
      .summary-note {
        color: var(--muted);
        font-size: 9px;
        line-height: 1.5;
      }
      .summary-note strong { color: var(--ink); }
      .totals {
        width: 100%;
        margin: 0;
        padding-top: 2px;
        page-break-inside: avoid;
      }
      .totals-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 20px;
        align-items: baseline;
        padding: 5px 0;
        color: var(--muted);
      }
      .totals-row span:last-child { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .totals-row.total {
        margin-top: 7px;
        padding: 12px 0 0;
        border-top: 1.5px solid var(--ink);
        color: var(--ink);
        font-size: 16px;
        font-weight: 750;
      }
      .document--professional .totals-row.total {
        padding: 12px 14px;
        border: 0;
        border-radius: 6px;
        background: var(--primary);
        color: #fff;
      }
      .document--enterprise .totals-row.total {
        padding: 13px 14px;
        border: 0;
        border-radius: 6px;
        background: var(--ink);
        color: #fff;
      }

      /* ADDITIONAL INFORMATION */
      .additional {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 18px 24px;
        margin-top: 24px;
        border-top: 1px solid var(--border);
        padding-top: 14px;
      }
      .additional-heading {
        grid-column: 1 / -1;
        color: var(--muted);
        font-size: 8px;
        font-weight: 750;
        letter-spacing: .13em;
        text-transform: uppercase;
      }
      .additional-text {
        margin: 0;
        color: var(--ink);
        font-size: 9px;
        white-space: pre-line;
        overflow-wrap: anywhere;
      }
      .additional-empty { grid-template-columns: 1fr; }
      .additional-empty .additional-block { grid-column: 1; }

      /* FOOTER */
      .footer {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        margin-top: 20px;
        border-top: 1px solid var(--border);
        padding-top: 9px;
        color: var(--muted);
        font-size: 8.5px;
        page-break-inside: avoid;
      }
      .footer-detailed { align-items: flex-start; }
      .footer-bar {
        border: 0;
        border-radius: 5px;
        background: var(--accent);
        padding: 9px 12px;
        color: #fff;
      }
      .footer span:last-child { text-align: right; overflow-wrap: anywhere; }

      @media screen and (max-width: 680px) {
        .document { padding: 7mm; }
        .document-header, .party-section, .summary-row { grid-template-columns: 1fr; }
        .header-right, .payment, .payment .detail-grid { text-align: left; }
        .payment { padding-left: 0; border-left: 0; border-top: 1px solid var(--border); padding-top: 14px; }
        .type-block, .additional { grid-template-columns: 1fr; }
        .type-block-title, .additional-heading { grid-column: auto; }
        .footer { align-items: flex-start; flex-direction: column; }
        .footer span:last-child { text-align: left; }
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .document { width: 100%; max-width: none; }
        img, .totals, .footer, .summary-row { break-inside: avoid; }
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
          ${businessAddress ? `<p class="business-contact">${businessAddress}</p>` : ''}
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
          ${(source.client.name || source.client.companyName) ? `<p class="party-name">${escapeHtml(source.client.name || source.client.companyName)}</p>` : '<p class="party-name">—</p>'}
          ${source.client.companyName && source.client.name ? `<p class="muted">${escapeHtml(source.client.companyName)}</p>` : ''}
          ${clientAddress ? `<p class="muted">${clientAddress}</p>` : ''}
          ${clientContact ? `<p class="muted">${clientContact}</p>` : ''}
        </div>
        <div class="payment">
          <p class="eyebrow">Payment / Reference</p>
          ${paymentSection}
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

      <section class="summary-row">
        <div class="summary-note">
          <strong>${escapeHtml(documentMeta.description)}</strong>
          ${source.details.status ? `<br>Status: ${escapeHtml(source.details.status)}` : ''}
        </div>
        <section class="totals">${totalsHtml}</section>
      </section>

      ${additionalHtml}

      <footer class="${footerClass}">
        <span>Thank you for your business.</span>
        <span>${escapeHtml(presentation.footerLayout === 'Detailed' ? detailedFooter : source.business.name || source.details.number || '')}</span>
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
