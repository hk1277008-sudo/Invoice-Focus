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
    throw new Error('Unable to open print preview. Please try again.')
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
