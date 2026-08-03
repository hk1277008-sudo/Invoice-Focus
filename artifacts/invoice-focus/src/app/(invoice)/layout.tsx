import { Link } from 'wouter'
import { Logo } from '@/components/shared/Logo'

export function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="InvoiceFocus home">
            <Logo size="md" />
          </Link>
          <div className="text-sm font-medium tracking-tight text-muted-foreground">Create Invoice</div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
