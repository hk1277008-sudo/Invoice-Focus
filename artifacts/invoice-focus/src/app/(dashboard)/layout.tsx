import { Link, useLocation, useSearch } from 'wouter'
import { FileText, Users, LayoutDashboard, CircleHelp, PlusCircle, LogOut, Menu, Check, Loader2 } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { CURRENCIES } from '@/components/invoice/currencies'
import { getSettings, saveBusinessCurrency } from '@/lib/settings'
import { useToast } from '@/hooks/use-toast'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoices', href: '/dashboard?section=invoices', icon: FileText },
  { label: 'Clients', href: '/dashboard/clients', icon: Users },
  { label: 'Templates', href: '/dashboard/templates', icon: FileText },
  { label: 'Help', href: '/help', icon: CircleHelp },
]

function UserMenu() {
  const { user, signOut } = useAuth()
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [businessCurrency, setBusinessCurrency] = useState('USD')
  const [savingCurrency, setSavingCurrency] = useState(false)
  const fullName = (user?.user_metadata?.full_name as string) || ''
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || ''
  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'IF'

  useEffect(() => {
    let active = true
    void getSettings().then((settings) => {
      if (active) setBusinessCurrency(settings.defaultCurrency)
    }).catch(() => {
      // The menu remains usable even if settings are temporarily unavailable.
    })
    return () => { active = false }
  }, [user?.id])

  const handleCurrencyChange = async (value: string) => {
    const previous = businessCurrency
    setBusinessCurrency(value)
    setSavingCurrency(true)
    try {
      await saveBusinessCurrency(value)
      toast({ title: 'Business currency updated', description: `Dashboard reporting now uses ${value}.` })
      window.dispatchEvent(new CustomEvent('invoicefocus:business-currency-changed', { detail: value }))
    } catch (error) {
      setBusinessCurrency(previous)
      toast({ title: 'Could not update business currency', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setSavingCurrency(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/sign-in')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full outline-none ring-offset-background transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="User menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} alt={fullName || user?.email || 'User'} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{fullName || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Business reporting currency</DropdownMenuLabel>
        <div className="px-2 pb-2">
          <div className="relative">
            <select
              aria-label="Business reporting currency"
              value={businessCurrency}
              disabled={savingCurrency}
              onChange={(event) => void handleCurrencyChange(event.target.value)}
              className="h-9 w-full appearance-none rounded-md border border-input bg-background px-2 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currency.name}</option>)}
            </select>
            {savingCurrency ? <Loader2 className="pointer-events-none absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" /> : businessCurrency ? <Check className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-primary" /> : null}
          </div>
          <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">Dashboard totals exclude invoices in other currencies.</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const search = useSearch()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isInvoiceSection = location === '/dashboard' && new URLSearchParams(search).get('section') === 'invoices'

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location])

  return (
    <div className="flex min-h-svh min-w-0 bg-background overflow-x-hidden">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
           <Link href="/dashboard">
             <Logo size="md" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = label === 'Dashboard'
                ? location === '/dashboard' && !isInvoiceSection
                : label === 'Invoices'
                  ? isInvoiceSection
                  : location === href
              return (
                <li key={label}>
                  <Link
                    href={href}
                    className={cn(
                      'flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150',
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
          <Button asChild size="sm" className="w-full gap-2">
            <Link href="/invoice">
            <PlusCircle className="h-4 w-4" />
            New invoice
            </Link>
          </Button>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside
        aria-label="Mobile navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-border bg-card shadow-xl transition-transform duration-200 ease-out lg:hidden',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-5">
           <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>
             <Logo size="md" />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                    className={cn(
                    'flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                     label === 'Dashboard'
                       ? location === '/dashboard' && !isInvoiceSection
                       : label === 'Invoices'
                         ? isInvoiceSection
                         : location === href
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border p-3">
          <Button asChild size="sm" className="h-11 w-full gap-2">
            <Link href="/invoice" onClick={() => setMobileNavOpen(false)}>
              <PlusCircle className="h-4 w-4" />
              New invoice
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-border bg-card/80 px-4 backdrop-blur-sm sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 lg:hidden">
             <Link href="/dashboard" aria-label="Invoice Focus dashboard"><Logo size="md" /></Link>
          </div>
          <div className="flex-1 hidden lg:block" />
          <div className="flex items-center gap-2"><UserMenu /></div>
        </header>
         <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
