// Replace this interface with your actual InvoiceData type if imported elsewhere
export interface InvoiceData {
  id?: string
  invoiceNumber?: string
  clientName?: string
  date?: string
  items?: Array<{ description: string; amount: number }>
  total?: number
  [key: string]: any
}

// 1. Helper function that was causing the ReferenceError
export function buildPrintableInvoiceHTML(invoice: InvoiceData): { html: string; fileName: string } {
  const fileName = `Invoice_${invoice.invoiceNumber || invoice.id || 'document'}.pdf`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${fileName}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 20px;
            color: #333;
          }
          h1 { color: #111; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
        </style>
      </head>
      <body>
        <h1>Invoice ${invoice.invoiceNumber || invoice.id || ''}</h1>
        <p><strong>Client:</strong> ${invoice.clientName || 'N/A'}</p>
        <p><strong>Date:</strong> ${invoice.date || new Date().toLocaleDateString()}</p>
        <hr />
        <div>
          <!-- Add your styled invoice HTML structure here if you have custom templates -->
          <p><strong>Total Amount:</strong> $${invoice.total ?? '0.00'}</p>
        </div>
      </body>
    </html>
  `
  return { html, fileName }
}

// 2. Safe Print Function
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
        console.error('Print failed:', e)
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

// 3. Safe PDF Download / Print Preview Function
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
      console.error('PDF preview failed:', e)
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
