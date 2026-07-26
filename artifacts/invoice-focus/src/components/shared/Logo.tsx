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
      <span
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-[6px] bg-primary',
          wrap
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-[58%] w-[58%]" aria-hidden="true">
          {/* Vertical stem */}
          <rect x="3" y="3" width="2.5" height="14" rx="1" fill="white" />
          {/* Top horizontal bar */}
          <rect x="3" y="3" width="11" height="2.5" rx="1" fill="white" />
          {/* Mid horizontal bar */}
          <rect x="3" y="8.75" width="8" height="2.5" rx="1" fill="white" />
        </svg>
      </span>
      {!markOnly && (
        <span
          className={cn('font-display font-semibold tracking-tight text-foreground', text)}
        >
          Invoice Focus
        </span>
      )}
    </span>
  )
}
