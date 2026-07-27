import { useRef } from 'react'
import { Download, Printer, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvoiceLayout } from '../layout'
import { InvoiceEditor } from '@/components/invoice/InvoiceEditor'
import { InvoicePreview } from '@/components/invoice/InvoicePreview'
import { useInvoice } from '@/components/invoice/useInvoice'
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
    reset,
  } = useInvoice()

  const { toast } = useToast()
  const previewRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!hasAnyData) {
      toast({
        title: 'Nothing to print',
        description: 'Add some invoice details before printing.',
      })
      return
    }
    window.print()
  }

  const handleDownloadPDF = () => {
    toast({
      title: 'PDF export coming soon',
      description: 'PDF generation will be available in the next phase.',
    })
  }

  return (
    <InvoiceLayout>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Top action bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Create Invoice
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Build and preview your invoice in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset Invoice
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
                  <AlertDialogAction onClick={reset}>Reset</AlertDialogAction>
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
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <InvoiceEditor
              invoice={invoice}
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
          <div className="order-1 lg:order-2" ref={previewRef}>
            <div className="sticky top-20">
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
