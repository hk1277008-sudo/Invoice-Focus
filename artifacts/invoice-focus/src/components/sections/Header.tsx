import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/Logo'
import { cn } from '@/lib/utils'

const NAV_ITEMS = ['Features', 'Templates', 'Resources', 'Blog', 'FAQ']

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-8">
        {/* Logo + brand */}
        <a href="/" aria-label="Invoice Focus home">
          <Logo size="md" />
        </a>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <a href="/sign-in">Sign In</a>
          </Button>
          <Button size="sm" asChild>
            <a href="/sign-up">Get Started</a>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="4" x2="20" y1="7" y2="7" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="17" y2="17" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'fixed left-0 right-0 top-[72px] bottom-0 z-[60] flex flex-col bg-white md:hidden',
          'transition-transform duration-300 ease-out',
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        {/* Logo + subtitle */}
        <div className="border-b border-[#E5E7EB] px-6 py-5">
          <Logo size="md" />
          <p className="mt-1.5 text-sm text-gray-500">Professional Invoicing Made Simple</p>
        </div>

        {/* Navigation — vertically centered */}
        <nav className="flex flex-1 flex-col justify-center gap-0 px-6">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="py-2.5 text-center text-lg font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-[#E5E7EB] px-6 py-5">
          <div className="flex flex-col gap-3">
            <Button variant="ghost" size="default" asChild className="w-full justify-center">
              <a href="/sign-in" onClick={() => setMenuOpen(false)}>
                Sign In
              </a>
            </Button>
            <Button size="default" asChild className="w-full justify-center">
              <a href="/sign-up" onClick={() => setMenuOpen(false)}>
                Get Started
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
