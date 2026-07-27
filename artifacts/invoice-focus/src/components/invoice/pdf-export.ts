import type { InvoiceData, InvoiceCalculations, Currency } from './types'
import { formatCurrency } from './currencies'
import { calculateInvoiceTotals } from './utils'
import { getCurrencyByCode } from './currencies'

export function generateInvoiceFileName(invoice: InvoiceData): string {
  const number = invoice.details.number?.trim() || 'invoice'
  return `${number.replace(/\s+/g, '_').toLowerCase()}.pdf`
}

export function buildPrintableInvoiceHTML(
  invoice: InvoiceData,
): { html: string; fileName: string } {
  const currency = getCurrencyByCode(invoice.details.currency)
  const calculations = calculateInvoiceTotals(invoice.items)
  const fileName = generateInvoiceFileName(invoice)

  const itemsHTML = invoice.items
    .filter((item) => item.name.trim() || Number(item.quantity) > 0 || Number(item.unitPrice) > 0)
    .map((item) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      const tax = Number(item.taxPercent) || 0
      const discount = Number(item.discountPercent) || 0
      const base = qty * price
      const discountAmount = base * (discount / 100)
      const taxable = base - discountAmount
      const taxAmount = taxable * (tax / 100)
      const lineTotal = taxable + taxAmount
      return `
        <tr>
          <td>
            <div class="item-name">${escapeHtml(item.name || 'Item')}</div>
            ${item.description ? `<div class="item-description">${escapeHtml(item.description)}</div>` : ''}
          </td>
          <td class="num">${qty}</td>
          <td class="num">${formatCurrency(price, currency)}</td>
          <td class="num">${tax > 0 ? tax + '%' : '—'}</td>
          <td class="num">${discount > 0 ? discount + '%' : '—'}</td>
          <td class="num">${formatCurrency(lineTotal, currency)}</td>
        </tr>
      `
    })
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(invoice.details.number || 'Invoice')}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 0; line-height: 1.5; font-size: 13px; }
    .invoice { max-width: 210mm; margin: 0 auto; padding: 8mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 32px; }
    .header-left { flex: 1; }
    .header-right { text-align: right; }
    .logo { max-height: 56px; max-width: 160px; object-fit: contain; margin-bottom: 8px; }
    .business-name { font-size: 20px; font-weight: 700; margin: 0; }
    .meta-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .meta-value { font-size: 13px; color: #111827; margin: 0; }
    .muted { color: #6b7280; margin: 0; }
    .columns { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
    .column { flex: 1; }
    .column-right { text-align: right; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .status { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 600; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 8px 4px; }
    td { padding: 10px 4px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    th.num, td.num { text-align: right; }
    .item-name { font-weight: 600; color: #111827; }
    .item-description { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .totals { margin-left: auto; width: 100%; max-width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; color: #6b7280; }
    .totals-row.total { border-top: 1px solid #e5e7eb; margin-top: 6px; padding-top: 8px; font-weight: 700; color: #111827; font-size: 15px; }
    .additional { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
    .additional-block { margin-bottom: 16px; }
    .additional-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .additional-text { white-space: pre-line; margin: 0; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="header-left">
        ${invoice.business.logo ? `<img class="logo" src="${invoice.business.logo}" alt="Business logo">` : ''}
        <p class="business-name">${escapeHtml(invoice.business.name || 'Business Name')}</p>
        ${invoice.business.contactPerson ? `<p class="muted">${escapeHtml(invoice.business.contactPerson)}</p>` : ''}
        ${invoice.business.address ? `<p class="muted">${escapeHtml(invoice.business.address).replace(/\n/g, '<br>')}</p>` : ''}
        <div style="margin-top: 6px;">
          ${invoice.business.email ? `<p class="muted">${escapeHtml(invoice.business.email)}</p>` : ''}
          ${invoice.business.phone ? `<p class="muted">${escapeHtml(invoice.business.phone)}</p>` : ''}
          ${invoice.business.website ? `<p class="muted">${escapeHtml(invoice.business.website)}</p>` : ''}
        </div>
        ${invoice.business.taxId ? `<p class="muted" style="margin-top: 8px;">Tax ID: ${escapeHtml(invoice.business.taxId)}</p>` : ''}
      </div>
      <div class="header-right">
        <p class="business-name" style="font-size: 24px;">INVOICE</p>
        ${invoice.details.number ? `<p class="meta-value">${escapeHtml(invoice.details.number)}</p>` : ''}
        ${invoice.details.status ? `<span class="status">${escapeHtml(invoice.details.status)}</span>` : ''}
      </div>
    </div>

    <div class="columns">
      <div class="column">
        <p class="meta-label">Bill To</p>
        <p class="meta-value">${escapeHtml(invoice.client.name || invoice.client.companyName || 'Client Name')}</p>
        ${invoice.client.companyName && invoice.client.name ? `<p class="muted">${escapeHtml(invoice.client.companyName)}</p>` : ''}
        ${invoice.client.billingAddress ? `<p class="muted">${escapeHtml(invoice.client.billingAddress).replace(/\n/g, '<br>')}</p>` : ''}
        <div style="margin-top: 6px;">
          ${invoice.client.email ? `<p class="muted">${escapeHtml(invoice.client.email)}</p>` : ''}
          ${invoice.client.phone ? `<p class="muted">${escapeHtml(invoice.client.phone)}</p>` : ''}
        </div>
      </div>
      <div class="column column-right">
        <div>
          <p class="meta-label">Issue Date</p>
          <p class="meta-value">${invoice.details.issueDate || '—'}</p>
        </div>
        <div>
          <p class="meta-label">Due Date</p>
          <p class="meta-value">${invoice.details.dueDate || '—'}</p>
        </div>
        <div>
          <p class="meta-label">Payment Terms</p>
          <p class="meta-value">${escapeHtml(invoice.details.paymentTerms || '—')}</p>
        </div>
        <div>
          <p class="meta-label">PO Number</p>
          <p class="meta-value">${escapeHtml(invoice.details.poNumber || '—')}</p>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Price</th>
          <th class="num">Tax</th>
          <th class="num">Disc</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(calculations.subtotal, currency)}</span></div>
      ${calculations.discount > 0 ? `<div class="totals-row"><span>Discount</span><span>-${formatCurrency(calculations.discount, currency)}</span></div>` : ''}
      ${calculations.tax > 0 ? `<div class="totals-row"><span>Tax</span><span>${formatCurrency(calculations.tax, currency)}</span></div>` : ''}
      <div class="totals-row total"><span>Grand Total</span><span>${formatCurrency(calculations.grandTotal, currency)}</span></div>
    </div>

    ${invoice.additional.notes || invoice.additional.paymentInstructions || invoice.additional.terms ? `
      <div class="additional">
        ${invoice.additional.notes ? `<div class="additional-block"><p class="additional-title">Notes</p><p class="additional-text">${escapeHtml(invoice.additional.notes)}</p></div>` : ''}
        ${invoice.additional.paymentInstructions ? `<div class="additional-block"><p class="additional-title">Payment Instructions</p><p class="additional-text">${escapeHtml(invoice.additional.paymentInstructions)}</p></div>` : ''}
        ${invoice.additional.terms ? `<div class="additional-block"><p class="additional-title">Terms & Conditions</p><p class="additional-text">${escapeHtml(invoice.additional.terms)}</p></div>` : ''}
      </div>
    ` : ''}
  </div>
</body>
</html>
  `

  return { html, fileName }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function printInvoice(invoice: InvoiceData): void {
  const { html, fileName } = buildPrintableInvoiceHTML(invoice)
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    console.error('Unable to open print window')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  // Allow the browser to render before printing.
  setTimeout(() => {
    printWindow.print()
    // Some browsers close the print window automatically; keep it open for user to save as PDF.
  }, 250)
}

export function downloadPDF(invoice: InvoiceData): void {
  printInvoice(invoice)
}
