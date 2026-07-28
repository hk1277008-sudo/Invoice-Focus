import { Link } from 'wouter'
import { Logo } from '@/components/shared/Logo'

export function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="InvoiceFocus home">
            <Logo size="sm" />
          </Link>
          <div className="text-sm text-muted-foreground">Invoice Generator</div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
