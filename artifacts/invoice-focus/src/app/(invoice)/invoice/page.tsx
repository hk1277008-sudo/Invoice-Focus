import { useRef, useState } from 'react'
import { Download, FileJson, Printer, RotateCcw, Upload } from 'lucide-react'
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

export default function InvoicePage() {
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
    reset,
  } = useInvoice()

  const { draftStatus } = useInvoiceDraft(invoice)
  const { fieldErrors: validationErrors, isValid } = useInvoiceValidation(invoice)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

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

  return (
    <InvoiceLayout>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Top action bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Create Invoice
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
          </div>
        </div>

        {/* Editor + Preview */}
        <div className="grid gap-8 lg:grid-cols-2 print:block">
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
        </div>
      </div>
    </InvoiceLayout>
  )
}
