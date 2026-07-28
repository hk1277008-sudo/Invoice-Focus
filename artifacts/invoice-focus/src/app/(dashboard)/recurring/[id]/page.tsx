import { useEffect, useState } from 'react'
import { useParams } from 'wouter'
import { RecurringInvoiceForm } from '@/components/recurring/RecurringInvoiceForm'
import { getRecurringInvoice, type RecurringInvoice } from '@/lib/recurring-invoices'
import { DashboardLayout } from '@/app/(dashboard)/layout'
import { useToast } from '@/hooks/use-toast'

export default function EditRecurringInvoicePage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [data, setData] = useState<RecurringInvoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.id) return

    getRecurringInvoice(params.id)
      .then((res) => setData(res.recurringInvoice))
      .catch((err) => {
        toast({
          title: 'Could not load schedule',
          description: err instanceof Error ? err.message : 'Please try again.',
          variant: 'destructive',
        })
      })
      .finally(() => setLoading(false))
  }, [params.id, toast])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
          Loading schedule...
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[320px] flex-col items-center justify-center text-sm text-muted-foreground">
          <p>Schedule not found.</p>
        </div>
      </DashboardLayout>
    )
  }

  return <RecurringInvoiceForm initialData={data} isNew={false} />
}
