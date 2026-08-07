import { Logo } from '@/components/shared/Logo'
import { Link } from 'wouter'

const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { text: 'Features', href: '#features' },
      { text: 'Templates', href: '#templates' },
      { text: 'How It Works', href: '#how-it-works' },
    ],
  },
  {
    title: 'Templates',
    links: [
      { text: 'Invoice', href: '#templates' },
      { text: 'Quote', href: '#templates' },
      { text: 'Estimate', href: '#templates' },
      { text: 'Receipt', href: '#templates' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { text: 'Help', href: '/help' },
      { text: 'Guides', href: '/guides' },
    ],
  },
  {
    title: 'Company',
    links: [
      { text: 'About', href: '/about' },
      { text: 'Blog', href: '/blog' },
      { text: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { text: 'Privacy Policy', href: '/privacy' },
      { text: 'Terms', href: '/terms' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-6">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" aria-label="InvoiceFocus home">
              <Logo size="md" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Professional invoicing made simple for freelancers, agencies, and businesses.
            </p>
          </div>

          {/* Link groups */}
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.text}>
                    {link.href.startsWith('#') ? <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.text}
                    </a> : <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.text}
                    </Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © 2026 InvoiceFocus. All Rights Reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
