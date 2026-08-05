import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  markOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { wrap: 'h-8 w-8', text: 'text-[16px]' },
  md: { wrap: 'h-10 w-10', text: 'text-[20px]' },
  lg: { wrap: 'h-12 w-12', text: 'text-[26px]' },
}

/**
 * Official InvoiceFocus mark and wordmark. Keep this component as the
 * single product-brand entry point across marketing, auth, dashboard, and
 * invoice shells.
 */
export function Logo({ className, markOnly = false, size = 'md' }: LogoProps) {
  const { wrap, text } = sizes[size]

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <img
        src="/invoicefocus-logo.png"
        alt="InvoiceFocus icon"
        className={cn('block shrink-0 object-contain', wrap)}
      />
      {!markOnly && (
        <span className={cn('font-display font-bold tracking-[-0.025em] leading-none', text)}>
           <span className="text-foreground">Invoice</span>
          <span className="text-primary">Focus</span>
        </span>
      )}
    </span>
  )
}
