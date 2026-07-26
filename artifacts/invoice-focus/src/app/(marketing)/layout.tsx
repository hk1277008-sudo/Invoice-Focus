import { Link } from 'wouter'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      {/* Site header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" aria-label="Invoice Focus home">
            <Logo size="sm" />
          </Link>
          <nav className="flex items-center gap-3">
            <Button size="sm" variant="outline" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Request access</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex flex-1 flex-col">{children}</main>

      {/* Site footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Invoice Focus
          </p>
          <p className="text-xs text-muted-foreground">
            Built for independent professionals &amp; studios
          </p>
        </div>
      </footer>
    </div>
  )
}
