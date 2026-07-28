import { Link, useLocation } from 'wouter'
import { FileText, Users, BarChart2, Settings, PlusCircle, LogOut, User, Repeat, Bell } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { UsageIndicator } from '@/components/subscription/UsageIndicator'
import { getNotifications, markNotificationRead, type NotificationRecord } from '@/lib/notifications'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

const NAV_ITEMS = [
  { label: 'Invoices', href: '/dashboard', icon: FileText },
  { label: 'Recurring', href: '/dashboard/recurring', icon: Repeat },
  { label: 'Clients', href: '/dashboard/clients', icon: Users },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart2 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function UserMenu() {
  const { user, signOut } = useAuth()
  const [, navigate] = useLocation()
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

  const handleSignOut = async () => {
    await signOut()
    navigate('/sign-in')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="User menu"
        >
          <Avatar className="h-8 w-8">
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
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationMenu() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  useEffect(() => {
    getNotifications().then(({ notifications: rows }) => setNotifications(rows)).catch(() => undefined)
  }, [])
  const unread = notifications.filter((notification) => !notification.read_at).length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`${unread} unread notifications`} className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{unread > 9 ? '9+' : unread}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-2 font-medium">Notifications</div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? <p className="px-2 py-4 text-sm text-muted-foreground">You’re all caught up.</p> : notifications.slice(0, 8).map((notification) => (
          <DropdownMenuItem key={notification.id} className="items-start gap-2 py-3" onClick={() => { if (!notification.read_at) { void markNotificationRead(notification.id); setNotifications((rows) => rows.map((row) => row.id === notification.id ? { ...row, read_at: new Date().toISOString() } : row)) } }}>
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read_at ? 'bg-muted' : 'bg-primary'}`} />
            <span className="min-w-0"><span className="block text-sm font-medium">{notification.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{notification.message}</span><span className="mt-1 block text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span></span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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
          <div className="mb-3">
            <UsageIndicator compact />
          </div>
          <Button asChild size="sm" className="w-full gap-2">
            <Link href="/invoice">
            <PlusCircle className="h-4 w-4" />
            New invoice
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-2"><NotificationMenu /><UserMenu /></div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
