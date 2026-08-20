export function printInvoice(invoice: InvoiceData): boolean {
  const { html } = buildPrintableInvoiceHTML(invoice)

  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    return false
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  printWindow.onload = () => {
    window.setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 150)
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

  printWindow.onload = () => {
    printWindow.document.title = fileName.replace(/\.pdf$/i, '')

    window.setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 150)
  }
}
