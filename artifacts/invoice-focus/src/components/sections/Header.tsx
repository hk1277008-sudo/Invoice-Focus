import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/Logo'

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
      {menuOpen && (
        <div className="absolute inset-x-0 top-[72px] z-50 border-b border-[#E5E7EB] bg-white px-6 py-5 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
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
      )}
    </header>
  )
}
