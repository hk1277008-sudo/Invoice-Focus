import { Link, useLocation } from 'wouter'
import { FileText, Users, BarChart2, Settings, PlusCircle } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Invoices', href: '/dashboard', icon: FileText },
  { label: 'Clients', href: '/dashboard/clients', icon: Users },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart2 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()

  return (
    <div className="flex min-h-svh bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = location === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-100',
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <Button size="sm" className="w-full gap-2">
            <PlusCircle className="h-4 w-4" />
            New invoice
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-6">
          <div className="flex-1" />
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            title="User menu"
          >
            IF
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
