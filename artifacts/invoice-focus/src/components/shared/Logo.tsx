import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  markOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { full: 'h-auto w-[8.5rem]', mark: 'h-6 w-6' },
  md: { full: 'h-auto w-[10rem]', mark: 'h-7 w-7' },
  lg: { full: 'h-auto w-[12rem]', mark: 'h-9 w-9' },
}

/**
 * Official InvoiceFocus mark and wordmark. Keep this component as the
 * single product-brand entry point across marketing, auth, dashboard, and
 * invoice shells.
 */
export function Logo({ className, markOnly = false, size = 'md' }: LogoProps) {
  const { full, mark } = sizes[size]

  return (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src={markOnly ? '/logo-mark.png' : '/logo-horizontal.png'}
        alt={markOnly ? 'InvoiceFocus mark' : 'InvoiceFocus'}
        className={cn('block shrink-0 object-contain', markOnly ? mark : full)}
      />
    </span>
  )
}
