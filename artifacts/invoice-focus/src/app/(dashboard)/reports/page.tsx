import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, CalendarDays, CheckCircle2, CircleDollarSign, Download, FileBarChart, FileText, Sparkles, TrendingUp, Users, WalletCards } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Link } from 'wouter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip as Hint, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getReportsOverview, type CurrencyAmount, type CurrencyRate, type ReportPeriod, type ReportsOverview } from '@/lib/reports'
import { formatCurrencyCode } from '@/components/invoice/currencies'

type Preset = 'today' | '7d' | '30d' | '90d' | 'month' | 'lastMonth' | 'year' | 'custom'
const statusColors: Record<string, string> = { Draft: '#94a3b8', Sent: '#3b82f6', Viewed: '#8b5cf6', 'Partially Paid': '#f59e0b', Paid: '#10b981', Overdue: '#f43f5e', Cancelled: '#cbd5e1' }
const money = (values: CurrencyAmount[]) => values.length ? values.map(({ currency, amount }) => formatCurrencyCode(amount, currency)).join(' · ') : '—'
const rates = (values: CurrencyRate[]) => values.length ? values.map(({ currency, value }) => `${currency} ${value.toFixed(1)}%`).join(' · ') : '—'
const dateString = (date: Date) => date.toISOString().slice(0, 10)

function rangeFor(preset: Preset, customStart: string, customEnd: string) {
  if (preset === 'custom') return { start: customStart || undefined, end: customEnd || undefined }
  const end = new Date(); const start = new Date(end)
  if (preset === 'today') start.setHours(0, 0, 0, 0)
  if (preset === '7d') start.setDate(end.getDate() - 6)
  if (preset === '30d') start.setDate(end.getDate() - 29)
  if (preset === '90d') start.setDate(end.getDate() - 89)
  if (preset === 'month') start.setDate(1)
  if (preset === 'lastMonth') { start.setMonth(start.getMonth() - 1); start.setDate(1); end.setDate(0) }
  if (preset === 'year') { start.setMonth(0); start.setDate(1) }
  return { start: dateString(start), end: dateString(end) }
}

function ReportsSkeleton() {
  return <div className="space-y-6 animate-pulse"><div className="h-20 rounded-xl bg-muted" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div></div>
}

function exportCsv(report: ReportsOverview) {
  const rows = [
    ['Metric', 'Value'],
    ['Business Currency', report.businessCurrency],
    ['Total Revenue', money(report.summary.totalRevenue)],
    ['Outstanding Revenue', money(report.summary.outstandingRevenue)],
    ['Paid Revenue', money(report.summary.paidRevenue)],
    ['Overdue Revenue', money(report.summary.overdueRevenue)],
    ['Total Invoices', report.summary.totalInvoices],
    ['Paid Invoices', report.summary.paidInvoices],
    ['Outstanding Invoices', report.summary.outstandingInvoices],
    ['Overdue Invoices', report.summary.overdueInvoices],
    ['Active Clients', report.summary.activeClients],
    ['Average Invoice Value', money(report.summary.averageInvoiceValue)],
    ['Average Client Revenue', money(report.summary.averageClientRevenue)],
    ['New Clients', report.summary.newClients],
    ['Returning Clients', report.summary.returningClients],
    ['Collection Rate', rates(report.payments.collectionRate)],
    ['Outstanding Balance', money(report.payments.outstandingBalance)],
    ['Paid Amount', money(report.payments.paidAmount)],
    ['Partial Payments', report.payments.partialPayments],
    ['Monthly Revenue', money(report.kpis.monthlyRevenue)],
    ['Annual Revenue', money(report.kpis.annualRevenue)],
    ['Average Payment Time', report.kpis.averagePaymentTime],
    ['Invoice Conversion Rate', report.kpis.invoiceConversionRate],
    ['Collection Percentage', rates(report.kpis.collectionPercentage)],
    ['Client Growth', report.kpis.clientGrowth],
    ['Revenue Growth', rates(report.kpis.revenueGrowth)],
    [],
     ['Revenue Period', 'Currency', 'Amount'],
    ...report.revenue.map((item) => [item.label, item.currency, item.value]),
    [],
     ['Monthly Collection Period', 'Currency', 'Amount'],
    ...report.payments.monthlyCollections.map((item) => [item.label, item.currency, item.value]),
    [],
    ['Invoice Status', 'Count'],
    ...report.invoiceStatus.map((item) => [item.status, item.count]),
    [],
    ['Client', 'Revenue', 'Invoices', 'Paid Invoices'],
    ...report.topClients.map((client) => [client.name, money(client.revenue), client.invoices, client.paidInvoices]),
  ]
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = `invoicefocus-report-${dateString(new Date())}.csv`; link.click(); URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const [preset, setPreset] = useState<Preset>('30d'); const [period, setPeriod] = useState<ReportPeriod>('month')
  const [customStart, setCustomStart] = useState(''); const [customEnd, setCustomEnd] = useState('')
  const [report, setReport] = useState<ReportsOverview | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const range = useMemo(() => rangeFor(preset, customStart, customEnd), [preset, customEnd, customStart])
  const load = useCallback(async () => { setLoading(true); try { setReport(await getReportsOverview({ ...range, period })); setError('') } catch (err) { setError(err instanceof Error ? err.message : 'Could not load reports') } finally { setLoading(false) } }, [range, period])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const refresh = () => void load()
    window.addEventListener('invoicefocus:business-currency-changed', refresh)
    return () => window.removeEventListener('invoicefocus:business-currency-changed', refresh)
  }, [load])
  return <DashboardLayout><div className="reports-print-root mx-auto max-w-[1600px] space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
       <div><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><h1 className="font-display text-2xl font-semibold tracking-tight">Reports & Insights</h1></div><p className="mt-1 text-sm text-muted-foreground">Understand your revenue, collections, clients, and invoice performance in your business currency.</p></div>
      <div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-2 rounded-lg border bg-card p-1"><CalendarDays className="ml-2 h-4 w-4 text-muted-foreground" /><select aria-label="Date range" value={preset} onChange={(e) => setPreset(e.target.value as Preset)} className="h-8 bg-transparent px-2 text-sm outline-none"><option value="today">Today</option><option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="90d">Last 90 Days</option><option value="month">This Month</option><option value="lastMonth">Last Month</option><option value="year">This Year</option><option value="custom">Custom Range</option></select></div><Button variant="outline" onClick={() => report && exportCsv(report)} disabled={!report} className="gap-2"><Download className="h-4 w-4" />CSV</Button><Button variant="outline" onClick={() => window.print()} className="gap-2"><FileText className="h-4 w-4" />PDF</Button></div>
    </div>
    {preset === 'custom' && <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4"><label className="text-xs font-medium text-muted-foreground">From<input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="mt-1 block h-9 rounded-md border bg-background px-3 text-sm" /></label><label className="text-xs font-medium text-muted-foreground">To<input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="mt-1 block h-9 rounded-md border bg-background px-3 text-sm" /></label></div>}
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
     {loading && !report ? <ReportsSkeleton /> : report ? <><div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/15 bg-primary/[0.03] px-4 py-3 text-sm"><span>Business reporting currency</span><span className="font-semibold text-primary">{report.businessCurrency}</span>{report.excludedCurrencies.length > 0 && <span className="text-xs text-muted-foreground">Other currencies excluded: {report.excludedCurrencies.join(', ')}</span>}</div><ReportContent report={report} period={period} setPeriod={setPeriod} /></> : null}
  </div></DashboardLayout>
}

function ReportContent({ report, period, setPeriod }: { report: ReportsOverview; period: ReportPeriod; setPeriod: (period: ReportPeriod) => void }) {
  const { summary, kpis, payments } = report; const empty = summary.totalInvoices === 0
  const cards = [{ label: 'Total Revenue', value: money(summary.totalRevenue), icon: CircleDollarSign, tone: 'text-emerald-500' }, { label: 'Outstanding Revenue', value: money(summary.outstandingRevenue), icon: WalletCards, tone: 'text-amber-500' }, { label: 'Paid Revenue', value: money(summary.paidRevenue), icon: CheckCircle2, tone: 'text-emerald-500' }, { label: 'Overdue Revenue', value: money(summary.overdueRevenue), icon: TrendingUp, tone: 'text-rose-500' }, { label: 'Average Invoice', value: money(summary.averageInvoiceValue), icon: FileBarChart, tone: 'text-primary' }, { label: 'Total Invoices', value: summary.totalInvoices, icon: FileText, tone: 'text-primary' }, { label: 'Paid Invoices', value: summary.paidInvoices, icon: CheckCircle2, tone: 'text-emerald-500' }, { label: 'Outstanding Invoices', value: summary.outstandingInvoices, icon: WalletCards, tone: 'text-amber-500' }, { label: 'Overdue Invoices', value: summary.overdueInvoices, icon: TrendingUp, tone: 'text-rose-500' }, { label: 'Active Clients', value: summary.activeClients, icon: Users, tone: 'text-violet-500' }]
  return <>{empty ? <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] px-6 py-16 text-center"><Sparkles className="mx-auto h-9 w-9 text-primary" /><h2 className="mt-5 font-display text-xl font-semibold">No revenue yet.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Create your first invoice to start tracking revenue, collections, and business insights.</p><Button asChild className="mt-6"><Link href="/invoice">Create First Invoice</Link></Button></div> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(({ label, value, icon: Icon, tone }) => <Card key={label}><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p></div><Icon className={`h-5 w-5 ${tone}`} /></CardContent></Card>)}</div><div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]"><RevenuePanel report={report} period={period} setPeriod={setPeriod} /><StatusPanel report={report} /></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"><KpiPanel kpis={kpis} payments={payments} summary={summary} /><ClientsPanel clients={report.topClients} /></div></>}</>
}

function RevenuePanel({ report, period, setPeriod }: { report: ReportsOverview; period: ReportPeriod; setPeriod: (period: ReportPeriod) => void }) {
  const currencies = [...new Set(report.revenue.map((item) => item.currency))].sort()
  return <Card><CardHeader className="flex flex-row items-start justify-between"><div><CardTitle>Revenue Analytics</CardTitle><p className="mt-1 text-sm text-muted-foreground">Collected revenue in {report.businessCurrency} for the selected date range.</p></div><div className="flex rounded-lg border p-1 text-xs"><button className={`rounded px-2 py-1 ${period === 'week' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setPeriod('week')}>Week</button><button className={`rounded px-2 py-1 ${period === 'month' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setPeriod('month')}>Month</button><button className={`rounded px-2 py-1 ${period === 'year' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setPeriod('year')}>Year</button></div></CardHeader><CardContent>{report.revenue.length ? <div className="space-y-5">{currencies.map((currency) => { const points = report.revenue.filter((item) => item.currency === currency); return <div key={currency}><p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{currency}</p><div className="h-[220px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><defs><linearGradient id={`reportsRevenue-${currency}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1c51d8" stopOpacity={0.26} /><stop offset="95%" stopColor="#1c51d8" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} /><YAxis tickFormatter={(value) => formatCurrencyCode(Number(value), currency)} tickLine={false} axisLine={false} width={78} /><Tooltip formatter={(value) => [formatCurrencyCode(Number(value), currency), 'Revenue']} /><Area type="monotone" dataKey="value" stroke="#1c51d8" strokeWidth={2.5} fill={`url(#reportsRevenue-${currency})`} /></AreaChart></ResponsiveContainer></div></div> })}</div> : <div className="h-[310px]"><ChartEmpty label="No revenue in this period." /></div>}</CardContent></Card>
}

function StatusPanel({ report }: { report: ReportsOverview }) {
  return <Card><CardHeader><CardTitle>Invoice Performance</CardTitle><p className="mt-1 text-sm text-muted-foreground">Status distribution across your invoices.</p></CardHeader><CardContent><div className="h-[250px]">{report.invoiceStatus.some((item) => item.count) ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={report.invoiceStatus} dataKey="count" nameKey="status" innerRadius={60} outerRadius={88} paddingAngle={3}>{report.invoiceStatus.map((item) => <Cell key={item.status} fill={statusColors[item.status]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <ChartEmpty label="No invoices in this period." />}</div><div className="grid grid-cols-2 gap-2">{report.invoiceStatus.map((item) => <div key={item.status} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors[item.status] }} />{item.status}</span><span className="font-medium">{item.count}</span></div>)}</div></CardContent></Card>
}

function KpiPanel({ kpis, payments, summary }: { kpis: ReportsOverview['kpis']; payments: ReportsOverview['payments']; summary: ReportsOverview['summary'] }) {
  const items = [['Monthly Revenue', money(kpis.monthlyRevenue), 'Collected this month'], ['Annual Revenue', money(kpis.annualRevenue), 'Collected in selected range'], ['Collection Rate', rates(payments.collectionRate), 'Paid against billed in the business currency'], ['Conversion Rate', `${kpis.invoiceConversionRate.toFixed(1)}%`, 'Invoices sent beyond draft'], ['Avg. Payment Time', `${Math.round(kpis.averagePaymentTime)} days`, 'Based on invoice issue to payment dates'], ['Client Growth', `+${kpis.clientGrowth}`, 'New clients in range']]
  const clientItems = [['Average Client Revenue', money(summary.averageClientRevenue), 'Average collected revenue per active client'], ['New Clients', String(summary.newClients), 'New clients in the selected range'], ['Returning Clients', String(summary.returningClients), 'Clients with repeat invoice activity']]
  return <Card><CardHeader><CardTitle>Executive KPIs</CardTitle><p className="mt-1 text-sm text-muted-foreground">Signals to help you make better billing decisions.</p></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{[...items, ['Revenue Growth', rates(kpis.revenueGrowth), 'Compared with the previous matching range in the business currency'], ['Collection Percentage', rates(kpis.collectionPercentage), 'Paid amount against billed in the business currency'], ...clientItems].map(([label, value, hint]) => <Hint key={label}><TooltipTrigger asChild><div className="rounded-lg border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p></div></TooltipTrigger><TooltipContent>{hint}</TooltipContent></Hint>)}</CardContent></Card>
}

function ClientsPanel({ clients }: { clients: ReportsOverview['topClients'] }) {
  return <Card><CardHeader><CardTitle>Top Clients</CardTitle><p className="mt-1 text-sm text-muted-foreground">Highest paying and most active clients.</p></CardHeader><CardContent>{clients.length ? <div className="space-y-3">{clients.map((client, index) => <div key={`${client.name}-${index}`} className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{client.name}</p><p className="text-xs text-muted-foreground">{client.invoices} invoice{client.invoices === 1 ? '' : 's'} · {client.paidInvoices} paid</p></div><p className="text-sm font-semibold">{money(client.revenue)}</p></div>)}</div> : <ChartEmpty label="No client revenue yet." />}</CardContent></Card>
}

function ChartEmpty({ label }: { label: string }) { return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{label}</div> }