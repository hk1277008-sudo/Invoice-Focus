import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Building2, Mail, MoreHorizontal, Phone, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { Link } from 'wouter'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createClient, deleteClient, getClient, listClients, updateClient, type ClientInput, type ClientRecord } from '@/lib/clients'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatCurrencyCode } from '@/components/invoice/currencies'
import type { CurrencyAmount } from '@/lib/dashboard'

const emptyForm: ClientInput = { fullName: '', companyName: '', email: '', phone: '', billingAddress: '', city: '', state: '', postalCode: '', country: '', taxId: '', notes: '' }

function toForm(client: ClientRecord): ClientInput {
  return { fullName: client.full_name, companyName: client.company_name, email: client.email, phone: client.phone, billingAddress: client.billing_address, city: client.city, state: client.state, postalCode: client.postal_code, country: client.country, taxId: client.tax_id, notes: client.notes }
}

function money(values: CurrencyAmount[]) {
  return values.length ? values.map(({ currency, amount }) => formatCurrencyCode(amount, currency)).join(' · ') : '—'
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recent')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClientRecord | null>(null)
  const [form, setForm] = useState<ClientInput>(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ClientRecord | null>(null)
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getClient>> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try { setClients((await listClients({ search, sort, direction })).clients); setError('') }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load clients') }
    finally { setLoading(false) }
  }, [search, sort, direction])

  useEffect(() => { const timer = window.setTimeout(load, 200); return () => window.clearTimeout(timer) }, [load])

  const validation = useMemo(() => ({
    fullName: submitted && !form.fullName.trim() ? 'Full name is required.' : '',
    email: submitted && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Enter a valid email address.' : '',
  }), [form.email, form.fullName, submitted])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setSubmitted(false); setDialogOpen(true) }
  const openEdit = (client: ClientRecord) => { setEditing(client); setForm(toForm(client)); setSubmitted(false); setDialogOpen(true) }
  const updateField = (field: keyof ClientInput, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const save = async () => {
    setSubmitted(true)
    if (validation.fullName || validation.email) return
    setSaving(true)
    try {
      const result = editing ? await updateClient(editing.id, form) : await createClient(form)
      setClients((current) => editing ? current.map((client) => client.id === result.client.id ? result.client : client) : [result.client, ...current])
      setDialogOpen(false)
      toast({ title: editing ? 'Client updated' : 'Client added', description: `${result.client.full_name} is ready to use on invoices.` })
    } catch (err) { toast({ title: 'Could not save client', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const openDetail = async (client: ClientRecord) => {
    setDetailLoading(true)
    try { setDetail(await getClient(client.id)) }
    catch (err) { toast({ title: 'Could not load client', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' }) }
    finally { setDetailLoading(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try { await deleteClient(deleteTarget.id); setClients((current) => current.filter((client) => client.id !== deleteTarget.id)); setDeleteTarget(null); toast({ title: 'Client deleted' }) }
    catch (err) { toast({ title: 'Could not delete client', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' }) }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="label-caps">Client directory</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Clients</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">Keep client details organized and ready for every invoice.</p></div>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Client</Button>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company, email, or phone" className="pl-9" /></div>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="recent">Recently Added</option><option value="name">Name (A–Z)</option><option value="company">Company</option><option value="updated">Recently Updated</option></select>
          <Button variant="outline" size="icon" onClick={() => setDirection((value) => value === 'asc' ? 'desc' : 'asc')} aria-label="Toggle sort direction"><ArrowDownUp className="h-4 w-4" /></Button>
        </div>
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
        {loading ? <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">Loading clients...</div> : clients.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 text-center"><UserRound className="h-9 w-9 text-muted-foreground/50" /><h2 className="mt-4 font-medium">No Clients Yet</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Add your first client to quickly reuse their information on future invoices.</p><Button onClick={openCreate} className="mt-5">Add Your First Client</Button></div>
        ) : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{clients.map((client) => (
          <Card key={client.id} className="interactive-surface cursor-pointer" onClick={() => openDetail(client)}><CardContent className="p-5">
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{client.full_name.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><h2 className="truncate font-semibold">{client.full_name}</h2><p className="truncate text-sm text-muted-foreground">{client.company_name || 'Individual client'}</p></div></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={(event) => { event.stopPropagation(); openEdit(client) }}>Edit Client</DropdownMenuItem><DropdownMenuItem onClick={(event) => { event.stopPropagation(); setDeleteTarget(client) }} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete Client</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
            <div className="mt-5 space-y-2 text-sm text-muted-foreground">{client.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{client.email}</p>}{client.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{client.phone}</p>}{client.company_name && <p className="flex items-center gap-2 truncate"><Building2 className="h-3.5 w-3.5 shrink-0" />{client.company_name}</p>}</div>
          </CardContent></Card>
        ))}</div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editing ? 'Edit Client' : 'Add New Client'}</DialogTitle><DialogDescription>Save contact and billing details for faster invoice creation.</DialogDescription></DialogHeader><div className="grid max-h-[60vh] gap-4 overflow-y-auto px-1 sm:grid-cols-2">
        <Field label="Full Name" required error={validation.fullName} value={form.fullName} onChange={(value) => updateField('fullName', value)} />
        <Field label="Company Name" value={form.companyName} onChange={(value) => updateField('companyName', value)} />
        <Field label="Email Address" type="email" error={validation.email} value={form.email} onChange={(value) => updateField('email', value)} />
        <Field label="Phone Number" value={form.phone} onChange={(value) => updateField('phone', value)} />
        <Field label="Billing Address" className="sm:col-span-2" value={form.billingAddress} onChange={(value) => updateField('billingAddress', value)} multiline />
        <Field label="City" value={form.city} onChange={(value) => updateField('city', value)} /><Field label="State / Province" value={form.state} onChange={(value) => updateField('state', value)} /><Field label="Postal Code" value={form.postalCode} onChange={(value) => updateField('postalCode', value)} /><Field label="Country" value={form.country} onChange={(value) => updateField('country', value)} /><Field label="Tax ID / VAT Number" value={form.taxId} onChange={(value) => updateField('taxId', value)} /><Field label="Notes" className="sm:col-span-2" value={form.notes} onChange={(value) => updateField('notes', value)} multiline />
       </div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Applying...' : editing ? 'Save Changes' : 'Add Client'}</Button></DialogFooter></DialogContent></Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Client?</AlertDialogTitle><AlertDialogDescription>This permanently removes {deleteTarget?.full_name} from your client list. Existing invoices remain unchanged.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Client</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{detail?.client.full_name}</DialogTitle><DialogDescription>{detail?.client.company_name || 'Client details'}</DialogDescription></DialogHeader>{detailLoading ? <p className="p-6 text-center text-sm text-muted-foreground">Loading details...</p> : detail && <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/15 bg-primary/[0.03] px-3 py-2 text-xs"><span>Reporting totals use {detail.businessCurrency}</span>{detail.excludedCurrencies.length > 0 && <span className="text-muted-foreground">Excluded: {detail.excludedCurrencies.join(', ')}</span>}</div><div className="grid gap-3 sm:grid-cols-3">{[['Invoices', detail.stats.invoiceCount], ['Invoiced', money(detail.stats.totalInvoiced)], ['Outstanding', money(detail.stats.outstanding)]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div><div className="grid gap-4 text-sm sm:grid-cols-2"><div><p className="font-medium">Contact Information</p><p className="mt-2 text-muted-foreground">{detail.client.email || 'No email'}<br />{detail.client.phone || 'No phone'}</p></div><div><p className="font-medium">Billing Address</p><p className="mt-2 text-muted-foreground">{[detail.client.billing_address, detail.client.city, detail.client.state, detail.client.postal_code, detail.client.country].filter(Boolean).join(', ') || 'No billing address'}</p></div></div><div><p className="font-medium">Notes</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{detail.client.notes || 'No notes'}</p></div><div><p className="font-medium">Recent Invoices</p>{detail.recentInvoices.length ? <div className="mt-2 divide-y rounded-lg border">{detail.recentInvoices.map((invoice) => <Link key={invoice.id} href={`/invoice?id=${invoice.id}`} className="flex items-center justify-between p-3 text-sm hover:bg-muted/50"><span className="text-primary">{invoice.invoice_number}</span><span>{formatCurrencyCode(Number(invoice.total), invoice.currency)}</span></Link>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No invoices yet.</p>}</div></div>}</DialogContent></Dialog>
    </DashboardLayout>
  )
}

function Field({ label, value, onChange, error, className, type = 'text', required, multiline }: { label: string; value: string; onChange: (value: string) => void; error?: string; className?: string; type?: string; required?: boolean; multiline?: boolean }) {
  return <div className={className}><Label>{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>{multiline ? <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5" rows={3} /> : <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5" />}{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</div>
}