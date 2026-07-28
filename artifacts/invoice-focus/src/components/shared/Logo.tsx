import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  markOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { wrap: 'h-5 w-5', text: 'text-sm' },
  md: { wrap: 'h-6 w-6', text: 'text-base' },
  lg: { wrap: 'h-8 w-8', text: 'text-xl' },
}

/**
 * Invoice Focus logomark + wordmark.
 * The mark is an abstract "F" built from ledger-line geometry —
 * two horizontal bars anchored to a vertical stem, evoking both
 * the letter F and the act of structuring financial rows.
 */
export function Logo({ className, markOnly = false, size = 'md' }: LogoProps) {
  const { wrap, text } = sizes[size]

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/invoicefocus-icon.jpg"
        alt="InvoiceFocus icon"
        className={cn('block shrink-0 object-contain', wrap)}
      />
      {!markOnly && (
        <span className={cn('font-display font-semibold tracking-tight', text)}>
          <span className="text-foreground">Invoice</span>
          <span className="text-primary">Focus</span>
        </span>
      )}
    </span>
  )
}
