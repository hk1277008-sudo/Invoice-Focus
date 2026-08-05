import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  markOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { wrap: 'h-10 w-auto', text: 'text-[18px]' },
  md: { wrap: 'h-[52px] w-auto', text: 'text-[22px]' },
  lg: { wrap: 'h-16 w-auto', text: 'text-[30px]' },
}

/**
 * Official InvoiceFocus mark and wordmark. Keep this component as the
 * single product-brand entry point across marketing, auth, dashboard, and
 * invoice shells.
 */
export function Logo({ className, markOnly = false, size = 'md' }: LogoProps) {
  const { wrap, text } = sizes[size]

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <img
        src="/invoicefocus-logo.png"
        alt="InvoiceFocus icon"
        className={cn(
          'block shrink-0 object-contain select-none',
    wrap
  )}
  draggable={false}
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
