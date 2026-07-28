import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Save, AlertCircle, ArrowLeft } from 'lucide-react'
import { DashboardLayout } from '@/app/(dashboard)/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { listClients, type ClientRecord } from '@/lib/clients'
import {
  createRecurringInvoice,
  updateRecurringInvoice,
  type RecurringInvoice,
  type RecurringFrequency,
} from '@/lib/recurring-invoices'
import { useInvoice } from '@/components/invoice/useInvoice'
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor'
import { InvoicePreview } from '@/components/invoice/InvoicePreview'
import { useInvoiceValidation } from '@/components/invoice/useInvoiceValidation'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { UpgradeDialog } from '@/components/subscription/UpgradeDialog'
import { format } from 'date-fns'
import { getSettings, type UserSettings } from '@/lib/settings'

interface Props {
  initialData?: RecurringInvoice | null
  isNew?: boolean
}

export function RecurringInvoiceForm({ initialData, isNew }: Props) {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const { hasFeature } = useSubscription()
  const hasRecurring = hasFeature('recurringInvoices')
  
  const {
    invoice,
    currency,
    calculations,
    hasAnyData,
    updateBusiness,
    updateClient,
    updateDetails,
    updateCurrency,
    updateAdditional,
    updateItem,
    addItem,
    removeItem,
    setLogo,
    loadFromData,
  } = useInvoice()

  const { fieldErrors: validationErrors, isValid: isInvoiceValid } = useInvoiceValidation(invoice)
  const [showValidation, setShowValidation] = useState(false)

  const [clients, setClients] = useState<ClientRecord[]>([])
  const [remoteStatus, setRemoteStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [intervalCount, setIntervalCount] = useState<number>(1)
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [neverEnds, setNeverEnds] = useState<boolean>(true)
  const [endDate, setEndDate] = useState<string>('')
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [dueDateOffset, setDueDateOffset] = useState<number>(14)
  const [autoInvoiceNumber, setAutoInvoiceNumber] = useState<boolean>(true)
  const [autoGeneration, setAutoGeneration] = useState<boolean>(true)
  const [invoiceStatus, setInvoiceStatus] = useState<'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'>('Draft')

  useEffect(() => {
    listClients({ sort: 'name', direction: 'asc' })
      .then(({ clients: savedClients }) => setClients(savedClients))
      .catch(() => setClients([]))
  }, [])

  useEffect(() => {
    if (!isNew || initialData) return
    getSettings().then((settings: UserSettings) => {
      setFrequency(settings.recurringDefaultFrequency)
      setTimezone(settings.recurringDefaultTimezone)
      setDueDateOffset(settings.recurringDefaultDueDateOffset)
      setAutoGeneration(settings.recurringDefaultAutoGeneration)
      setInvoiceStatus(settings.recurringDefaultInvoiceStatus)
    }).catch(() => undefined)
  }, [initialData, isNew])

  useEffect(() => {
    if (initialData) {
      setFrequency(initialData.frequency)
      setIntervalCount(initialData.interval_count)
      setStartDate(initialData.start_date.slice(0, 10))
      if (initialData.end_date) {
        setNeverEnds(false)
        setEndDate(initialData.end_date.slice(0, 10))
      } else {
        setNeverEnds(true)
        setEndDate('')
      }
      setTimezone(initialData.timezone)
      setDueDateOffset(initialData.due_date_offset)
      setAutoInvoiceNumber(initialData.auto_invoice_number)
      setAutoGeneration(initialData.auto_generation)
      setInvoiceStatus(initialData.invoice_status)
      
      if (initialData.template_data) {
        loadFromData(initialData.template_data)
      }
    } else if (isNew) {
      try {
        const handoff = sessionStorage.getItem('recurring_handoff')
        if (handoff) {
          const parsed = JSON.parse(handoff)
          loadFromData(parsed)
          sessionStorage.removeItem('recurring_handoff')
        }
      } catch (e) {
        // ignore
      }
    }
  }, [initialData, isNew, loadFromData])

  const selectClient = useCallback((client: ClientRecord | null) => {
    if (!client) {
      updateClient('clientId', '')
      return
    }
    updateClient('clientId', client.id)
    updateClient('name', client.full_name)
    updateClient('companyName', client.company_name)
    updateClient('email', client.email)
    updateClient('phone', client.phone)
    updateClient('billingAddress', [client.billing_address, client.city, client.state, client.postal_code, client.country].filter(Boolean).join(', '))
    updateClient('taxId', client.tax_id)
  }, [updateClient])

  const handleSave = async () => {
    setShowValidation(true)
    if (!isInvoiceValid) {
      toast({ title: 'Validation error', description: 'Please fix the invoice errors before saving.', variant: 'destructive' })
      return
    }
    if (!invoice.client.name) {
      toast({ title: 'Validation error', description: 'A client name is required for recurring invoices.', variant: 'destructive' })
      return
    }

    setRemoteStatus('saving')
    try {
      const input = {
        client_id: invoice.client.clientId || null,
        client_name: invoice.client.name,
        frequency,
        interval_count: intervalCount,
         start_date: startDate,
         end_date: neverEnds || !endDate ? null : endDate,
        timezone,
        due_date_offset: dueDateOffset,
        auto_invoice_number: autoInvoiceNumber,
         auto_generation: autoGeneration,
         invoice_status: invoiceStatus,
        template_data: invoice,
      }

      if (initialData) {
        await updateRecurringInvoice(initialData.id, input)
        toast({ title: 'Schedule updated' })
      } else {
        await createRecurringInvoice(input)
        toast({ title: 'Schedule created' })
      }
      setRemoteStatus('saved')
      navigate('/dashboard/recurring')
    } catch (error) {
      setRemoteStatus('error')
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Could not save this schedule.',
        variant: 'destructive',
      })
    }
  }

  return (
    <DashboardLayout>
      {!hasRecurring && (
        <UpgradeDialog
          open
          onOpenChange={(open) => {
            if (!open) navigate('/dashboard/recurring')
          }}
          feature="Automate your billing"
          description="Recurring invoices are available on the Pro plan. Schedule invoices for regular clients and keep every billing cycle on track."
        />
      )}
      {hasRecurring && (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2">
              <Link href="/dashboard/recurring" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Back to schedules
              </Link>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {isNew ? 'New Recurring Schedule' : 'Edit Schedule'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure how and when this invoice should be generated.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/recurring">Cancel</Link>
            </Button>
            <Button onClick={handleSave} disabled={remoteStatus === 'saving'} className="gap-2">
              <Save className="h-4 w-4" />
              {remoteStatus === 'saving' ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-8 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Settings</CardTitle>
                <CardDescription>Define the recurrence rules for this invoice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Frequency</Label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                      className="mt-1.5 flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom (Days)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Repeat Every</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        type="number"
                        min="1"
                        value={intervalCount}
                        onChange={(e) => setIntervalCount(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {frequency === 'daily' || frequency === 'custom' ? 'days' : frequency === 'weekly' ? 'weeks' : frequency === 'monthly' ? 'months' : frequency === 'quarterly' ? 'quarters' : 'years'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={neverEnds}
                      className="mt-1.5"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <Switch id="never-ends" checked={neverEnds} onCheckedChange={setNeverEnds} />
                      <Label htmlFor="never-ends" className="text-sm font-normal">Never ends</Label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Due Date Offset (Days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={dueDateOffset}
                      onChange={(e) => setDueDateOffset(parseInt(e.target.value) || 0)}
                      className="mt-1.5"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Days after issue date</p>
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="mt-1.5 flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {Intl.supportedValuesOf('timeZone').map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Switch id="auto-inv" checked={autoInvoiceNumber} onCheckedChange={setAutoInvoiceNumber} />
                    <Label htmlFor="auto-inv" className="font-medium">Auto-generate invoice numbers</Label>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground pl-11">
                    When enabled, generated invoices will use your business's next sequential invoice number. When disabled, the template's invoice number will be used exactly.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Generated Invoice Status</Label>
                    <select value={invoiceStatus} onChange={(e) => setInvoiceStatus(e.target.value as typeof invoiceStatus)} className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                      {['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-7">
                    <Switch id="auto-generation" checked={autoGeneration} onCheckedChange={setAutoGeneration} />
                    <Label htmlFor="auto-generation">Automatic generation enabled</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Invoice Template</h2>
              <InvoiceEditor
                invoice={invoice}
                errors={showValidation ? validationErrors : {}}
                onUpdateBusiness={updateBusiness}
                onUpdateClient={updateClient}
                onUpdateDetails={updateDetails}
                onUpdateCurrency={updateCurrency}
                onUpdateAdditional={updateAdditional}
                onUpdateItem={updateItem}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onSetLogo={setLogo}
                clients={clients}
                onSelectClient={selectClient}
              />
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="sticky top-6">
              <InvoicePreview
                invoice={invoice}
                currency={currency}
                calculations={calculations}
                hasAnyData={hasAnyData}
              />
            </div>
          </div>
        </div>
      </div>
      )}
    </DashboardLayout>
  )
}