import { Logo } from '@/components/shared/Logo'
import { Facebook, Twitter, Youtube, Linkedin, Github } from 'lucide-react'

const FOOTER_GROUPS = [
  {
    title: 'Use Invoice Focus',
    links: [
      { text: 'Invoice Template', href: '/' },
      { text: 'Credit Note Template', href: '/credit-note-template' },
      { text: 'Quote Template', href: '/quote-template' },
      { text: 'Purchase Order Template', href: '/purchase-order-template' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { text: 'Guides', href: '/guides' },
      { text: 'Help', href: '/help' },
      { text: 'Release Notes', href: '/release-notes' },
      { text: 'Developer API', href: '/developers' },
    ],
  },
  {
    title: 'Account',
    links: [
      { text: 'Sign In', href: '/sign-in' },
      { text: 'Sign Up', href: '/sign-up' },
      { text: 'Dashboard', href: '/dashboard' },
    ],
  },
]

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: Twitter, href: 'https://x.com', label: 'X (Twitter)' },
  { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com', label: 'GitHub' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="/" aria-label="Invoice Focus home">
              <Logo size="md" />
            </a>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Professional invoicing for independent professionals and studios. Create,
              send, and get paid — all in one place.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
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
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Invoice Focus. Built for independent professionals & studios.
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground">
              Terms of Service
            </a>
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
