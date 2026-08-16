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

  const statusBadge = source.details.status 
    ? `<span class="status-badge status-${source.details.status.toLowerCase()}">${escapeHtml(source.details.status.toUpperCase())}</span>`
    : ''

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(source.details.number || documentMeta.title)}</title>
    <style>
      @page { size: ${presentation.paperSize} portrait; margin: 0; }
      * { box-sizing: border-box; }
      :root {
        --primary: ${presentation.primaryColor || '#2563eb'};
        --accent: ${presentation.accentColor || '#3b82f6'};
        --ink: #0f172a;
        --muted: #64748b;
        --soft: #94a3b8;
        --border: #e2e8f0;
        --surface: #f8fafc;
        --surface-strong: #f1f5f9;
      }
      html, body { width: 100%; min-height: 100%; }
      body {
        margin: 0;
        background: #ffffff;
        color: var(--ink);
        font-family: ${fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 10px;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      .document {
        position: relative;
        width: 100%;
        min-height: 100%;
        padding: 16mm 18mm 14mm;
        overflow: visible;
      }

      /* PREMIUM HEADER */
      .document-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 260px;
        align-items: start;
        gap: 32px;
        padding-bottom: 20px;
        border-bottom: 1.5px solid var(--border);
      }
      .document-header-centered {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .document-header-band {
        padding: 24px;
        border: 0;
        border-radius: 8px;
        background: var(--primary);
        color: #ffffff;
      }
      .header-left, .header-right, .party, .payment { min-width: 0; }
      .header-right { text-align: right; }
      .document-header-centered .header-right { text-align: center; }
      .logo {
        display: block;
        max-width: 170px;
        max-height: 56px;
        margin: 0 0 10px;
        object-fit: contain;
        object-position: left center;
      }
      .document-header-centered .logo { margin-right: auto; margin-left: auto; object-position: center; }
      .business-name {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        line-height: 1.2;
        letter-spacing: -0.02em;
        color: var(--ink);
      }
      .business-contact {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 9.5px;
        white-space: pre-line;
      }
      .document-header-band .business-contact,
      .document-header-band .detail-label { color: rgba(255,255,255,0.75); }
      .document-header-band .business-name,
      .document-header-band .detail-value,
      .document-header-band .document-title,
      .document-header-band .document-number { color: #ffffff; }
      
      .eyebrow, .detail-label {
        margin: 0 0 3px;
        color: var(--muted);
        font-size: 8px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .document-title {
        margin: 0;
        color: var(--ink);
        font-size: ${presentation.titleStyle === 'compact' ? '24px' : '30px'};
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1;
      }
      .document-number {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 11px;
        font-weight: 600;
      }
      .header-meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px 16px;
        margin-top: 16px;
      }
      .header-meta .detail-value {
        margin: 0;
        color: var(--ink);
        font-size: 10px;
        font-weight: 700;
      }

      /* STATUS BADGE */
      .status-badge {
        display: inline-block;
        padding: 3px 8px;
        margin-top: 8px;
        border-radius: 4px;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.05em;
        background: var(--surface-strong);
        color: var(--ink);
      }
      .status-paid { background: #dcfce7; color: #15803d; }
      .status-pending { background: #fef3c7; color: #b45309; }
      .status-overdue { background: #fee2e2; color: #b91c1c; }

      /* BILLING & PAYMENT SECTION */
      .party-section {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
        gap: 28px;
        margin: 20px 0;
        padding: 16px;
        border-radius: 8px;
        background: var(--surface);
        border: 1px solid var(--border);
      }
      .party-name {
        margin: 0 0 3px;
        font-size: 12.5px;
        font-weight: 700;
        color: var(--ink);
      }
      .muted {
        margin: 2px 0 0;
        color: var(--muted);
        font-size: 9.5px;
      }
      .payment {
        padding-left: 20px;
        border-left: 1px solid var(--border);
      }
      .payment .detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; }

      /* TABLE STYLING */
      .items { margin-top: 24px; }
      table { width: 100%; border-collapse: collapse; }
      th {
        padding: 10px 12px;
        background: var(--surface-strong);
        color: var(--muted);
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-align: left;
        text-transform: uppercase;
        border-bottom: 1px solid var(--border);
      }
      td {
        padding: 12px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }
      .numeric { text-align: right; font-variant-numeric: tabular-nums; }
      .item-name { margin: 0; font-weight: 700; font-size: 10.5px; color: var(--ink); }
      .item-description { margin: 3px 0 0; color: var(--muted); font-size: 9px; }

      /* TOTALS */
      .summary-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 280px;
        gap: 32px;
        align-items: start;
        margin-top: 20px;
      }
      .totals { width: 100%; }
      .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        color: var(--muted);
        font-size: 10px;
      }
      .totals-row.total {
        margin-top: 8px;
        padding: 12px 14px;
        border-radius: 6px;
        background: var(--primary);
        color: #ffffff;
        font-size: 14px;
        font-weight: 800;
      }

      /* FOOTER */
      .footer {
        display: flex;
        justify-content: space-between;
        margin-top: 32px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
        color: var(--soft);
        font-size: 8.5px;
      }

      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <main class="document document--${family}">
      <header class="${headerClass}">
        <div class="header-left">
          ${source.business.logo ? `<img class="logo" src="${escapeHtml(source.business.logo)}" alt="Logo">` : ''}
          ${source.business.name ? `<p class="business-name">${escapeHtml(source.business.name)}</p>` : ''}
          ${source.business.contactPerson ? `<p class="business-contact">${textHtml(source.business.contactPerson)}</p>` : ''}
          ${businessAddress ? `<p class="business-contact">${businessAddress}</p>` : ''}
          ${source.business.email || source.business.phone || source.business.website ? `<p class="business-contact">${[source.business.email, source.business.phone, source.business.website].filter(Boolean).map((v) => textHtml(v)).join('<br>')}</p>` : ''}
        </div>
        <div class="header-right">
          <p class="eyebrow">${escapeHtml(documentMeta.numberLabel)}</p>
          <h1 class="document-title">${escapeHtml(documentMeta.title)}</h1>
          ${source.details.number ? `<p class="document-number">#${escapeHtml(source.details.number)}</p>` : ''}
          ${statusBadge}
          ${headerMeta}
        </div>
      </header>

      <section class="party-section">
        <div class="party">
          <p class="eyebrow">${escapeHtml(documentMeta.billToLabel)}</p>
          <p class="party-name">${escapeHtml(source.client.name || source.client.companyName || '—')}</p>
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
        <table>
          <colgroup>${itemColumns}</colgroup>
          <thead><tr>${itemHeaders}</tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </section>

      <section class="summary-row">
        <div class="summary-note">
          <p class="eyebrow">Note</p>
          <p class="muted">${escapeHtml(documentMeta.description)}</p>
        </div>
        <section class="totals">${totalsHtml}</section>
      </section>

      ${additionalHtml}

      <footer class="${footerClass}">
        <span>Thank you for your business.</span>
        <span>${escapeHtml(presentation.footerLayout === 'Detailed' ? detailedFooter : source.business.name || '')}</span>
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
