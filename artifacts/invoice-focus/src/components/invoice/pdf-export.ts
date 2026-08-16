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

export function buildPrintableInvoiceHTML(invoice: InvoiceData): { html: string; fileName: string } {
  const model = buildDocumentRenderModel(invoice)
  const {
    documentMeta,
    invoice: source,
    totals,
    visibleItems,
    showAdjustments,
    showSku,
  } = model

  const fileName = generateInvoiceFileName(invoice)

  // Items Table Rows
  const itemsHtml = visibleItems.map(({ item, values }) => `
    <tr>
      <td class="col-desc">
        <div class="item-name">${escapeHtml(item.name || item.description)}</div>
        ${item.name && item.description ? `<div class="item-desc">${textHtml(item.description)}</div>` : ''}
      </td>
      ${showSku ? `<td class="col-sku">${textHtml(item.sku || '—')}</td>` : ''}
      <td class="col-qty text-right">${values.quantity}</td>
      <td class="col-price text-right">${escapeHtml(formatCurrency(values.unitPrice, model.currency))}</td>
      ${showAdjustments ? `
        <td class="col-tax text-right">${values.taxPercent > 0 ? `${values.taxPercent}%` : '—'}</td>
        <td class="col-disc text-right">${values.discountPercent > 0 ? `${values.discountPercent}%` : '—'}</td>
      ` : ''}
      <td class="col-amount text-right">${escapeHtml(formatCurrency(values.lineTotal, model.currency))}</td>
    </tr>
  `).join('')

  // Subtotal & Grand Total Rows
  const totalsHtml = totals.rows.map(row => `
    <div class="summary-line">
      <span class="summary-label">${escapeHtml(row.label)}</span>
      <span class="summary-value">${escapeHtml(row.value)}</span>
    </div>
  `).join('')

  const statusClass = (source.details.status || 'unpaid').toLowerCase()

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(source.details.number || 'Invoice')}</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #1e293b;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      .page-container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      }
      
      /* TOP BAR */
      .header-grid {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
      }
      .brand-title {
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 4px 0;
        text-transform: uppercase;
        letter-spacing: -0.02em;
      }
      .brand-sub {
        color: #64748b;
        font-size: 12px;
      }
      .doc-title {
        font-size: 28px;
        font-weight: 900;
        color: #0f172a;
        margin: 0;
        text-align: right;
        letter-spacing: -0.03em;
      }
      .doc-meta {
        text-align: right;
        margin-top: 6px;
        font-size: 12px;
        color: #475569;
      }
      .doc-meta strong { color: #0f172a; }

      /* ADDRESS SECTION */
      .address-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        padding: 24px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      .section-label {
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }
      .party-name {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 4px;
      }
      .party-details {
        color: #475569;
        font-size: 12px;
        line-height: 1.6;
      }

      /* META BAR */
      .meta-bar {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      .meta-item-label {
        font-size: 10px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .meta-item-value {
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
        margin-top: 2px;
      }
      .status-pill {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .status-paid { background: #dcfce7; color: #166534; }
      .status-unpaid { background: #fee2e2; color: #991b1b; }
      .status-pending { background: #fef3c7; color: #92400e; }

      /* ITEMS TABLE */
      .table-container { margin-top: 24px; }
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      th {
        padding: 10px 0;
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #e2e8f0;
      }
      td {
        padding: 14px 0;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: top;
      }
      .text-right { text-align: right; }
      .item-name { font-weight: 600; color: #0f172a; }
      .item-desc { font-size: 12px; color: #64748b; margin-top: 2px; }

      /* BOTTOM SECTION */
      .footer-grid {
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 40px;
        margin-top: 28px;
        padding-top: 12px;
      }
      .note-block { margin-bottom: 20px; }
      .note-block p { margin: 4px 0 0 0; color: #475569; font-size: 12px; }
      
      .summary-box {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .summary-line {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #475569;
      }
      .summary-total {
        display: flex;
        justify-content: space-between;
        font-size: 16px;
        font-weight: 800;
        color: #0f172a;
        padding-top: 12px;
        border-top: 2px solid #0f172a;
        margin-top: 4px;
      }

      /* SYSTEM FOOTER */
      .system-footer {
        margin-top: 60px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        color: #94a3b8;
        font-size: 11px;
      }

      @media print {
        .page-container { width: 100%; max-width: none; padding: 0; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="page-container">
      
      <!-- TOP HEADER -->
      <div class="header-grid">
        <div>
          ${source.business.logo ? `<img src="${escapeHtml(source.business.logo)}" style="max-height: 48px; margin-bottom: 8px;" alt="Logo"><br>` : ''}
          <div class="brand-title">${escapeHtml(source.business.name || 'Business Name')}</div>
          <div class="brand-sub">${escapeHtml(source.business.website || source.business.email || '')}</div>
        </div>
        <div>
          <h1 class="doc-title">${escapeHtml(documentMeta.title)}</h1>
          <div class="doc-meta">#<strong>${escapeHtml(source.details.number || '000001')}</strong></div>
          <div class="doc-meta">Date: <strong>${escapeHtml(source.details.issueDate || '')}</strong></div>
          <div class="doc-meta">Due: <strong>${escapeHtml(source.details.dueDate || '')}</strong></div>
        </div>
      </div>

      <!-- ADDRESSES -->
      <div class="address-grid">
        <div>
          <div class="section-label">From</div>
          <div class="party-name">${escapeHtml(source.business.name || 'Business Name')}</div>
          <div class="party-details">
            ${businessAddress ? `${businessAddress}<br>` : ''}
            ${source.business.email ? `${escapeHtml(source.business.email)}<br>` : ''}
            ${source.business.phone ? `${escapeHtml(source.business.phone)}` : ''}
          </div>
        </div>
        <div>
          <div class="section-label">Bill To</div>
          <div class="party-name">${escapeHtml(source.client.name || source.client.companyName || 'Client Name')}</div>
          <div class="party-details">
            ${clientAddress ? `${clientAddress}<br>` : ''}
            ${source.client.email ? `${escapeHtml(source.client.email)}<br>` : ''}
            ${source.client.phone ? `${escapeHtml(source.client.phone)}` : ''}
          </div>
        </div>
      </div>

      <!-- PAYMENT & REFERENCE -->
      <div class="meta-bar">
        <div>
          <div class="meta-item-label">Payment Terms</div>
          <div class="meta-item-value">${escapeHtml(source.details.paymentTerms || 'Due on receipt')}</div>
        </div>
        <div>
          <div class="meta-item-label">PO / Reference</div>
          <div class="meta-item-value">${escapeHtml(source.details.reference || '—')}</div>
        </div>
        <div>
          <div class="meta-item-label">Currency</div>
          <div class="meta-item-value">${escapeHtml(model.currency.toUpperCase())}</div>
        </div>
        <div>
          <div class="meta-item-label">Status</div>
          <div class="meta-item-value">
            <span class="status-pill status-${statusClass}">${escapeHtml(source.details.status || 'Unpaid')}</span>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              ${showSku ? '<th>SKU</th>' : ''}
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              ${showAdjustments ? '<th class="text-right">Tax</th><th class="text-right">Disc</th>' : ''}
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- FOOTER / SUMMARY -->
      <div class="footer-grid">
        <div>
          <div class="note-block">
            <div class="section-label">Notes</div>
            <p>${textHtml(source.details.notes || 'Thank you for your business.')}</p>
          </div>
          ${source.details.terms ? `
            <div class="note-block">
              <div class="section-label">Terms & Payment Information</div>
              <p>${textHtml(source.details.terms)}</p>
            </div>
          ` : ''}
        </div>
        <div>
          <div class="summary-box">
            ${totalsHtml}
            <div class="summary-total">
              <span>${escapeHtml(totals.total.label)}</span>
              <span>${escapeHtml(totals.total.value)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- BOTTOM BRANDING -->
      <div class="system-footer">
        <span>Thank you for your business.</span>
        <span>${escapeHtml(source.business.name || 'InvoiceFocus')}</span>
      </div>

    </div>
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
