import { useCallback, useEffect, useState } from 'react'
import { Link } from 'wouter'
import { ArrowDownUp, Copy, FileText, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import {
  deleteInvoice, duplicateInvoice, listInvoices, type InvoiceRecord, type InvoiceStatus,
} from '@/lib/invoices'

const statuses: Array<InvoiceStatus | 'all'> = ['all', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled']

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
}

function statusClass(status: InvoiceStatus) {
  return status === 'Paid'
    ? 'bg-emerald-50 text-emerald-700'
    : status === 'Overdue'
      ? 'bg-rose-50 text-rose-700'
      : status === 'Cancelled'
        ? 'bg-muted text-muted-foreground'
        : 'bg-primary/10 text-primary'
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | 'all'>('all')
  const [sort, setSort] = useState('updated')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listInvoices({ search, status, sort, direction })
      setInvoices(result.invoices)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load invoices')
    } finally {
      setLoading(false)
    }
  }, [search, status, sort, direction])

  useEffect(() => {
    const timeout = window.setTimeout(load, 250)
    return () => window.clearTimeout(timeout)
  }, [load])

  const handleDuplicate = async (id: string) => {
    try {
      const result = await duplicateInvoice(id)
      setInvoices((current) => [result.invoice, ...current])
      toast({ title: 'Invoice duplicated', description: 'A new draft invoice is ready to edit.' })
    } catch (err) {
      toast({ title: 'Duplicate failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice(id)
      setInvoices((current) => current.filter((invoice) => invoice.id !== id))
      toast({ title: 'Invoice deleted', description: 'The invoice was removed from your history.' })
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Invoices</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your invoice history, drafts, and payment status.</p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/invoice"><Plus className="h-4 w-4" /> New Invoice</Link>
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice number, client, or company" className="pl-9" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus | 'all')} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            {statuses.map((value) => <option key={value} value={value}>{value === 'all' ? 'All Statuses' : value}</option>)}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="issueDate">Issue Date</option>
            <option value="dueDate">Due Date</option>
            <option value="total">Total</option>
            <option value="invoiceNumber">Invoice Number</option>
          </select>
          <Button type="button" variant="outline" size="icon" onClick={() => setDirection((value) => value === 'asc' ? 'desc' : 'asc')} aria-label="Toggle sort direction">
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <span>Invoice</span><span>Client</span><span>Status</span><span>Due Date</span><span>Total</span><span />
          </div>
          {loading ? <div className="p-10 text-center text-sm text-muted-foreground">Loading invoice history...</div> : invoices.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-4 font-medium text-foreground">No Invoices Found</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first invoice to start building your history.</p>
              <Button asChild className="mt-5"><Link href="/invoice">Create Invoice</Link></Button>
            </div>
          ) : invoices.map((invoice) => (
            <div key={invoice.id} className="grid gap-3 border-b border-border px-5 py-4 last:border-0 md:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4">
              <div><Link href={`/invoice?id=${invoice.id}`} className="font-medium text-primary hover:underline">{invoice.invoice_number}</Link><p className="text-xs text-muted-foreground">Issued {invoice.issue_date}</p></div>
              <div><p className="text-sm font-medium">{invoice.client || 'No Client'}</p><p className="text-xs text-muted-foreground">{invoice.company || '—'}</p></div>
              <Badge className={`w-fit border-0 ${statusClass(invoice.status)}`}>{invoice.status}</Badge>
              <span className="text-sm text-muted-foreground">{invoice.due_date || '—'}</span>
              <span className="text-sm font-semibold">{formatMoney(Number(invoice.total), invoice.currency)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${invoice.invoice_number}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link href={`/invoice?id=${invoice.id}`} className="cursor-pointer">Edit Invoice</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(invoice.id)} className="cursor-pointer"><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(invoice.id)} className="cursor-pointer text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}