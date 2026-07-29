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
 * Official InvoiceFocus icon + premium wordmark.
 * The uploaded mark is rendered as-is; the wordmark uses the existing
 * display type and primary color system for a balanced SaaS identity.
 */
export function Logo({ className, markOnly = false, size = 'md' }: LogoProps) {
  const { wrap, text } = sizes[size]

  return (
    <span className={cn('group/logo inline-flex items-center gap-2.5 transition-transform duration-300 hover:-translate-y-0.5', className)}>
      <img
        src="/invoicefocus-mark.svg"
        alt="InvoiceFocus icon"
        className={cn('block shrink-0 object-contain transition-transform duration-300 group-hover/logo:scale-105', wrap)}
      />
      {!markOnly && (
        <span className={cn('font-display font-bold tracking-[-0.025em] leading-none', text)}>
          <span className="text-foreground transition-colors duration-300 group-hover/logo:text-primary">Invoice</span>
          <span className="text-primary">Focus</span>
        </span>
      )}
    </span>
  )
}
