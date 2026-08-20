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

export function buildPrintableInvoiceHTML(invoice: any): { html: string; fileName: string } {
  const fileName = `Invoice_${invoice?.invoiceNumber || invoice?.number || invoice?.id || 'INV-616296'}.pdf`
  const element = document.getElementById('invoice-preview')
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${fileName}</title>
        ${Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(n => n.outerHTML).join('\n')}
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          * {
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            height: 100% !important;
          }
          .print-wrapper {
            padding: 24px !important;
            width: 100% !important;
            max-width: 800px !important;
            margin: 0 auto !important;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${element ? element.innerHTML : '<div>Invoice preview unavailable</div>'}
        </div>
      </body>
    </html>
  `
  return { html, fileName }
}

export function printInvoiceElement(elementId: string = 'invoice-preview'): void {
  const element = document.getElementById(elementId)
  if (!element) return

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentWindow?.document
  if (!iframeDoc) return

  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n')

  iframeDoc.open()
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${styleTags}
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          * {
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
          }
          .print-wrapper {
            padding: 32px !important;
            width: 100% !important;
            max-width: 800px !important;
            margin: 0 auto !important;
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `)
  iframeDoc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.error('Print failed:', e)
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }
  }, 400)
}

export function printInvoice(invoice?: any): boolean {
  printInvoiceElement('invoice-preview')
  return true
}

export function downloadPDF(invoice?: any): void {
  printInvoiceElement('invoice-preview')
}

export function downloadPDFFromElement(elementId: string = 'invoice-preview', fileName: string = 'Invoice.pdf'): void {
  printInvoiceElement(elementId)
}
