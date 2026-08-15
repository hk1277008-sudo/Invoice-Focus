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
  const totalsHtml = [
    ...totals.rows.map((row) => `<div class="totals-row"><span>${escapeHtml(row.label)}</span><span>${escapeHtml(row.value)}</span></div>`),
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
        --ink: #111827;
        --muted: #6b7280;
        --soft: #f8fafc;
        --line: #e5e7eb;
        --line-strong: #d1d5db;
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
        padding: 15mm 16mm 12mm;
        background: #fff;
        overflow: visible;
      }
      .document--minimal { padding-top: 17mm; }
      .document--professional { border-left: 3px solid var(--primary); }
      .document--enterprise { padding-top: 13mm; border-top: 6px solid var(--primary); }

      /* Premium header: business identity on the left, document identity on the right. */
      .document-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(230px, .72fr);
        align-items: start;
        gap: 30px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--line);
      }
      .document-header-centered {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .document-header-band {
        margin: -3mm -2mm 0;
        padding: 18px 20px;
        border: 0;
        border-radius: 8px;
        background: var(--primary);
        color: #fff;
      }
      .header-left, .header-right, .party, .payment { min-width: 0; }
      .header-right { text-align: right; }
      .document-header-centered .header-right { text-align: center; }
      .logo {
        display: block;
        max-width: 155px;
        max-height: 52px;
        margin: 0 0 10px;
        object-fit: contain;
      }
      .document-header-centered .logo { margin-right: auto; margin-left: auto; }
      .business-name {
        margin: 0;
        font-size: 19px;
        font-weight: 750;
        letter-spacing: -.02em;
        line-height: 1.18;
      }
      .business-contact {
        margin: 3px 0 0;
        color: var(--muted);
        white-space: pre-line;
        overflow-wrap: anywhere;
      }
      .document-header-band .business-contact,
      .document-header-band .muted,
      .document-header-band .detail-label { color: rgba(255,255,255,.72); }
      .document-header-band .detail-value,
      .document-header-band .document-title,
      .document-header-band .document-number { color: #fff; }
      .eyebrow, .detail-label {
        margin: 0 0 5px;
        color: #6b7280;
        font-size: 8.5px;
        font-weight: 750;
        line-height: 1.2;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      .document-title {
        margin: 0;
        color: var(--ink);
        font-size: ${presentation.titleStyle === 'compact' ? '23px' : '29px'};
        font-weight: 800;
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
        margin-top: 14px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 11px 18px;
      }
      .header-meta .detail { min-width: 0; }
      .header-meta .detail-value { font-size: 10px; }
      .detail-value {
        margin: 0;
        color: var(--ink);
        font-size: 10.5px;
        font-weight: 650;
        overflow-wrap: anywhere;
        white-space: pre-line;
      }

      /* Bill-to/payment strip mirrors the compact SaaS invoice structure. */
      .party-section {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(230px, .72fr);
        gap: 30px;
        margin: 18px 0 20px;
        padding: 14px 0 15px;
        border-bottom: 1px solid var(--line);
      }
      .party-section.party-only { grid-template-columns: 1fr; }
      .party-name { margin: 0; font-size: 12.5px; font-weight: 750; line-height: 1.3; }
      .muted {
        margin: 3px 0 0;
        color: var(--muted);
        white-space: pre-line;
        overflow-wrap: anywhere;
      }
      .payment { text-align: right; }
      .payment .detail-grid { text-align: right; }
      .payment .detail-value { font-weight: 650; }

      .type-block {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px 20px;
        margin: 0 0 19px;
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--soft);
      }
      .type-block-title {
        grid-column: 1 / -1;
        color: var(--muted);
        font-size: 8.5px;
        font-weight: 750;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      .type-block-minimal { border-right: 0; border-left: 0; border-radius: 0; background: transparent; }
      .type-block-enterprise { border-top: 2px solid var(--primary); }
      .type-block .detail:last-child:nth-child(2) { grid-column: span 2; }
      .type-block .detail:last-child:nth-child(1) { grid-column: 1 / -1; }

      /* Item table: quiet rules, strong hierarchy, no boxed spreadsheet look. */
      .items { margin-top: 3px; }
      table {
        width: 100%;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 0;
        page-break-inside: auto;
      }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      col.description { width: 43%; }
      col.sku { width: 14%; }
      col.qty { width: 9%; }
      col.price { width: 15%; }
      col.adjustment { width: 9%; }
      col.amount { width: 14%; }
      th {
        padding: 8px 7px;
        border-top: 1px solid var(--line-strong);
        border-bottom: 1.5px solid var(--ink);
        color: #4b5563;
        font-size: 8.5px;
        font-weight: 750;
        letter-spacing: .09em;
        text-align: left;
        text-transform: uppercase;
        overflow-wrap: anywhere;
      }
      td {
        padding: 9px 7px;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      th:first-child, td:first-child { padding-left: 0; }
      th:last-child, td:last-child { padding-right: 0; }
      .numeric { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .item-name { margin: 0; font-weight: 700; line-height: 1.3; }
      .item-description { margin: 3px 0 0; color: var(--muted); font-size: 9.5px; line-height: 1.35; white-space: pre-line; }
      .strong { font-weight: 750; }

      /* One, and only one, final totals block. */
      .totals {
        width: 100%;
        max-width: 300px;
        margin: 17px 0 0 auto;
        padding-top: 4px;
        page-break-inside: avoid;
      }
      .totals-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 22px;
        align-items: baseline;
        padding: 4px 0;
        color: var(--muted);
      }
      .totals-row span:last-child {
        text-align: right;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .totals-row.total {
        margin-top: 7px;
        padding: 10px 0 0;
        border-top: 1.5px solid var(--ink);
        color: var(--ink);
        font-size: 14px;
        font-weight: 800;
      }
      .document--professional .totals-row.total span:last-child { color: var(--primary); }
      .document--enterprise .totals-row.total {
        margin-top: 8px;
        padding: 11px 12px;
        border: 0;
        border-radius: 5px;
        background: var(--primary);
        color: #fff;
      }
      .document--enterprise .totals-row.total span:last-child { color: #fff; }

      /* Notes / terms / payment information: compact lower information area. */
      .additional {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 22px;
        margin-top: 23px;
        padding-top: 14px;
        border-top: 1px solid var(--line);
      }
      .additional-block { min-width: 0; }
      .additional-text {
        margin: 0;
        color: var(--ink);
        white-space: pre-line;
        overflow-wrap: anywhere;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        margin-top: 22px;
        border-top: 1px solid var(--line);
        padding-top: 9px;
        color: var(--muted);
        font-size: 8.5px;
        page-break-inside: avoid;
      }
      .footer span:last-child { max-width: 62%; text-align: right; overflow-wrap: anywhere; }
      .footer-bar {
        margin-right: -1mm;
        margin-left: -1mm;
        padding: 9px 11px;
        border: 0;
        border-radius: 4px;
        background: var(--accent);
        color: #fff;
      }
      .footer-bar span:last-child { color: #fff; }

      @media screen and (max-width: 680px) {
        .document { padding: 7mm; }
        .document-header, .party-section { grid-template-columns: 1fr; gap: 18px; }
        .header-right, .payment, .payment .detail-grid { text-align: left; }
        .header-meta { grid-template-columns: 1fr 1fr; }
        .type-block, .additional { grid-template-columns: 1fr; }
        .type-block .detail:last-child:nth-child(2), .type-block .detail:last-child:nth-child(1) { grid-column: auto; }
        .footer { flex-direction: column; }
        .footer span:last-child { max-width: none; text-align: left; }
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .document { width: 100%; max-width: none; }
        img, .totals, .footer, .type-block { break-inside: avoid; }
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

      <section class="party-section ${paymentMeta.length ? '' : 'party-only'}">
        <div class="party">
          <p class="eyebrow">${escapeHtml(documentMeta.billToLabel)}</p>
          ${(source.client.name || source.client.companyName) ? `<p class="party-name">${escapeHtml(source.client.name || source.client.companyName)}</p>` : ''}
          ${source.client.companyName && source.client.name ? `<p class="muted">${escapeHtml(source.client.companyName)}</p>` : ''}
          ${source.client.billingAddress ? `<p class="muted">${textHtml(source.client.billingAddress)}</p>` : ''}
          ${source.client.email || source.client.phone ? `<p class="muted">${[source.client.email, source.client.phone].filter(Boolean).map((value) => textHtml(value)).join('<br>')}</p>` : ''}
        </div>
        ${paymentMeta.length ? `<div class="payment"><p class="eyebrow">Payment / Reference</p>${paymentDetails}</div>` : ''}
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
