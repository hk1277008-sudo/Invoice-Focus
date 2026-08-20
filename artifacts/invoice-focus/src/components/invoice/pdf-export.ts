export interface InvoiceItem {
  description: string
  quantity?: number
  rate?: number
  amount?: number
}

export interface InvoiceData {
  id?: string
  invoiceNumber?: string
  clientName?: string
  clientEmail?: string
  date?: string
  dueDate?: string
  items?: InvoiceItem[]
  subtotal?: number
  tax?: number
  total?: number
  notes?: string
  [key: string]: any
}

export function buildPrintableInvoiceHTML(invoice: InvoiceData): { html: string; fileName: string } {
  const invoiceNum = invoice.invoiceNumber || invoice.id || 'INV-001'
  const fileName = `Invoice_${invoiceNum}.pdf`

  const itemsList = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items.map((item) => `
        <tr>
          <td>${item.description || 'Item'}</td>
          <td style="text-align: center;">${item.quantity ?? 1}</td>
          <td style="text-align: right;">$${Number(item.rate ?? item.amount ?? 0).toFixed(2)}</td>
          <td style="text-align: right;">$${Number(item.amount ?? 0).toFixed(2)}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="4" style="text-align: center; color: #666; padding: 16px;">No line items available</td>
        </tr>
      `

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${fileName}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
            font-size: 14px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            color: #475569;
            text-align: right;
          }
          .details {
            margin-bottom: 24px;
          }
          .details table {
            width: 100%;
            border-collapse: collapse;
          }
          .details td {
            vertical-align: top;
            padding: 4px 0;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .table th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: 600;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #cbd5e1;
          }
          .table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals {
            width: 280px;
            margin-left: auto;
            margin-bottom: 24px;
          }
          .totals table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals td {
            padding: 6px 0;
          }
          .totals .grand-total {
            font-weight: 700;
            font-size: 16px;
            border-top: 2px solid #0f172a;
            color: #0f172a;
          }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">InvoiceFocus</div>
          </div>
          <div class="title">
            INVOICE<br />
            <span style="font-size: 14px; font-weight: normal; color: #64748b;">#${invoiceNum}</span>
          </div>
        </div>

        <div class="details">
          <table>
            <tr>
              <td style="width: 50%;">
                <strong>Billed To:</strong><br />
                ${invoice.clientName ? invoice.clientName : 'Client Name'}<br />
                ${invoice.clientEmail ? invoice.clientEmail : ''}
              </td>
              <td style="width: 50%; text-align: right;">
                <strong>Invoice Date:</strong> ${invoice.date || new Date().toLocaleDateString()}<br />
                ${invoice.dueDate ? `<strong>Due Date:</strong> ${invoice.dueDate}` : ''}
              </td>
            </tr>
          </table>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <div class="totals">
          <table>
            ${invoice.subtotal !== undefined ? `
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">$${Number(invoice.subtotal).toFixed(2)}</td>
              </tr>
            ` : ''}
            ${invoice.tax !== undefined ? `
              <tr>
                <td>Tax:</td>
                <td style="text-align: right;">$${Number(invoice.tax).toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="grand-total">
              <td>Total:</td>
              <td style="text-align: right;">$${Number(invoice.total ?? 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
          <div style="margin-top: 20px; font-size: 13px; color: #475569;">
            <strong>Notes:</strong><br />
            ${invoice.notes}
          </div>
        ` : ''}

        <div class="footer">
          Thank you for your business! — Generated via InvoiceFocus
        </div>
      </body>
    </html>
  `
  return { html, fileName }
}

export function printInvoice(invoice: InvoiceData): boolean {
  try {
    const { html } = buildPrintableInvoiceHTML(invoice)

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'

    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) return false

    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (e) {
        console.error('Print execution failed:', e)
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1000)
      }
    }

    if (iframeDoc.readyState === 'complete') {
      setTimeout(triggerPrint, 300)
    } else {
      iframe.onload = () => setTimeout(triggerPrint, 300)
    }

    return true
  } catch (error) {
    console.error('Error printing invoice:', error)
    return false
  }
}

export function downloadPDF(invoice: InvoiceData): void {
  const { html, fileName } = buildPrintableInvoiceHTML(invoice)

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'

  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentWindow?.document
  if (!iframeDoc) {
    throw new Error('Unable to open print preview.')
  }

  iframeDoc.open()
  iframeDoc.write(html)
  iframeDoc.close()

  const cleanFileName = fileName.replace(/\.pdf$/i, '')
  iframeDoc.title = cleanFileName

  const triggerPrint = () => {
    try {
      iframeDoc.title = cleanFileName
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.error('PDF preview execution failed:', e)
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }
  }

  if (iframeDoc.readyState === 'complete') {
    setTimeout(triggerPrint, 300)
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 300)
  }
}
