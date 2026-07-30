import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Ban, Bell, CheckCircle2, Clock3, Copy, CreditCard, Download, Edit3, Link2, Mail, MoreHorizontal, Send, Trash2, Wallet } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { DashboardLayout } from '@/app/(dashboard)/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { deleteInvoice, deletePayment, duplicateInvoice, getInvoiceDetails, recordPayment, scheduleReminder, sendInvoice, sendReminder, transitionInvoice, updatePayment, type ActivityRecord, type EmailEventRecord, type InvoiceRecord, type InvoiceStatus, type PaymentRecord, type ReminderRecord } from '@/lib/invoices'
import { format } from 'date-fns'
import { createShareToken, listShareTokens, regenerateShareToken, updateShareToken, type ShareTokenRecord } from '@/lib/share'
import { validateInvoice } from './useInvoiceValidation'

const statuses = ['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'] as const
const statusStyle: Record<typeof statuses[number], string> = {
  Draft: 'bg-slate-100 text-slate-700', Sent: 'bg-blue-100 text-blue-700', Viewed: 'bg-violet-100 text-violet-700',
  'Partially Paid': 'bg-amber-100 text-amber-700', Paid: 'bg-emerald-100 text-emerald-700',
  Overdue: 'bg-rose-100 text-rose-700', Cancelled: 'bg-muted text-muted-foreground',
}
const actions: Record<typeof statuses[number], typeof statuses[number][]> = {
  Draft: ['Sent', 'Cancelled'], Sent: ['Viewed', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'], Viewed: ['Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
  'Partially Paid': ['Paid', 'Cancelled'], Paid: ['Sent', 'Cancelled'], Overdue: ['Cancelled'], Cancelled: [],
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
}
function dateTime(value: string) {
  return format(new Date(value), 'MMM d, yyyy · h:mm a')
}

export default function InvoiceDetailsPage({ id }: { id: string }) {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [data, setData] = useState<{ invoice: InvoiceRecord; payments: PaymentRecord[]; activity: ActivityRecord[]; emails: EmailEventRecord[]; reminders: ReminderRecord[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<'send' | 'payment' | 'reminder' | 'manualReminder' | null>(null)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [personalMessage, setPersonalMessage] = useState('')
  const [payment, setPayment] = useState({ amount: '', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'Bank transfer', referenceNumber: '', notes: '' })
  const [reminder, setReminder] = useState({ triggerType: 'before_3_days' as ReminderRecord['trigger_type'], enabled: true, recipientEmail: '', subject: '', personalMessage: '' })
  const [shareTokens, setShareTokens] = useState<ShareTokenRecord[]>([])
  const [shareBusy, setShareBusy] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const load = useCallback(async () => {
    try { setData(await getInvoiceDetails(id)) } catch (error) { toast({ title: 'Invoice unavailable', description: error instanceof Error ? error.message : 'Could not load invoice.', variant: 'destructive' }) } finally { setLoading(false) }
  }, [id, toast])
  useEffect(() => { void load(); void listShareTokens(id).then(({ shareTokens: values }) => setShareTokens(values)).catch(() => setShareTokens([])) }, [id, load])

  const invoice = data?.invoice
  const payload = invoice?.payload
  const balance = invoice ? Math.max(Number(invoice.total) - Number(invoice.amount_paid || 0), 0) : 0
  const currentStatus = invoice?.status
  const defaultEmail = payload?.client?.email || ''
  const defaultSubject = invoice ? `Invoice ${invoice.invoice_number} from InvoiceFocus` : ''
  const nextActions = currentStatus ? actions[currentStatus] : []

  const openSend = () => { setRecipientEmail(defaultEmail); setSubject(defaultSubject); setPersonalMessage(''); setDialog('send') }
  const openReminder = () => { setRecipientEmail(defaultEmail); setSubject(invoice ? `Payment reminder for invoice ${invoice.invoice_number}` : 'Payment reminder'); setPersonalMessage(''); setDialog('manualReminder') }
  const run = async (operation: () => Promise<unknown>, success: string) => {
    setBusy(true)
    try { await operation(); toast({ title: success }); setDialog(null); await load() } catch (error) { toast({ title: 'Action failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }) } finally { setBusy(false) }
  }
  const handleTransition = async (status: InvoiceStatus) => {
    if (!invoice) return
    const previous = data
    setData((current) => current ? {
      ...current,
      invoice: {
        ...current.invoice,
        status,
        payload: current.invoice.payload
          ? { ...current.invoice.payload, details: { ...current.invoice.payload.details, status } }
          : current.invoice.payload,
      },
    } : current)
    setBusy(true)
    try {
      const result = await transitionInvoice(invoice.id, status)
      setData((current) => current ? { ...current, invoice: result.invoice } : current)
      toast({ title: 'Invoice status updated', description: `Invoice marked ${status}.` })
      await load()
    } catch (error) {
      setData(previous)
      toast({ title: 'Status update failed', description: error instanceof Error ? error.message : 'Could not update invoice status.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }
  const handleSend = () => run(() => sendInvoice(id, { recipientEmail, subject, personalMessage }), 'Invoice sent')
  const handlePayment = () => {
    const input = { ...payment, amount: Number(payment.amount) }
    return run(() => editingPaymentId ? updatePayment(id, editingPaymentId, input) : recordPayment(id, input), editingPaymentId ? 'Payment updated' : 'Payment recorded')
  }
  const editPayment = (item: PaymentRecord) => {
    setEditingPaymentId(item.id)
    setPayment({ amount: String(item.amount), paymentDate: item.payment_date, paymentMethod: item.payment_method, referenceNumber: item.reference_number, notes: item.notes })
    setDialog('payment')
  }
  const removePayment = (paymentId: string) => {
    if (!window.confirm('Delete this payment? The invoice balance will be recalculated.')) return
    void run(() => deletePayment(id, paymentId), 'Payment deleted')
  }
  const handleSchedule = () => run(() => scheduleReminder(id, reminder), 'Reminder scheduled')
  const handleManualReminder = () => run(() => sendReminder(id, { recipientEmail, subject, personalMessage }), 'Reminder sent')
  const handleCreateShare = async (regenerate = false) => {
    if (!payload) return
    const validation = validateInvoice(payload)
    if (!validation.isValid) {
      toast({
        title: 'Please complete all required fields before continuing.',
        description: validation.errors[0]?.message,
        variant: 'destructive',
      })
      return
    }
    setShareBusy(true)
    try {
      const result = regenerate ? await regenerateShareToken(id) : await createShareToken(id)
      setShareUrl(`${window.location.origin}/share/${result.token}`)
      setShareTokens((current) => [result.shareToken, ...current])
      toast({ title: regenerate ? 'Share link regenerated' : 'Share link created', description: 'Copy the link to send it to your client.' })
    } catch (error) {
      toast({ title: 'Share link failed', description: error instanceof Error ? error.message : 'Could not create a share link.', variant: 'destructive' })
    } finally { setShareBusy(false) }
  }
  const handleDisableShare = async (token: ShareTokenRecord) => {
    setShareBusy(true)
    try {
      const result = await updateShareToken(id, token.id, { enabled: false })
      setShareTokens((current) => current.map((item) => item.id === token.id ? result.shareToken : item))
      toast({ title: 'Share link disabled' })
    } catch (error) {
      toast({ title: 'Share link update failed', description: error instanceof Error ? error.message : 'Could not update the share link.', variant: 'destructive' })
    } finally { setShareBusy(false) }
  }

  if (loading) return <DashboardLayout><div className="mx-auto max-w-6xl animate-pulse space-y-6"><div className="h-12 rounded-xl bg-muted" /><div className="h-96 rounded-xl bg-muted" /></div></DashboardLayout>
  if (!invoice || !data) return <DashboardLayout><div className="mx-auto max-w-6xl rounded-xl border border-dashed p-12 text-center"><p className="text-muted-foreground">This invoice could not be found.</p><Button asChild className="mt-4"><Link href="/dashboard">Back to invoices</Link></Button></div></DashboardLayout>

  return <DashboardLayout>
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><Button variant="ghost" size="icon" asChild><Link href="/dashboard" aria-label="Back to invoices"><ArrowLeft className="h-4 w-4" /></Link></Button><div><p className="text-sm text-muted-foreground">Invoice details</p><h1 className="font-display text-2xl font-semibold tracking-tight">{invoice.invoice_number}</h1></div><Badge className={`border-0 ${statusStyle[invoice.status]}`}>{invoice.status}</Badge></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href={`/invoice?id=${invoice.id}`}><Edit3 className="mr-2 h-4 w-4" />Edit</Link></Button>
          <Button variant="outline" onClick={openSend} disabled={invoice.status === 'Cancelled'}><Send className="mr-2 h-4 w-4" />Send</Button>
          <Button onClick={() => setDialog('payment')} disabled={invoice.status === 'Cancelled' || balance <= 0}><CreditCard className="mr-2 h-4 w-4" />Record payment</Button>
          <Button variant="ghost" size="icon" aria-label="Invoice actions"><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="space-y-6">
          <Card><CardContent className="p-6"><div className="flex flex-col gap-6 sm:flex-row sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bill to</p><p className="mt-2 text-lg font-semibold">{invoice.client || payload?.client?.name || 'Client'}</p><p className="text-sm text-muted-foreground">{invoice.company || payload?.client?.companyName}</p><p className="mt-2 text-sm text-muted-foreground">{payload?.client?.email}</p></div><div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:text-right"><div><p className="text-xs text-muted-foreground">Issue date</p><p className="font-medium">{invoice.issue_date}</p></div><div><p className="text-xs text-muted-foreground">Due date</p><p className="font-medium">{invoice.due_date || 'Upon receipt'}</p></div><div><p className="text-xs text-muted-foreground">Amount due</p><p className="font-semibold text-primary">{money(balance, invoice.currency)}</p></div><div><p className="text-xs text-muted-foreground">Collected</p><p className="font-medium">{money(Number(invoice.amount_paid || 0), invoice.currency)}</p></div></div></div></CardContent></Card>
           <Card><CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Items and totals</CardTitle></CardHeader><CardContent><div className="grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(5.5rem,7.5rem)] border-b pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><span>Description</span><span className="text-right">Qty</span><span className="text-right">Amount</span></div>{(payload?.items || []).map((item) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(5.5rem,7.5rem)] gap-2 border-b py-3 text-sm"><div className="min-w-0"><p className="break-words font-medium">{item.name || 'Item'}</p><p className="break-words text-xs text-muted-foreground">{item.description}</p></div><span className="text-right">{item.quantity}</span><span className="break-all text-right">{money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), invoice.currency)}</span></div>)}<div className="ml-auto mt-4 w-full max-w-xs space-y-2 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Subtotal</span><span className="break-all text-right">{money((payload?.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0), invoice.currency)}</span></div><div className="flex justify-between gap-4 border-t pt-3 text-base font-semibold"><span>Total</span><span className="break-all text-right">{money(Number(invoice.total), invoice.currency)}</span></div></div></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Payment history</CardTitle></CardHeader><CardContent>{data.payments.length ? <div className="space-y-3">{data.payments.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{money(Number(item.amount), invoice.currency)} · {item.payment_method}</p><p className="text-xs text-muted-foreground">{item.payment_date}{item.reference_number ? ` · Ref ${item.reference_number}` : ''}</p><p className="text-sm text-muted-foreground">{item.notes}</p></div><div className="flex shrink-0 gap-2"><Button variant="ghost" size="sm" onClick={() => editPayment(item)}><Edit3 className="mr-1.5 h-3.5 w-3.5" />Edit</Button><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removePayment(item.id)}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete</Button></div></div>)}</div> : <p className="text-sm text-muted-foreground">No payments recorded yet.</p>}</CardContent></Card>
        </div>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Quick actions</CardTitle></CardHeader><CardContent className="grid gap-2"><Button variant="outline" className="justify-start" onClick={openSend}><Mail className="mr-2 h-4 w-4" />Send invoice</Button><Button variant="outline" className="justify-start" onClick={openReminder}><Bell className="mr-2 h-4 w-4" />Send reminder</Button><Button variant="outline" className="justify-start" onClick={() => setDialog('reminder')}><Clock3 className="mr-2 h-4 w-4" />Schedule reminder</Button><Button variant="outline" className="justify-start" asChild><Link href={`/invoice?id=${invoice.id}`}><Download className="mr-2 h-4 w-4" />Download / print</Link></Button><Button variant="outline" className="justify-start" onClick={() => run(() => duplicateInvoice(invoice.id), 'Invoice duplicated')}><Copy className="mr-2 h-4 w-4" />Duplicate</Button></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" />Client portal</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Create a secure, read-only link with your branded invoice.</p>{shareUrl && <div className="flex gap-2"><Input readOnly value={shareUrl} aria-label="Secure invoice share link" /><Button variant="outline" size="icon" aria-label="Copy secure invoice link" onClick={() => void navigator.clipboard?.writeText(shareUrl)}><Copy className="h-4 w-4" /></Button></div>}<div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void handleCreateShare()} disabled={shareBusy}><Link2 className="mr-2 h-4 w-4" />Create link</Button><Button size="sm" variant="outline" onClick={() => void handleCreateShare(true)} disabled={shareBusy}>Regenerate</Button></div>{shareTokens.slice(0, 3).map((token) => <div key={token.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-xs"><span className={token.enabled && !token.revokedAt ? 'text-emerald-700' : 'text-muted-foreground'}>{token.enabled && !token.revokedAt ? 'Active' : 'Disabled'} · {token.accessCount} views</span>{token.enabled && !token.revokedAt && <Button variant="ghost" size="sm" onClick={() => void handleDisableShare(token)} disabled={shareBusy}>Disable</Button>}</div>)}</CardContent></Card>
           <Card><CardHeader><CardTitle>Lifecycle</CardTitle></CardHeader><CardContent className="space-y-2">{nextActions.length ? nextActions.map((status) => <Button key={status} variant={status === 'Cancelled' ? 'ghost' : 'outline'} className={`w-full justify-start ${status === 'Cancelled' ? 'text-destructive' : ''}`} onClick={() => void handleTransition(status)} disabled={busy}>{status === 'Cancelled' ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Mark {status}</Button>) : <p className="text-sm text-muted-foreground">No further lifecycle actions are available.</p>}</CardContent></Card>
          {invoice.recurring_invoice_id && <Card><CardHeader><CardTitle>Recurring information</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Generated from recurring schedule</p><Link className="mt-2 inline-block text-sm font-medium text-primary hover:underline" href={`/dashboard/recurring/${invoice.recurring_invoice_id}`}>View schedule</Link></CardContent></Card>}
        </div>
      </div>

      <Card><CardHeader><CardTitle>Activity timeline</CardTitle></CardHeader><CardContent>{data.activity.length ? <div className="relative space-y-5 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">{data.activity.map((item) => <div key={item.id} className="relative"><span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary ring-1 ring-primary/20" /><p className="text-sm font-medium">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">{dateTime(item.created_at)}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Reminder history</CardTitle></CardHeader><CardContent>{data.reminders.length ? <div className="space-y-3">{data.reminders.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">{item.trigger_type.replaceAll('_', ' ')}</p><p className="text-xs text-muted-foreground">{item.recipient_email} · {item.sent_at ? `Sent ${dateTime(item.sent_at)}` : item.scheduled_for ? `Scheduled ${item.scheduled_for}` : 'Enabled'}</p></div><Badge variant="outline">{item.sent_at ? 'Sent' : item.enabled ? 'Enabled' : 'Disabled'}</Badge></div>)}</div> : <p className="text-sm text-muted-foreground">No reminders configured.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Email delivery</CardTitle></CardHeader><CardContent>{data.emails.length ? <div className="space-y-3">{data.emails.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium capitalize">{item.event_type}</p><p className="text-xs text-muted-foreground">{item.recipient_email} · {dateTime(item.occurred_at)}</p></div><Badge variant="outline">{item.event_type === 'sent' ? 'Sent' : 'Future ready'}</Badge></div>)}</div> : <p className="text-sm text-muted-foreground">No delivery events yet.</p>}</CardContent></Card>
    </div>

    <Dialog open={dialog === 'send'} onOpenChange={(open) => !open && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>Send invoice</DialogTitle><DialogDescription>Send a branded email with the invoice PDF attached.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label htmlFor="send-email">Recipient email</Label><Input id="send-email" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} /></div><div><Label htmlFor="send-subject">Subject</Label><Input id="send-subject" value={subject} onChange={(e) => setSubject(e.target.value)} /></div><div><Label htmlFor="send-message">Personal message</Label><Textarea id="send-message" value={personalMessage} onChange={(e) => setPersonalMessage(e.target.value)} rows={4} placeholder="Add a note for your client..." /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button onClick={handleSend} disabled={busy || !recipientEmail}><Send className="mr-2 h-4 w-4" />{busy ? 'Sending...' : 'Send invoice'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={dialog === 'payment'} onOpenChange={(open) => { if (!open) { setDialog(null); setEditingPaymentId(null) } }}><DialogContent><DialogHeader><DialogTitle>{editingPaymentId ? 'Edit payment' : 'Record payment'}</DialogTitle><DialogDescription>Remaining balance: {money(balance, invoice.currency)}</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="payment-amount">Amount</Label><Input id="payment-amount" type="number" min="0.01" step="0.01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} /></div><div><Label htmlFor="payment-date">Payment date</Label><Input id="payment-date" type="date" value={payment.paymentDate} onChange={(e) => setPayment({ ...payment, paymentDate: e.target.value })} /></div><div><Label>Payment method</Label><Select value={payment.paymentMethod} onValueChange={(value) => setPayment({ ...payment, paymentMethod: value })}><SelectTrigger aria-label="Payment method"><SelectValue /></SelectTrigger><SelectContent>{['Bank transfer', 'Cash', 'Card', 'Cheque', 'Other'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="payment-reference">Reference number</Label><Input id="payment-reference" value={payment.referenceNumber} onChange={(e) => setPayment({ ...payment, referenceNumber: e.target.value })} /></div><div className="sm:col-span-2"><Label htmlFor="payment-notes">Notes</Label><Textarea id="payment-notes" value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button onClick={handlePayment} disabled={busy || !payment.amount}>{editingPaymentId ? 'Save payment' : 'Record payment'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={dialog === 'reminder'} onOpenChange={(open) => !open && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>Schedule payment reminder</DialogTitle><DialogDescription>Automatic reminders are available on Pro and Premium plans.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>When</Label><Select value={reminder.triggerType} onValueChange={(value) => setReminder({ ...reminder, triggerType: value as ReminderRecord['trigger_type'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[['before_3_days', '3 days before due'], ['before_1_day', '1 day before due'], ['due_date', 'On due date'], ['overdue_3_days', '3 days overdue'], ['overdue_7_days', '7 days overdue']].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label>Recipient email</Label><Input type="email" value={reminder.recipientEmail || defaultEmail} onChange={(e) => setReminder({ ...reminder, recipientEmail: e.target.value })} /></div><div><Label>Subject</Label><Input value={reminder.subject || `Payment reminder for invoice ${invoice.invoice_number}`} onChange={(e) => setReminder({ ...reminder, subject: e.target.value })} /></div><div><Label>Personal message</Label><Textarea value={reminder.personalMessage} onChange={(e) => setReminder({ ...reminder, personalMessage: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button onClick={handleSchedule} disabled={busy || !(reminder.recipientEmail || defaultEmail)}>Schedule reminder</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={dialog === 'manualReminder'} onOpenChange={(open) => !open && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>Send payment reminder</DialogTitle><DialogDescription>Send a professional reminder now.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>Recipient email</Label><Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} /></div><div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div><div><Label>Personal message</Label><Textarea value={personalMessage} onChange={(e) => setPersonalMessage(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button onClick={handleManualReminder} disabled={busy || !recipientEmail}>Send reminder</Button></DialogFooter></DialogContent></Dialog>
  </DashboardLayout>
}