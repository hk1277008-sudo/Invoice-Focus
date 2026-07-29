import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileJson, Printer, RotateCcw, Save, Upload, Repeat } from 'lucide-react'
import { useLocation, useSearch } from 'wouter'
import { Button } from '@/components/ui/button'
import { InvoiceLayout } from '../layout'
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor'
import { InvoicePreview } from '@/components/invoice/InvoicePreview'
import { useInvoice } from '@/components/invoice/useInvoice'
import { useInvoiceDraft } from '@/components/invoice/useInvoiceDraft'
import { useInvoiceValidation } from '@/components/invoice/useInvoiceValidation'
import { downloadPDF } from '@/components/invoice/pdf-export'
import {
  exportInvoiceToJSON,
  downloadJSON,
  readInvoiceFromFile,
  isValidInvoiceData,
} from '@/components/invoice/json-export'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { createInvoice, getInvoice, invoiceInput, updateInvoice } from '@/lib/invoices'
import { listClients, type ClientRecord } from '@/lib/clients'
import { useSubscription } from '@/providers/SubscriptionProvider'
import { UpgradeDialog } from '@/components/subscription/UpgradeDialog'

export default function InvoicePage() {
  const search = useSearch()
  const [, navigate] = useLocation()
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
    updatePresentation,
    updateItem,
    addItem,
    removeItem,
    setLogo,
    loadFromData,
    reset,
  } = useInvoice()

  const { draftStatus } = useInvoiceDraft(invoice)
  const { fieldErrors: validationErrors, isValid } = useInvoiceValidation(invoice)
  const { toast } = useToast()
  const { refreshSubscription } = useSubscription()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [isLoadingRecord, setIsLoadingRecord] = useState(true)
  const [remoteStatus, setRemoteStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [limitDialogOpen, setLimitDialogOpen] = useState(false)

  useEffect(() => {
    listClients({ sort: 'name', direction: 'asc' })
      .then(({ clients: savedClients }) => setClients(savedClients))
      .catch(() => setClients([]))
  }, [])

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
  }, [updateBusiness, updateClient])

  const persistInvoice = useCallback(async () => {
    if (!hasAnyData) return
    setRemoteStatus('saving')
    try {
      const input = invoiceInput(invoice, calculations.grandTotal)
      if (recordId) {
        await updateInvoice(recordId, input)
      } else {
        const result = await createInvoice(input)
        setRecordId(result.invoice.id)
        navigate(`/invoice?id=${result.invoice.id}`, { replace: true })
        await refreshSubscription()
      }
      setRemoteStatus('saved')
    } catch (error) {
      setRemoteStatus('error')
      if (error instanceof Error && 'code' in error && (error as Error & { code?: string }).code === 'INVOICE_LIMIT_REACHED') {
        setLimitDialogOpen(true)
        return
      }
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Could not save this invoice.',
        variant: 'destructive',
      })
    }
  }, [calculations.grandTotal, hasAnyData, invoice, navigate, recordId, refreshSubscription, toast])

  useEffect(() => {
    const params = new URLSearchParams(search)
    const id = params.get('id')
    setRecordId(id)
    setIsLoadingRecord(Boolean(id))
    if (!id) return

    getInvoice(id)
      .then(({ invoice: record }) => {
        if (record.payload) loadFromData(record.payload)
      })
      .catch((error) => {
        toast({
          title: 'Invoice unavailable',
          description: error instanceof Error ? error.message : 'Could not load this invoice.',
          variant: 'destructive',
        })
        navigate('/dashboard')
      })
      .finally(() => setIsLoadingRecord(false))
  }, [loadFromData, navigate, search, toast])

  useEffect(() => {
    if (isLoadingRecord || !hasAnyData) return
    const timeout = window.setTimeout(() => {
      void persistInvoice()
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [hasAnyData, invoice, isLoadingRecord, persistInvoice])

  const handlePrint = () => {
    setShowValidation(true)
    if (!isValid) return
    if (!hasAnyData) {
      toast({ title: 'Nothing to print', description: 'Add some invoice details before printing.' })
      return
    }
    window.print()
  }

  const handleDownloadPDF = () => {
    setShowValidation(true)
    if (!isValid) return
    if (!hasAnyData) {
      toast({ title: 'Nothing to export', description: 'Add some invoice details before exporting.' })
      return
    }
    downloadPDF(invoice)
  }

  const handleExportJSON = () => {
    setShowValidation(true)
    if (!isValid) return
    const { blob, fileName } = exportInvoiceToJSON(invoice)
    downloadJSON(blob, fileName)
    toast({ title: 'Invoice exported', description: `${fileName} has been downloaded.` })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    try {
      const data = await readInvoiceFromFile(file)
      if (!isValidInvoiceData(data)) {
        throw new Error('Invalid invoice file format')
      }
      loadFromData(data)
      toast({ title: 'Invoice imported', description: 'Your invoice has been loaded successfully.' })
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Could not read the selected file.',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleReset = () => {
    reset()
    toast({ title: 'Invoice reset', description: 'All fields have been cleared.' })
  }

  const handleSave = () => {
    void persistInvoice()
  }

  const handleMakeRecurring = () => {
    sessionStorage.setItem('recurring_handoff', JSON.stringify(invoice))
    navigate('/dashboard/recurring/new')
  }

  return (
    <InvoiceLayout>
      <UpgradeDialog
        open={limitDialogOpen}
        onOpenChange={setLimitDialogOpen}
        feature="You’ve reached your monthly invoice limit"
        description="You've reached your monthly limit of 15 invoices. Upgrade to Pro for unlimited invoicing and additional business tools."
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Top action bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {recordId ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Build and preview your invoice in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {draftStatus.status !== 'idle' && (
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {draftStatus.status === 'saving' ? 'Saving draft...' : 'Draft saved'}
              </span>
            )}
            {remoteStatus !== 'idle' && (
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {remoteStatus === 'saving' ? 'Saving to Supabase...' : remoteStatus === 'saved' ? 'Saved' : 'Save failed'}
              </span>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="sr-only"
              aria-label="Import invoice JSON"
              disabled={isImporting}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleImportClick}
              disabled={isImporting}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>

            <Button type="button" variant="outline" onClick={handleExportJSON} className="gap-2">
              <FileJson className="h-4 w-4" />
              Export JSON
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset invoice?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all fields, remove the uploaded logo, and reset totals. The selected currency will remain unchanged.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

              <Button type="button" variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button type="button" onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button type="button" variant="outline" onClick={handleSave} disabled={isLoadingRecord || remoteStatus === 'saving'} className="gap-2">
                <Save className="h-4 w-4" />
                Save Invoice
              </Button>
              {hasAnyData && (
                <Button type="button" variant="secondary" onClick={handleMakeRecurring} className="gap-2">
                  <Repeat className="h-4 w-4" />
                  Make Recurring
                </Button>
              )}
          </div>
        </div>

        {/* Editor + Preview */}
        {isLoadingRecord ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
            Loading invoice...
          </div>
        ) : <div className="grid gap-8 lg:grid-cols-2 print:block">
          <div className="order-2 lg:order-1 print:hidden">
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
              onUpdatePresentation={updatePresentation}
            />
          </div>
          <div className="order-1 lg:order-2 print:m-0 print:p-0">
            <div className="sticky top-20 print:static">
              <InvoicePreview
                invoice={invoice}
                currency={currency}
                calculations={calculations}
                hasAnyData={hasAnyData}
              />
            </div>
          </div>
        </div>}
      </div>
    </InvoiceLayout>
  )
}
