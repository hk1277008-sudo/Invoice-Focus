import { Link } from 'wouter'
import { Logo } from '@/components/shared/Logo'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      {/* Logo only — no nav in auth flows */}
      <header className="flex h-16 items-center px-6">
        <Link href="/" aria-label="Back to InvoiceFocus home">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>

      <footer className="flex h-12 items-center justify-center gap-4 px-6">
        <Link
          href="/terms"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Terms
        </Link>
        <span className="h-3 w-px bg-border" aria-hidden="true" />
        <Link
          href="/privacy"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Privacy
        </Link>
      </footer>
    </div>
  )
}
