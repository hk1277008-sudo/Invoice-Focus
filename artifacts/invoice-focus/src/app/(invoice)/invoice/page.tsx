import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Eye, FileJson, Printer, RotateCcw, Save, Upload, Repeat } from 'lucide-react'
import { useLocation, useSearch } from 'wouter'
import { Button } from '@/components/ui/button'
import { InvoiceLayout } from '../layout'
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor'
import { InvoicePreview } from '@/components/invoice/InvoicePreview'
import { useInvoice } from '@/components/invoice/useInvoice'
import { useInvoiceDraft } from '@/components/invoice/useInvoiceDraft'
import { useInvoiceValidation } from '@/components/invoice/useInvoiceValidation'
import { printInvoice } from '@/components/invoice/pdf-export'
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
import { createInvoice, getInvoice, invoiceInput, updateInvoice, type InvoiceStatus } from '@/lib/invoices'
import { listClients, type ClientRecord } from '@/lib/clients'
import { useAuth } from '@/hooks/useAuth'
import { invoiceTemplates, normalizeTemplate, type InvoiceTemplate } from '@/components/invoice/presentation'
import { normalizeDocumentType, type InvoiceDocumentType } from '@/components/invoice/document-types'
import { calculateInvoiceTotals } from '@/components/invoice/utils'

export default function InvoicePage() {
  const search = useSearch()
  const [, navigate] = useLocation()
  const templateParam = new URLSearchParams(search).get('template')
  const selectedTemplate = templateParam ? normalizeTemplate(templateParam) as InvoiceTemplate : undefined
  const documentTypeParam = new URLSearchParams(search).get('documentType')
  const selectedDocumentType = normalizeDocumentType(documentTypeParam)
  const {
    invoice,
    currency,
    calculations,
    hasAnyData,
    updateBusiness,
    updateClient,
    updateDetails,
    updateCurrency,
    updateDocumentType,
    updateAdditional,
    updatePresentation,
    updateItem,
    addItem,
    removeItem,
    setLogo,
    loadFromData,
    reset,
  } = useInvoice(selectedTemplate)

  useEffect(() => {
    if (documentTypeParam) {
      updateDocumentType(selectedDocumentType as InvoiceDocumentType)
    }
  }, [documentTypeParam, selectedDocumentType, updateDocumentType])

  useInvoiceDraft(invoice)
  const { fieldErrors: validationErrors, isValid } = useInvoiceValidation(invoice)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [savedStatus, setSavedStatus] = useState<InvoiceStatus | null>(null)
  const [isLoadingRecord, setIsLoadingRecord] = useState(true)
  const [remoteStatus, setRemoteStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [clients, setClients] = useState<ClientRecord[]>([])
  const invoiceRef = useRef(invoice)
  const recordIdRef = useRef<string | null>(null)
  const savedStatusRef = useRef<InvoiceStatus | null>(null)
  const lastPersistedSignatureRef = useRef<string | null>(null)
  const saveInFlightRef = useRef(false)
  const saveAgainRef = useRef(false)
  const saveTimerRef = useRef<number | null>(null)
  const persistInvoiceRef = useRef<() => Promise<void>>(async () => undefined)

  invoiceRef.current = invoice
  recordIdRef.current = recordId
  savedStatusRef.current = savedStatus

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
    if (!hasAnyData || !isAuthenticated) return
    if (saveInFlightRef.current) {
      saveAgainRef.current = true
      return
    }
    const currentInvoice = invoiceRef.current
    const currentSignature = JSON.stringify(currentInvoice)
    if (lastPersistedSignatureRef.current === currentSignature) return
    const currentRecordId = recordIdRef.current
    const currentSavedStatus = savedStatusRef.current
    saveInFlightRef.current = true
    setRemoteStatus('saving')
    const input = invoiceInput(currentInvoice, calculateInvoiceTotals(currentInvoice.items).grandTotal)
    const statusChanged = Boolean(currentRecordId && currentSavedStatus !== null && input.status !== currentSavedStatus)
    let persistedSignature = currentSignature
    try {
      if (currentRecordId) {
        // Submit status and invoice data together. The PATCH endpoint owns
        // transition validation and returns the canonical synchronized row.
        const result = await updateInvoice(currentRecordId, input)
        setSavedStatus(result.invoice.status)
        if (result.invoice.payload) {
          const canonicalInvoice = {
            ...result.invoice.payload,
            details: { ...result.invoice.payload.details, status: result.invoice.status },
          }
          // Do not let an older save response replace edits made while it was in flight.
          if (JSON.stringify(invoiceRef.current) === currentSignature) {
            persistedSignature = JSON.stringify(canonicalInvoice)
            loadFromData({
              ...canonicalInvoice,
            })
          }
        }
        if (statusChanged) {
          toast({ title: 'Invoice status updated', description: `Invoice marked ${input.status}.` })
        }
      } else {
        const result = await createInvoice(input)
        setRecordId(result.invoice.id)
        setSavedStatus(result.invoice.status)
        navigate(`/invoice?id=${result.invoice.id}`, { replace: true })
      }
      lastPersistedSignatureRef.current = persistedSignature
      setRemoteStatus('saved')
      window.setTimeout(() => setRemoteStatus((status) => status === 'saved' ? 'idle' : status), 1800)
    } catch (error) {
      if (statusChanged && currentSavedStatus) {
        // A rejected transition must not leave the editor showing an
        // unsaved/invalid local status. Preserve all other in-progress edits.
        updateDetails('status', currentSavedStatus)
      }
      setRemoteStatus('error')
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Could not save this invoice.',
        variant: 'destructive',
      })
    } finally {
      saveInFlightRef.current = false
      if (saveAgainRef.current || lastPersistedSignatureRef.current !== JSON.stringify(invoiceRef.current)) {
        saveAgainRef.current = false
        saveTimerRef.current = window.setTimeout(() => { void persistInvoiceRef.current() }, 300)
      }
    }
  }, [hasAnyData, isAuthenticated, loadFromData, navigate, toast, updateDetails])
  persistInvoiceRef.current = persistInvoice

  useEffect(() => {
    const params = new URLSearchParams(search)
    const id = params.get('id')
    setRecordId(id)
    setIsLoadingRecord(Boolean(id))
    if (!id) return

    getInvoice(id)
      .then(({ invoice: record }) => {
        setSavedStatus(record.status)
        if (record.payload) {
          const canonicalInvoice = {
            ...record.payload,
            details: { ...record.payload.details, status: record.status },
          }
          lastPersistedSignatureRef.current = JSON.stringify(canonicalInvoice)
          loadFromData(canonicalInvoice)
        }
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
    if (isLoadingRecord || !hasAnyData || !isAuthenticated) return
    const signature = JSON.stringify(invoice)
    if (lastPersistedSignatureRef.current === signature) return
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      void persistInvoice()
    }, 1200)
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [hasAnyData, invoice, isAuthenticated, isLoadingRecord, persistInvoice])

  const handlePrint = () => {
    if (!runValidation()) return
    if (!hasAnyData) {
      toast({ title: 'Nothing to print', description: 'Add some invoice details before printing.' })
      return
    }
    if (!printInvoice(invoice)) {
      toast({ title: 'Unable to open print preview', description: 'Please allow pop-ups for InvoiceFocus and try again.', variant: 'destructive' })
    }
  }

  const handleDownloadPDF = () => {
    if (!runValidation()) return
    if (!hasAnyData) {
      toast({ title: 'Nothing to export', description: 'Add some invoice details before exporting.' })
      return
    }
    if (!printInvoice(invoice)) {
      toast({ title: 'Unable to open PDF preview', description: 'Please allow pop-ups for InvoiceFocus and try again.', variant: 'destructive' })
    }
  }

  const handleExportJSON = () => {
    if (!runValidation()) return
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
    if (!runValidation()) return
    if (!isAuthenticated) {
      toast({ title: 'Sign in to save invoices', description: 'Your local draft is safe in this browser. Sign in when you want to save it to your account.' })
      return
    }
    void persistInvoice()
  }

  const handlePreview = () => {
    if (!runValidation()) return
    document.getElementById('invoice-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const runValidation = () => {
    setShowValidation(true)
    if (isValid) return true
    toast({
      title: 'Please complete all required fields before continuing.',
      description: 'Review the highlighted fields and try again.',
      variant: 'destructive',
    })
    const firstError = Object.keys(validationErrors)[0]
    window.setTimeout(() => {
      const target = firstError === 'items'
        ? document.querySelector<HTMLElement>('[data-invoice-items]')
        : document.getElementById(firstError)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
        target.focus({ preventScroll: true })
      } else {
        const field = target?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')
        field?.focus({ preventScroll: true })
      }
    }, 0)
    return false
  }

  const handleMakeRecurring = () => {
    sessionStorage.setItem('recurring_handoff', JSON.stringify(invoice))
    navigate('/dashboard/recurring/new')
  }

  return (
    <InvoiceLayout>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Top action bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <p className="label-caps">Invoice editor</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {recordId ? 'Edit Invoice' : 'Create Invoice'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Build and preview your invoice in real time.
            </p>
          </div>
          <div className="relative grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <span className="pointer-events-none absolute -top-6 right-0 min-h-4 text-xs text-muted-foreground sm:right-0" aria-live="polite">
              {remoteStatus === 'saved' ? 'All changes saved' : remoteStatus === 'error' ? 'Could not save' : ''}
            </span>

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
              className="w-full gap-2 sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>

            <Button type="button" variant="outline" onClick={handleExportJSON} className="w-full gap-2 sm:w-auto">
              <FileJson className="h-4 w-4" />
              Export JSON
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="w-full gap-2 sm:w-auto">
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

              <Button type="button" variant="outline" onClick={handlePrint} className="w-full gap-2 sm:w-auto">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button type="button" onClick={handleDownloadPDF} className="w-full gap-2 sm:w-auto">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button type="button" variant="outline" onClick={handleSave} disabled={isLoadingRecord || remoteStatus === 'saving'} className="w-full gap-2 sm:w-auto">
                <Save className="h-4 w-4" />
                Save Invoice
              </Button>
              <Button type="button" variant="secondary" onClick={handlePreview} className="w-full gap-2 sm:w-auto">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button type="button" variant="secondary" onClick={handleMakeRecurring} disabled={!hasAnyData} className="w-full gap-2 sm:w-auto">
                  <Repeat className="h-4 w-4" />
                  Make Recurring
              </Button>
          </div>
        </div>

        {/* Editor + Preview */}
        {isLoadingRecord ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-border bg-card text-sm text-muted-foreground">
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
              onUpdateDocumentType={updateDocumentType}
            />
          </div>
          <div id="invoice-preview" className="order-1 lg:order-2 print:m-0 print:p-0">
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
