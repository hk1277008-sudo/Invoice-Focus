import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { InvoiceData } from './types'
import { buildDocumentRenderModel } from './document-rendering'
import { formatCurrency } from './currencies'

export function generateInvoiceFileName(invoice: InvoiceData): string {
  const number = invoice.details.number?.trim() || 'invoice'
  return `${number.replace(/\s+/g, '_').toLowerCase()}.pdf`
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function drawPageFooter(
  doc: jsPDF,
  businessName: string,
  pageNumber: number,
  pageCount: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.25)
  doc.line(40, pageHeight - 34, pageWidth - 40, pageHeight - 34)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)

  doc.text(businessName || 'InvoiceFocus', 40, pageHeight - 21)

  doc.text(
    `Page ${pageNumber} of ${pageCount}`,
    pageWidth - 40,
    pageHeight - 21,
    { align: 'right' },
  )
}

function drawHeader(
  doc: jsPDF,
  invoice: InvoiceData,
  model: ReturnType<typeof buildDocumentRenderModel>,
) {
  const pageWidth = doc.internal.pageSize.getWidth()

  const businessName =
    model.invoice.business.name?.trim() || 'Business Name'

  const documentTitle = model.documentMeta.title || 'Invoice'

  const invoiceNumber =
    model.invoice.details.number?.trim() || '000001'

  const issueDate =
    model.invoice.details.issueDate?.trim() || '—'

  const dueDate =
    model.invoice.details.dueDate?.trim() || '—'

  // Brand
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  doc.text(businessName, 40, 48)

  const businessContact =
    model.invoice.business.website ||
    model.invoice.business.email ||
    ''

  if (businessContact) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text(cleanText(businessContact), 40, 61)
  }

  // Document title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(15, 23, 42)
  doc.text(documentTitle.toUpperCase(), pageWidth - 40, 48, {
    align: 'right',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)

  doc.text(`#${invoiceNumber}`, pageWidth - 40, 62, {
    align: 'right',
  })

  // Header divider
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.35)
  doc.line(40, 78, pageWidth - 40, 78)

  // Invoice metadata
  const metaY = 98

  const columns = [
    {
      label: 'ISSUE DATE',
      value: issueDate,
    },
    {
      label: 'DUE DATE',
      value: dueDate,
    },
    {
      label: 'CURRENCY',
      value: model.currency.toUpperCase(),
    },
    {
      label: 'STATUS',
      value: cleanText(model.invoice.details.status || 'Unpaid'),
    },
  ]

  const usableWidth = pageWidth - 80
  const columnWidth = usableWidth / columns.length

  columns.forEach((column, index) => {
    const x = 40 + index * columnWidth

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(column.label, x, metaY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)

    const status =
      column.label === 'STATUS'
        ? column.value.toLowerCase()
        : ''

    if (column.label === 'STATUS') {
      if (status === 'paid') {
        doc.setTextColor(22, 101, 52)
      } else if (
        status === 'pending' ||
        status === 'overdue'
      ) {
        doc.setTextColor(146, 64, 14)
      } else {
        doc.setTextColor(71, 85, 105)
      }
    } else {
      doc.setTextColor(15, 23, 42)
    }

    doc.text(column.value || '—', x, metaY + 14)
  })

  // Parties
  const partiesY = 138

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)

  doc.text('FROM', 40, partiesY)
  doc.text('BILL TO', pageWidth / 2 + 10, partiesY)

  const businessAddress =
    model.invoice.business.address?.trim() || ''

  const clientName =
    model.invoice.client.name?.trim() ||
    model.invoice.client.companyName?.trim() ||
    'Client'

  const clientAddress =
    model.invoice.client.billingAddress?.trim() || ''

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)

  doc.text(businessName, 40, partiesY + 16)
  doc.text(clientName, pageWidth / 2 + 10, partiesY + 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)

  const businessLines = [
    ...businessAddress.split('\n').filter(Boolean),
    model.invoice.business.email || '',
    model.invoice.business.phone || '',
  ].filter(Boolean)

  const clientLines = [
    ...clientAddress.split('\n').filter(Boolean),
    model.invoice.client.email || '',
    model.invoice.client.phone || '',
  ].filter(Boolean)

  businessLines.forEach((line, index) => {
    doc.text(cleanText(line), 40, partiesY + 29 + index * 12)
  })

  clientLines.forEach((line, index) => {
    doc.text(
      cleanText(line),
      pageWidth / 2 + 10,
      partiesY + 29 + index * 12,
    )
  })

  // Reference/payment information
  const infoY = 205

  const info = [
    {
      label: 'PAYMENT TERMS',
      value:
        model.invoice.details.paymentTerms?.trim() ||
        'Due on receipt',
    },
    {
      label: 'REFERENCE',
      value:
        model.invoice.details.reference?.trim() || '—',
    },
  ]

  info.forEach((item, index) => {
    const x = index === 0 ? 40 : pageWidth / 2 + 10

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(item.label, x, infoY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)

    const wrapped = doc.splitTextToSize(
      cleanText(item.value),
      pageWidth / 2 - 60,
    )

    doc.text(wrapped, x, infoY + 13)
  })
}

function drawTotals(
  doc: jsPDF,
  model: ReturnType<typeof buildDocumentRenderModel>,
  startY: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth()

  const summaryWidth = 210
  const labelX = pageWidth - 40 - summaryWidth
  const valueX = pageWidth - 40

  let y = startY

  model.totals.rows.forEach((row) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)

    doc.text(cleanText(row.label), labelX, y)

    doc.text(cleanText(row.value), valueX, y, {
      align: 'right',
    })

    y += 16
  })

  y += 3

  doc.setDrawColor(15, 23, 42)
  doc.setLineWidth(0.65)
  doc.line(labelX, y, valueX, y)

  y += 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)

  doc.text(cleanText(model.totals.total.label), labelX, y)

  doc.text(cleanText(model.totals.total.value), valueX, y, {
    align: 'right',
  })

  return y
}

function drawNotes(
  doc: jsPDF,
  invoice: InvoiceData,
  startY: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth()

  const notes = invoice.details.notes?.trim() || ''
  const terms = invoice.details.terms?.trim() || ''

  if (!notes && !terms) {
    return startY
  }

  let y = startY

  const contentWidth = pageWidth - 80

  if (notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text('NOTES', 40, y)

    y += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)

    const lines = doc.splitTextToSize(notes, contentWidth)
    doc.text(lines, 40, y)

    y += lines.length * 12 + 16
  }

  if (terms) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text('TERMS & PAYMENT INFORMATION', 40, y)

    y += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)

    const lines = doc.splitTextToSize(terms, contentWidth)
    doc.text(lines, 40, y)

    y += lines.length * 12
  }

  return y
}

export function buildPrintableInvoiceHTML(
  invoice: InvoiceData,
): { html: string; fileName: string } {
  const model = buildDocumentRenderModel(invoice)

  const businessName =
    model.invoice.business.name?.trim() || 'Business Name'

  const title =
    model.documentMeta.title || 'Invoice'

  const number =
    model.invoice.details.number?.trim() || '000001'

  const escape = (value: unknown) =>
    cleanText(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  const multiline = (value: unknown) =>
    escape(value).replace(/\n/g, '<br>')

  const {
    source,
    visibleItems,
    showSku,
    showAdjustments,
    totals,
  } = model

  const itemsHtml = visibleItems
    .map(({ item, values }) => {
      return `
        <tr>
          <td>
            <strong>${escape(item.name || item.description)}</strong>
            ${
              item.name && item.description
                ? `<div class="description">${multiline(item.description)}</div>`
                : ''
            }
          </td>
          ${
            showSku
              ? `<td>${multiline(item.sku || '—')}</td>`
              : ''
          }
          <td class="right">${escape(values.quantity)}</td>
          <td class="right">${escape(
            formatCurrency(values.unitPrice, model.currency),
          )}</td>
          ${
            showAdjustments
              ? `
                <td class="right">${
                  values.taxPercent > 0
                    ? `${values.taxPercent}%`
                    : '—'
                }</td>
                <td class="right">${
                  values.discountPercent > 0
                    ? `${values.discountPercent}%`
                    : '—'
                }</td>
              `
              : ''
          }
          <td class="right strong">${escape(
            formatCurrency(values.lineTotal, model.currency),
          )}</td>
        </tr>
      `
    })
    .join('')

  const totalsHtml = totals.rows
    .map(
      (row) => `
        <div class="total-row">
          <span>${escape(row.label)}</span>
          <span>${escape(row.value)}</span>
        </div>
      `,
    )
    .join('')

  const status = escape(
    source.details.status || 'Unpaid',
  )

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escape(title)} #${escape(number)}</title>
<style>
@page {
  size: A4;
  margin: 16mm;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: #0f172a;
  background: white;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 12px;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.invoice {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  padding-bottom: 22px;
  border-bottom: 1px solid #e2e8f0;
}

.brand {
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.muted {
  color: #64748b;
}

.title {
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-align: right;
}

.number {
  margin-top: 4px;
  color: #64748b;
  text-align: right;
}

.meta {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid #e2e8f0;
}

.label {
  margin-bottom: 5px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.value {
  font-weight: 600;
}

.parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  padding: 22px 0;
}

.party-name {
  font-size: 13px;
  font-weight: 700;
}

.party-details {
  margin-top: 5px;
  color: #64748b;
  line-height: 1.55;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 18px;
}

thead {
  display: table-header-group;
}

th {
  padding: 9px 0;
  border-bottom: 1.5px solid #cbd5e1;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .05em;
  text-align: left;
  text-transform: uppercase;
}

td {
  padding: 11px 0;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.right {
  text-align: right;
}

.strong {
  font-weight: 650;
}

.description {
  margin-top: 2px;
  color: #64748b;
  font-size: 11px;
}

.bottom {
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 48px;
  margin-top: 28px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 8px;
  color: #475569;
}

.grand-total {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-top: 10px;
  padding-top: 13px;
  border-top: 1.5px solid #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.notes {
  margin-top: 2px;
}

.notes-text {
  color: #475569;
  white-space: normal;
}

.footer {
  display: flex;
  justify-content: space-between;
  margin-top: 44px;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 10px;
}

@media print {
  .invoice {
    max-width: none;
  }

  tr {
    break-inside: avoid;
  }
}
</style>
</head>
<body>
<div class="invoice">

  <header class="header">
    <div>
      <div class="brand">${escape(businessName)}</div>
      ${
        source.business.website || source.business.email
          ? `<div class="muted">${escape(
              source.business.website ||
                source.business.email ||
                '',
            )}</div>`
          : ''
      }
    </div>

    <div>
      <div class="title">${escape(title)}</div>
      <div class="number">#${escape(number)}</div>
    </div>
  </header>

  <section class="meta">
    <div>
      <div class="label">Issue date</div>
      <div class="value">${escape(
        source.details.issueDate || '—',
      )}</div>
    </div>

    <div>
      <div class="label">Due date</div>
      <div class="value">${escape(
        source.details.dueDate || '—',
      )}</div>
    </div>

    <div>
      <div class="label">Currency</div>
      <div class="value">${escape(
        model.currency.toUpperCase(),
      )}</div>
    </div>

    <div>
      <div class="label">Status</div>
      <div class="value">${status}</div>
    </div>
  </section>

  <section class="parties">
    <div>
      <div class="label">From</div>
      <div class="party-name">${escape(businessName)}</div>
      <div class="party-details">
        ${source.business.address
          ? multiline(source.business.address) + '<br>'
          : ''}
        ${source.business.email
          ? escape(source.business.email) + '<br>'
          : ''}
        ${source.business.phone
          ? escape(source.business.phone)
          : ''}
      </div>
    </div>

    <div>
      <div class="label">Bill to</div>
      <div class="party-name">${escape(
        source.client.name ||
          source.client.companyName ||
          'Client',
      )}</div>
      <div class="party-details">
        ${source.client.billingAddress
          ? multiline(source.client.billingAddress) + '<br>'
          : ''}
        ${source.client.email
          ? escape(source.client.email) + '<br>'
          : ''}
        ${source.client.phone
          ? escape(source.client.phone)
          : ''}
      </div>
    </div>
  </section>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        ${showSku ? '<th>SKU</th>' : ''}
        <th class="right">Qty</th>
        <th class="right">Unit price</th>
        ${
          showAdjustments
            ? '<th class="right">Tax</th><th class="right">Disc.</th>'
            : ''
        }
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <section class="bottom">
    <div class="notes">
      ${
        source.details.notes
          ? `
            <div class="label">Notes</div>
            <div class="notes-text">
              ${multiline(source.details.notes)}
            </div>
          `
          : ''
      }

      ${
        source.details.terms
          ? `
            <div style="margin-top:22px">
              <div class="label">Terms & payment information</div>
              <div class="notes-text">
                ${multiline(source.details.terms)}
              </div>
            </div>
          `
          : ''
      }
    </div>

    <div>
      ${totalsHtml}

      <div class="grand-total">
        <span>${escape(totals.total.label)}</span>
        <span>${escape(totals.total.value)}</span>
      </div>
    </div>
  </section>

  <footer class="footer">
    <span>Thank you for your business.</span>
    <span>${escape(businessName)}</span>
  </footer>

</div>
</body>
</html>`

  return {
    html,
    fileName: generateInvoiceFileName(invoice),
  }
}

export function printInvoice(invoice: InvoiceData): boolean {
  const { html } = buildPrintableInvoiceHTML(invoice)

  const printWindow = window.open('', '_blank')

  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    const triggerPrint = () => {
      printWindow.focus()
      printWindow.print()
    }

    if (printWindow.document.readyState === 'complete') {
      setTimeout(triggerPrint, 150)
    } else {
      printWindow.addEventListener(
        'load',
        () => setTimeout(triggerPrint, 150),
        { once: true },
      )
    }

    return true
  }

  // Popup-blocker fallback
  const iframe = document.createElement('iframe')

  iframe.setAttribute('aria-hidden', 'true')

  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.opacity = '0'

  document.body.appendChild(iframe)

  const iframeDocument = iframe.contentDocument

  if (!iframeDocument) {
    iframe.remove()
    return false
  }

  iframeDocument.open()
  iframeDocument.write(html)
  iframeDocument.close()

  const printFrame = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()

    setTimeout(() => {
      iframe.remove()
    }, 1000)
  }

  iframe.onload = () => {
    setTimeout(printFrame, 150)
  }

  return true
}

export function downloadPDF(invoice: InvoiceData): void {
  const model = buildDocumentRenderModel(invoice)

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const margin = 40

  const businessName =
    model.invoice.business.name?.trim() ||
    'InvoiceFocus'

  const title =
    model.documentMeta.title || 'Invoice'

  const invoiceNumber =
    model.invoice.details.number?.trim() ||
    '000001'

  // ---------------------------------------------------------------------------
  // PAGE HEADER
  // ---------------------------------------------------------------------------

  drawHeader(doc, invoice, model)

  // ---------------------------------------------------------------------------
  // ITEMS
  // ---------------------------------------------------------------------------

  const tableHead: string[] = [
    'Description',
  ]

  if (model.showSku) {
    tableHead.push('SKU')
  }

  tableHead.push(
    'Qty',
    'Unit price',
  )

  if (model.showAdjustments) {
    tableHead.push('Tax', 'Disc.')
  }

  tableHead.push('Amount')

  const tableBody = model.visibleItems.map(
    ({ item, values }) => {
      const description = cleanText(
        item.name || item.description || 'Item',
      )

      const secondaryDescription =
        item.name && item.description
          ? `\n${cleanText(item.description)}`
          : ''

      const row: string[] = [
        `${description}${secondaryDescription}`,
      ]

      if (model.showSku) {
        row.push(cleanText(item.sku || '—'))
      }

      row.push(
        cleanText(values.quantity),
        formatCurrency(
          values.unitPrice,
          model.currency,
        ),
      )

      if (model.showAdjustments) {
        row.push(
          values.taxPercent > 0
            ? `${values.taxPercent}%`
            : '—',
          values.discountPercent > 0
            ? `${values.discountPercent}%`
            : '—',
        )
      }

      row.push(
        formatCurrency(
          values.lineTotal,
          model.currency,
        ),
      )

      return row
    },
  )

  autoTable(doc, {
    startY: 238,
    margin: {
      left: margin,
      right: margin,
      bottom: 52,
    },

    head: [tableHead],
    body: tableBody,

    theme: 'plain',

    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: {
        top: 9,
        right: 4,
        bottom: 9,
        left: 4,
      },
      lineColor: [241, 245, 249],
      lineWidth: 0.25,
      valign: 'top',
      overflow: 'linebreak',
    },

    headStyles: {
      font: 'helvetica',
      fontStyle: 'bold',
      fontSize: 7.5,
      textColor: [148, 163, 184],
      fillColor: [255, 255, 255],
      lineColor: [203, 213, 225],
      lineWidth: 0.5,
      cellPadding: {
        top: 7,
        right: 4,
        bottom: 7,
        left: 4,
      },
    },

    bodyStyles: {
      fillColor: [255, 255, 255],
    },

    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },

    columnStyles: {
      0: {
        cellWidth: 'auto',
      },
    },

    didParseCell: (data) => {
      if (data.section === 'head') {
        if (data.column.index > 0) {
          data.cell.styles.halign = 'right'
        }
      }

      if (data.section === 'body') {
        if (data.column.index > 0) {
          data.cell.styles.halign = 'right'
        }

        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'normal'
        }

        const lastColumn =
          tableHead.length - 1

        if (data.column.index === lastColumn) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [
            15,
            23,
            42,
          ]
        }
      }
    },

    didDrawPage: () => {
      const pageNumber =
        doc.getNumberOfPages()

      drawPageFooter(
        doc,
        businessName,
        pageNumber,
        pageNumber,
      )
    },
  })

  // ---------------------------------------------------------------------------
  // TOTALS / NOTES
  // ---------------------------------------------------------------------------

  const finalY =
    (doc as jsPDF & {
      lastAutoTable?: {
        finalY: number
      }
    }).lastAutoTable?.finalY ?? 238

  const estimatedBottomSpace = 170

  if (
    finalY >
    pageHeight - estimatedBottomSpace
  ) {
    doc.addPage()

    drawPageFooter(
      doc,
      businessName,
      doc.getNumberOfPages(),
      doc.getNumberOfPages(),
    )

    const totalsY = 70

    drawTotals(
      doc,
      model,
      totalsY,
    )

    drawNotes(
      doc,
      invoice,
      totalsY + 110,
    )
  } else {
    const totalsX = pageWidth - 250

    drawTotals(
      doc,
      model,
      finalY + 30,
    )

    const notesY = finalY + 30

    if (
      invoice.details.notes ||
      invoice.details.terms
    ) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text('NOTES', margin, notesY)

      let noteY = notesY + 13

      if (invoice.details.notes) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(71, 85, 105)

        const noteLines =
          doc.splitTextToSize(
            cleanText(invoice.details.notes),
            totalsX - margin - 30,
          )

        doc.text(
          noteLines,
          margin,
          noteY,
        )

        noteY +=
          noteLines.length * 12 + 16
      }

      if (invoice.details.terms) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(148, 163, 184)

        doc.text(
          'TERMS & PAYMENT INFORMATION',
          margin,
          noteY,
        )

        noteY += 13

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(71, 85, 105)

        const termsLines =
          doc.splitTextToSize(
            cleanText(invoice.details.terms),
            totalsX - margin - 30,
          )

        doc.text(
          termsLines,
          margin,
          noteY,
        )
      }
    }
  }

  // ---------------------------------------------------------------------------
  // FINAL PAGE FOOTERS
  // ---------------------------------------------------------------------------

  const totalPages =
    doc.getNumberOfPages()

  for (
    let page = 1;
    page <= totalPages;
    page += 1
  ) {
    doc.setPage(page)

    drawPageFooter(
      doc,
      businessName,
      page,
      totalPages,
    )
  }

  // ---------------------------------------------------------------------------
  // DOCUMENT METADATA
  // ---------------------------------------------------------------------------

  doc.setProperties({
    title: `${title} #${invoiceNumber}`,
    subject: `${title} generated by InvoiceFocus`,
    author: businessName,
    creator: 'InvoiceFocus',
    keywords:
      'invoice, InvoiceFocus, business document',
  })

  // ---------------------------------------------------------------------------
  // DOWNLOAD
  // ---------------------------------------------------------------------------

  doc.save(
    generateInvoiceFileName(invoice),
  )
}
