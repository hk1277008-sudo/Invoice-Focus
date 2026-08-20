declare global {
  interface Window {
    html2pdf: any
  }
}

/**
 * Dynamically loads html2pdf.js from CDN if not already loaded
 */
function loadHtml2PdfScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load html2pdf script'))
    document.head.appendChild(script)
  })
}

/**
 * Downloads the invoice element directly as a PDF file
 */
export async function downloadPDFFromElement(
  elementId: string = 'invoice-preview',
  fileName: string = 'Invoice.pdf'
): Promise<void> {
  const element = document.getElementById(elementId)

  if (!element) {
    console.error(`Target element #${elementId} not found.`)
    return
  }

  try {
    // Load CDN script dynamically on demand
    await loadHtml2PdfScript()

    const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`

    const options = {
      margin: [10, 10, 10, 10],
      filename: cleanFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }

    window.html2pdf().set(options).from(element).save()
  } catch (error) {
    console.error('PDF generation error:', error)
  }
}

/**
 * Triggers clean iframe printing for physical printers
 */
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
        ${styleTags}
      </head>
      <body style="background: #ffffff; padding: 20px;">
        ${element.outerHTML}
      </body>
    </html>
  `)
  iframeDoc.close()

  setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 1000)
  }, 400)
}
