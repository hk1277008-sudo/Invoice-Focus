import type { InvoiceData } from './types'

export function exportInvoiceToJSON(invoice: InvoiceData): { blob: Blob; fileName: string } {
  const data = JSON.stringify(invoice, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const fileName = `${(invoice.details.number || 'invoice').replace(/\s+/g, '_').toLowerCase()}.json`
  return { blob, fileName }
}

export function downloadJSON(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function readInvoiceFromFile(file: File): Promise<InvoiceData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const data = JSON.parse(text) as InvoiceData
        resolve(data)
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function isValidInvoiceData(data: unknown): data is InvoiceData {
  if (!data || typeof data !== 'object') return false
  const invoice = data as Partial<InvoiceData>
  return (
    typeof invoice.business === 'object' &&
    invoice.business !== null &&
    typeof invoice.client === 'object' &&
    invoice.client !== null &&
    typeof invoice.details === 'object' &&
    invoice.details !== null &&
    Array.isArray(invoice.items) &&
    typeof invoice.additional === 'object' &&
    invoice.additional !== null
  )
}
