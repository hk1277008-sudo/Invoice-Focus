import { Link } from 'wouter'
import { Logo } from '@/components/shared/Logo'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.06),transparent_34rem),hsl(var(--background))]">
      <header className="auth-enter mx-auto flex w-full max-w-[440px] items-center px-5 pb-2 pt-8 sm:pt-10">
        <Link
          href="/"
          aria-label="Back to Invoice Focus home"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-4"
        >
          <Logo size="md" />
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-10 pt-6 sm:px-5 sm:pb-14 sm:pt-8">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>

      <footer className="flex min-h-12 items-center justify-center gap-4 px-6 pb-5 text-center sm:pb-6">
        <Link
          href="/terms"
          className="rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Terms
        </Link>
        <span className="h-3 w-px bg-border" aria-hidden="true" />
        <Link
          href="/privacy"
          className="rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Privacy
        </Link>
      </footer>
    </div>
  )
}
