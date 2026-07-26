import { DashboardLayout } from '../layout'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your invoices and payment activity will appear here.
          </p>
        </div>

        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card text-center">
          <p className="text-sm font-medium text-muted-foreground">Dashboard coming soon</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Features will be implemented in the next phase.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
