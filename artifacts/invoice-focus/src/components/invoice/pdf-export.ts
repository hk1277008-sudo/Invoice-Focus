export function printInvoice(invoice: InvoiceData): boolean {
  try {
    const { html } = buildPrintableInvoiceHTML(invoice)

    // 1. Create a hidden iframe
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

    // 2. Write HTML into the iframe
    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    // 3. Trigger print once assets load, then cleanup
    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (e) {
        console.error('Print failed:', e)
      } finally {
        // Remove iframe after print dialog finishes
        setTimeout(() => {
          document.body.removeChild(iframe)
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
  // Uses the same hidden iframe flow, setting document title for default save name
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
    throw new Error('Could not access print frame.')
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
        document.body.removeChild(iframe)
      }, 1000)
    }
  }

  if (iframeDoc.readyState === 'complete') {
    setTimeout(triggerPrint, 300)
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 300)
  }
}
