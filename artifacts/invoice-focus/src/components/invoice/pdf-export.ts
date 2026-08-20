/**
 * Triggers physical printing or native 'Save as PDF' via an isolated iframe.
 * Uses current DOM element styling to preserve exact visual layouts.
 */
export function printInvoiceElement(elementId: string = 'invoice-preview'): void {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`Target element #${elementId} not found.`)
    return
  }

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

  // Collect active Tailwind / CSS styles from document head
  const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n')

  iframeDoc.open()
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Invoice</title>
        ${styleTags}
      </head>
      <body style="background: #ffffff; padding: 24px;">
        ${element.outerHTML}
      </body>
    </html>
  `)
  iframeDoc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.error('Printing failed:', e)
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }
  }, 400)
}

/**
 * Fallback alias for download button compatibility
 */
export function downloadPDFFromElement(
  elementId: string = 'invoice-preview',
  _fileName: string = 'Invoice.pdf'
): void {
  printInvoiceElement(elementId)
}
