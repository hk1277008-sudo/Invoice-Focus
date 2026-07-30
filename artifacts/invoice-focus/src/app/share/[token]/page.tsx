import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Download, Printer } from 'lucide-react'
import { useParams } from 'wouter'
import { Button } from '@/components/ui/button'
import { InvoicePreview } from '@/components/invoice/InvoicePreview'
import { downloadPDF } from '@/components/invoice/pdf-export'
import { getCurrencyByCode } from '@/components/invoice/currencies'
import { calculateInvoiceTotals } from '@/components/invoice/utils'
import { getPublicSharedInvoice, type PublicSharedInvoice } from '@/lib/share'

export default function SharedInvoicePage() {
  const { token = '' } = useParams<{ token: string }>()
  const [invoice, setInvoice] = useState<PublicSharedInvoice | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { getPublicSharedInvoice(token).then(({ invoice: value }) => setInvoice(value)).catch((reason) => setError(reason instanceof Error ? reason.message : 'This invoice is unavailable.')) }, [token])
  const currency = useMemo(() => invoice ? getCurrencyByCode(invoice.payload.details.currency) : null, [invoice])
  if (error) return <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6"><div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm"><AlertCircle className="mx-auto h-10 w-10 text-destructive" /><h1 className="mt-4 text-xl font-semibold">Invoice unavailable</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p></div></div>
  if (!invoice || !currency) return <div className="flex min-h-svh items-center justify-center bg-muted/30 text-sm text-muted-foreground">Loading invoice…</div>
  const calculations = calculateInvoiceTotals(invoice.payload.items)
  return <div className="min-h-svh bg-muted/30 py-6 sm:py-10"><main className="mx-auto max-w-5xl px-4 sm:px-6"><header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Invoice</p><h1 className="text-xl font-semibold">{invoice.invoice_number}</h1><p className="text-sm text-muted-foreground">Status: {invoice.status} · Due {invoice.due_date || 'Upon receipt'}</p></div><div className="flex gap-2 print:hidden"><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button><Button onClick={() => downloadPDF(invoice.payload)}><Download className="mr-2 h-4 w-4" />Download PDF</Button></div></header><div className="print:shadow-none"><InvoicePreview invoice={invoice.payload} currency={currency} calculations={calculations} hasAnyData /></div><p className="mt-6 text-center text-xs text-muted-foreground print:hidden">Secure invoice portal · Online payments can be added here in the future.</p></main></div>
}