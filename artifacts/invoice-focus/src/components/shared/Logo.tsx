import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  markOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { wrap: 'h-6 w-6', text: 'text-[15px]' },
  md: { wrap: 'h-7 w-7', text: 'text-[18px]' },
  lg: { wrap: 'h-9 w-9', text: 'text-[22px]' },
}

/**
 * Official InvoiceFocus mark and wordmark. Keep this component as the
 * single product-brand entry point across marketing, auth, dashboard, and
 * invoice shells.
 */
export function Logo({ className, markOnly = false, size = 'md' }: LogoProps) {
  const { wrap, text } = sizes[size]

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/invoicefocus-mark.svg"
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
