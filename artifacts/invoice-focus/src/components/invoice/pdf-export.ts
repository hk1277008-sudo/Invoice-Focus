export function printInvoice(invoice: InvoiceData): boolean {
  const { html } = buildPrintableInvoiceHTML(invoice)

  // Open window synchronously to bypass pop-up blockers
  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    return false
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  // Fallback handler for readyState checking (bypasses broken onload events)
  const triggerPrint = () => {
    try {
      printWindow.focus()
      printWindow.print()
    } catch (e) {
      console.error('Printing failed:', e)
    }
  }

  if (printWindow.document.readyState === 'complete') {
    window.setTimeout(triggerPrint, 250)
  } else {
    printWindow.onload = () => {
      window.setTimeout(triggerPrint, 250)
    }
  }

  return true
}

export function downloadPDF(invoice: InvoiceData): void {
  const { html, fileName } = buildPrintableInvoiceHTML(invoice)

  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    throw new Error(
      'Unable to open the PDF preview. Please allow pop-ups for InvoiceFocus and try again.',
    )
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  const cleanFileName = fileName.replace(/\.pdf$/i, '')
  printWindow.document.title = cleanFileName

  const triggerPrint = () => {
    printWindow.document.title = cleanFileName
    try {
      printWindow.focus()
      printWindow.print()
    } catch (e) {
      console.error('PDF preview failed:', e)
    }
  }

  if (printWindow.document.readyState === 'complete') {
    window.setTimeout(triggerPrint, 250)
  } else {
    printWindow.onload = () => {
      window.setTimeout(triggerPrint, 250)
    }
  }
}
