import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, MoreHorizontal, ArrowDownUp, Clock, Calendar, RefreshCcw, PauseCircle, PlayCircle, Copy, Trash2 } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { DashboardLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  listRecurringInvoices,
  pauseRecurringInvoice,
  resumeRecurringInvoice,
  cancelRecurringInvoice,
  duplicateRecurringInvoice,
  deleteRecurringInvoice,
  type RecurringInvoice,
} from '@/lib/recurring-invoices'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import { calculateInvoiceTotals } from '@/components/invoice/utils'

function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
}

function formatScheduleDate(value: string | null, timezone: string, withTime = false) {
  if (!value) return 'N/A'
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone || 'UTC',
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
  }).format(new Date(withTime ? value : `${value.slice(0, 10)}T12:00:00Z`))
}

function StatusBadge({ status }: { status: RecurringInvoice['status'] }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25">Active</Badge>
    case 'paused':
      return <Badge variant="secondary" className="bg-orange-500/15 text-orange-600 hover:bg-orange-500/25">Paused</Badge>
    case 'completed':
      return <Badge variant="outline" className="text-muted-foreground">Completed</Badge>
    case 'cancelled':
      return <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/25">Cancelled</Badge>
    default:
      return null
  }
}

export default function RecurringInvoicesPage() {
  const [, navigate] = useLocation()

  const [invoices, setInvoices] = useState<RecurringInvoice[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const [frequency, setFrequency] = useState<string>('all')
  const [sort, setSort] = useState('created_at')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const [deleteTarget, setDeleteTarget] = useState<RecurringInvoice | null>(null)
  const [cancelTarget, setCancelTarget] = useState<RecurringInvoice | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listRecurringInvoices({ search, status: status as any, frequency: frequency as any, sort, direction })
      setInvoices(res.recurringInvoices)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load recurring invoices')
    } finally {
      setLoading(false)
    }
  }, [search, status, frequency, sort, direction])

  useEffect(() => {
    const timer = window.setTimeout(load, 200)
    return () => window.clearTimeout(timer)
  }, [load])

  const handlePause = async (id: string) => {
    try {
      await pauseRecurringInvoice(id)
      toast({ title: 'Invoice paused' })
      load()
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' })
    }
  }

  const handleResume = async (id: string) => {
    try {
      await resumeRecurringInvoice(id)
      toast({ title: 'Invoice resumed' })
      load()
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' })
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelRecurringInvoice(cancelTarget.id)
      toast({ title: 'Recurring invoice cancelled' })
      load()
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setCancelTarget(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteRecurringInvoice(deleteTarget.id)
      toast({ title: 'Recurring invoice deleted' })
      load()
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const { recurringInvoice } = await duplicateRecurringInvoice(id)
      toast({ title: 'Duplicated successfully' })
      navigate(`/dashboard/recurring/${recurringInvoice.id}`)
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
               <p className="label-caps">Automated billing</p>
               <h1 className="mt-2 text-2xl font-semibold tracking-tight">Recurring Invoices</h1>
              <p className="mt-1 text-sm text-muted-foreground">Automate your regular billing cycles.</p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/dashboard/recurring/new">
                <Plus className="h-4 w-4" /> New Schedule
              </Link>
            </Button>
          </div>

           <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search client or amount"
                className="pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Frequencies</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="created_at">Recently Created</option>
              <option value="next_run_date">Next Run Date</option>
              <option value="client_name">Client Name</option>
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDirection((value) => (value === 'asc' ? 'desc' : 'asc'))}
              aria-label="Toggle sort direction"
            >
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </div>

          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

          {loading ? (
             <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
              Loading recurring invoices...
            </div>
          ) : invoices.length === 0 ? (
             <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <RefreshCcw className="h-9 w-9 text-muted-foreground/50" />
              <h2 className="mt-4 font-medium">No Recurring Invoices</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Set up automated billing for your regular clients and save time on administrative work.
              </p>
              <Button asChild className="mt-5">
                <Link href="/dashboard/recurring/new">Create First Schedule</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {invoices.map((inv) => {
                const total = calculateInvoiceTotals(inv.template_data.items).grandTotal
                const currency = inv.template_data.details.currency || 'USD'

                return (
                   <Card key={inv.id} className="interactive-surface">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-lg">{inv.client_name}</h2>
                          <div className="mt-1 flex items-center gap-2">
                            <StatusBadge status={inv.status} />
                            <span className="text-sm font-medium text-foreground">{money(total, currency)}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/recurring/${inv.id}`}>Edit Schedule</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(inv.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {inv.status === 'active' && (
                              <DropdownMenuItem onClick={() => handlePause(inv.id)}>
                                <PauseCircle className="mr-2 h-4 w-4" /> Pause
                              </DropdownMenuItem>
                            )}
                            {inv.status === 'paused' && (
                              <DropdownMenuItem onClick={() => handleResume(inv.id)}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Resume
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {inv.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => setCancelTarget(inv)} className="text-destructive focus:text-destructive">
                                Cancel Schedule
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteTarget(inv)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <RefreshCcw className="h-3.5 w-3.5 shrink-0" />
                          <span className="capitalize">{inv.frequency}</span>
                          {inv.interval_count > 1 && ` (Every ${inv.interval_count})`}
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          Next run: {formatScheduleDate(inv.next_run_date, inv.timezone)}
                        </p>
                        {inv.last_generated_at && (
                          <p className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            Last generated: {formatScheduleDate(inv.last_generated_at, inv.timezone, true)}
                          </p>
                        )}
                        <p className="mt-2 text-xs">Generated {inv.generated_invoice_count} invoice{inv.generated_invoice_count !== 1 ? 's' : ''} total.</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Recurring Invoice?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the schedule for {deleteTarget?.client_name}. Any invoices already generated will remain unaffected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Schedule?</AlertDialogTitle>
                <AlertDialogDescription>
                   This sets the schedule for {cancelTarget?.client_name} to cancelled. It will no longer generate invoices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirm Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
