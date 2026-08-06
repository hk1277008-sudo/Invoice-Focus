import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearch } from 'wouter'
import {
  ArrowUpRight, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Copy, FileText,
  Eye, MessageSquare, MoreHorizontal, Plus, Receipt, TrendingUp, Users, XCircle,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { deleteInvoice, duplicateInvoice, type InvoiceStatus } from '@/lib/invoices'
import { getDashboardOverview, type CurrencyAmount, type DashboardOverview } from '@/lib/dashboard'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrencyCode } from '@/components/invoice/currencies'

type Preset = 'today' | '7d' | '30d' | 'month' | 'year' | '12m' | 'custom'
const statusColors: Record<InvoiceStatus, string> = {
  Draft: '#94a3b8', Sent: '#3b82f6', Viewed: '#8b5cf6', 'Partially Paid': '#f59e0b',
  Paid: '#10b981', Overdue: '#f43f5e', Cancelled: '#cbd5e1',
}

function dateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getRange(preset: Preset, customStart: string, customEnd: string) {
  if (preset === 'custom') return { start: customStart || undefined, end: customEnd || undefined }
  const end = new Date()
  const start = new Date(end)
  if (preset === 'today') start.setHours(0, 0, 0, 0)
  if (preset === '7d') start.setDate(end.getDate() - 6)
  if (preset === '30d') start.setDate(end.getDate() - 29)
  if (preset === 'month') start.setDate(1)
  if (preset === 'year') { start.setMonth(0); start.setDate(1) }
  if (preset === '12m') start.setFullYear(end.getFullYear() - 1)
  return { start: dateString(start), end: dateString(end) }
}

function money(values: CurrencyAmount[]) {
  return values.length ? values.map(({ currency, amount }) => formatCurrencyCode(amount, currency)).join(' · ') : '—'
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
}

function statusClass(status: InvoiceStatus) {
  return status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : status === 'Overdue' ? 'bg-rose-50 text-rose-700' : status === 'Viewed' ? 'bg-violet-50 text-violet-700' : status === 'Partially Paid' ? 'bg-amber-50 text-amber-700' : status === 'Cancelled' ? 'bg-muted text-muted-foreground' : status === 'Draft' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'
}

function DashboardSkeleton() {
  return <div className="space-y-6 animate-pulse"><div className="h-24 rounded-xl bg-muted" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-28 rounded-xl bg-muted" />)}</div><div className="grid gap-6 lg:grid-cols-3"><div className="h-80 rounded-xl bg-muted lg:col-span-2" /><div className="h-80 rounded-xl bg-muted" /></div></div>
}

export default function DashboardPage() {
  const [preset, setPreset] = useState<Preset>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast } = useToast()
  const { user } = useAuth()
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false)
  const search = useSearch()
  const range = useMemo(() => getRange(preset, customStart, customEnd), [customEnd, customStart, preset])

  const load = useCallback(async () => {
    setLoading(true)
    try { setOverview(await getDashboardOverview(range)); setError('') }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load your dashboard') }
    finally { setLoading(false) }
  }, [range])

  useEffect(() => {
    void load()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [load])

  useEffect(() => {
    if (new URLSearchParams(search).get('section') !== 'invoices' || loading || !overview) return
    document.getElementById('invoices')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading, overview, search])

  useEffect(() => {
    if (!overview || !user || typeof window === 'undefined') return
    const key = `invoice-focus-feedback-prompt:${user.id}`
    if (window.localStorage.getItem(key)) return
    const daysSinceSignup = (Date.now() - new Date(user.created_at).getTime()) / 86_400_000
    if (overview.stats.totalInvoices >= 3 || daysSinceSignup >= 7) {
      window.localStorage.setItem(key, 'shown')
      setShowFeedbackPrompt(true)
    }
  }, [overview, user])

  const handleDuplicate = async (id: string) => {
    try { await duplicateInvoice(id); toast({ title: 'Invoice duplicated', description: 'A new draft invoice is ready.' }); void load() }
    catch (err) { toast({ title: 'Duplicate failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' }) }
  }
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this invoice? This action cannot be undone.')) return
    try { await deleteInvoice(id); toast({ title: 'Invoice deleted' }); void load() }
    catch (err) { toast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' }) }
  }

  return <DashboardLayout><div className="mx-auto max-w-[1600px] space-y-6">
     <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
       <div><p className="label-caps">Business overview</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Business Overview</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">Track your invoicing activity and business performance.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1"><CalendarDays className="ml-2 h-4 w-4 text-muted-foreground" /><select value={preset} onChange={(event) => setPreset(event.target.value as Preset)} className="h-8 bg-transparent px-2 text-sm outline-none"><option value="today">Today</option><option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="month">This Month</option><option value="year">This Year</option><option value="12m">Last 12 Months</option><option value="custom">Custom Range</option></select></div>
        <Button asChild className="gap-2"><Link href="/invoice"><Plus className="h-4 w-4" /> Create Invoice</Link></Button>
      </div>
    </div>
    {preset === 'custom' && <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"><div><label className="text-xs font-medium text-muted-foreground">From</label><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="mt-1 block h-9 rounded-md border border-input bg-background px-3 text-sm" /></div><div><label className="text-xs font-medium text-muted-foreground">To</label><input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="mt-1 block h-9 rounded-md border border-input bg-background px-3 text-sm" /></div></div>}
     {error && <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>Try again</Button></div>}
     {showFeedbackPrompt && <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-semibold">How is Invoice Focus working for you?</p><p className="mt-1 text-sm text-muted-foreground">A quick note helps us shape the next release.</p></div></div><div className="flex shrink-0 gap-2"><Button asChild size="sm"><Link href="/dashboard/feedback">Share feedback</Link></Button><Button variant="ghost" size="sm" onClick={() => setShowFeedbackPrompt(false)}>Not now</Button></div></div>}
    {loading && !overview ? <DashboardSkeleton /> : overview ? <DashboardContent overview={overview} onDuplicate={handleDuplicate} onDelete={handleDelete} /> : null}
  </div></DashboardLayout>
}

function DashboardContent({ overview, onDuplicate, onDelete }: { overview: DashboardOverview; onDuplicate: (id: string) => void; onDelete: (id: string) => void }) {
  const { stats } = overview
  const cards = [
    { label: 'Total Invoices', value: stats.totalInvoices, icon: FileText, tone: 'text-primary' },
    { label: 'Draft Invoices', value: stats.draftInvoices, icon: Clock3, tone: 'text-slate-500' },
    { label: 'Sent Invoices', value: stats.sentInvoices, icon: ArrowUpRight, tone: 'text-blue-500' },
    { label: 'Viewed Invoices', value: stats.viewedInvoices, icon: Eye, tone: 'text-violet-500' },
    { label: 'Partially Paid', value: stats.partiallyPaidInvoices, icon: CircleDollarSign, tone: 'text-amber-500' },
    { label: 'Paid Invoices', value: stats.paidInvoices, icon: CheckCircle2, tone: 'text-emerald-500' },
    { label: 'Overdue Invoices', value: stats.overdueInvoices, icon: XCircle, tone: 'text-rose-500' },
    { label: 'Total Revenue', value: money(stats.totalRevenue), icon: CircleDollarSign, tone: 'text-emerald-500' },
    { label: 'Outstanding Amount', value: money(stats.outstandingAmount), icon: TrendingUp, tone: 'text-amber-500' },
    { label: 'Total Clients', value: stats.totalClients, icon: Users, tone: 'text-violet-500' },
  ]
  const isEmpty = stats.totalInvoices === 0 && stats.totalClients === 0
  return <>{isEmpty ? <EmptyDashboard /> : <>
     <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <Card key={label} className="interactive-surface"><CardContent className="flex items-start justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/70"><Icon className={`h-4 w-4 ${tone}`} /></div></CardContent></Card>)}</div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><RevenueChart data={overview.revenue} /><StatusChart data={overview.statusDistribution} /></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"><RecentInvoices invoices={overview.recentInvoices} onDuplicate={onDuplicate} onDelete={onDelete} /><RecentClients clients={overview.recentClients} /></div>
    <RecentActivity items={overview.recentActivity} />
  </>}</>
}

function RecentActivity({ items }: { items: DashboardOverview['recentActivity'] }) {
  return <Card><CardHeader><CardTitle>Recent Activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">The latest changes across your invoices</p></CardHeader><CardContent>{items.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <Link key={item.id} href={`/invoice/${item.invoice_id}`} className="rounded-lg border p-3 transition-colors hover:bg-muted/40"><p className="text-sm font-medium">{item.description}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{item.action.replaceAll('_', ' ')} · {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(item.created_at))}</p></Link>)}</div> : <p className="text-sm text-muted-foreground">No recent activity yet.</p>}</CardContent></Card>
}

function RevenueChart({ data }: { data: DashboardOverview['revenue'] }) {
  const currencies = [...new Set(data.map((item) => item.currency))].sort()
  return <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Revenue Overview</CardTitle><p className="mt-1 text-sm text-muted-foreground">Paid revenue in the selected period, grouped by currency</p></div><TrendingUp className="h-5 w-5 text-emerald-500" /></CardHeader><CardContent>{data.length ? <div className="space-y-5">{currencies.map((currency) => { const points = data.filter((item) => item.currency === currency); return <div key={currency}><p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{currency}</p><div className="h-[220px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><defs><linearGradient id={`revenueFill-${currency}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={28} /><YAxis tickFormatter={(value) => formatCurrencyCode(Number(value), currency)} tickLine={false} axisLine={false} width={78} /><Tooltip labelFormatter={(value) => shortDate(String(value))} formatter={(value) => [formatCurrencyCode(Number(value), currency), 'Revenue']} /><Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.5} fill={`url(#revenueFill-${currency})`} /></AreaChart></ResponsiveContainer></div></div> })}</div> : <div className="h-[280px]"><ChartEmpty label="No paid revenue in this period" /></div>}</CardContent></Card>
}

function StatusChart({ data }: { data: DashboardOverview['statusDistribution'] }) {
  return <Card><CardHeader><CardTitle>Invoice Status</CardTitle><p className="mt-1 text-sm text-muted-foreground">Distribution across the selected period</p></CardHeader><CardContent><div className="h-[280px]">{data.some((item) => item.count > 0) ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="count" nameKey="status" innerRadius={66} outerRadius={94} paddingAngle={3}>{data.map((item) => <Cell key={item.status} fill={statusColors[item.status]} />)}</Pie><Tooltip /><text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-semibold">{data.reduce((sum, item) => sum + item.count, 0)}</text><text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">Invoices</text></PieChart></ResponsiveContainer> : <ChartEmpty label="No invoices in this period" />}</div><div className="mt-2 grid grid-cols-2 gap-2">{data.map((item) => <div key={item.status} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors[item.status] }} />{item.status}</span><span className="font-medium">{item.count}</span></div>)}</div></CardContent></Card>
}

function ChartEmpty({ label }: { label: string }) { return <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground"><Receipt className="h-5 w-5 text-muted-foreground/60" /><span>{label}</span></div> }

function RecentInvoices({ invoices, onDuplicate, onDelete }: { invoices: DashboardOverview['recentInvoices']; onDuplicate: (id: string) => void; onDelete: (id: string) => void }) {
  return <Card id="invoices"><CardHeader><div><CardTitle>Recent Invoices</CardTitle><p className="mt-1 text-sm text-muted-foreground">Latest activity from your invoice history</p></div></CardHeader><CardContent className="p-0">{invoices.length ? <div className="divide-y divide-border">{invoices.map((invoice) => <div key={invoice.id} className="flex items-center gap-3 px-5 py-4"><Receipt className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" /><div className="min-w-0 flex-1"><Link href={`/invoice/${invoice.id}`} className="font-medium text-primary hover:underline">{invoice.invoice_number}</Link><p className="truncate text-xs text-muted-foreground">{invoice.client || 'No Client'} · {shortDate(invoice.issue_date)}</p></div><Badge className={`hidden border-0 sm:inline-flex ${statusClass(invoice.status)}`}>{invoice.status}</Badge><span className="text-sm font-semibold">{formatCurrencyCode(Number(invoice.total), invoice.currency)}</span><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${invoice.invoice_number}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/invoice/${invoice.id}`}>Open Details</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href={`/invoice?id=${invoice.id}`}>Edit Invoice</Link></DropdownMenuItem><DropdownMenuItem onClick={() => onDuplicate(invoice.id)}><Copy className="mr-2 h-4 w-4" />Duplicate</DropdownMenuItem><DropdownMenuItem onClick={() => onDelete(invoice.id)} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>)}</div> : <div className="p-8 text-center text-sm text-muted-foreground">No invoices in this period.</div>}</CardContent></Card>
}

function RecentClients({ clients }: { clients: DashboardOverview['recentClients'] }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Recent Clients</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your newest client relationships</p></div><Button asChild variant="ghost" size="sm"><Link href="/dashboard/clients">View All <ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button></CardHeader><CardContent className="p-0">{clients.length ? <div className="divide-y divide-border">{clients.map((client) => <Link key={client.id} href="/dashboard/clients" className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{client.full_name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{client.full_name}</p><p className="truncate text-xs text-muted-foreground">{client.company_name || client.email || 'Individual client'}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">{client.invoice_count} invoice{client.invoice_count === 1 ? '' : 's'}</p><p className="text-sm font-semibold">{money(client.outstanding)}</p></div></Link>)}</div> : <div className="p-8 text-center text-sm text-muted-foreground">No clients in this period.</div>}</CardContent></Card>
}

function EmptyDashboard() {
  return <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-6 w-6" /></div><h2 className="mt-5 text-xl font-semibold">Welcome to your business dashboard</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Create your first invoice or add a client to start tracking your business activity.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><Link href="/invoice"><Plus className="mr-2 h-4 w-4" />Create First Invoice</Link></Button><Button asChild variant="outline"><Link href="/dashboard/clients"><Users className="mr-2 h-4 w-4" />Add Client</Link></Button></div></div>
}