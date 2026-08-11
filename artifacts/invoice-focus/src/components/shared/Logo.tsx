import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  markOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { mark: 'h-6 w-6', text: 'text-lg' },
  md: { mark: 'h-7 w-7', text: 'text-xl' },
  lg: { mark: 'h-9 w-9', text: 'text-2xl' },
}

/**
 * Official Invoice Focus mark and wordmark. Keep this component as the
 * single product-brand entry point across marketing, auth, dashboard, and
 * invoice shells.
 */
export function Logo({ className, markOnly = false, size = 'md' }: LogoProps) {
  const { mark: markSize, text } = sizes[size]

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <img
        src="/logo-mark.png"
        alt={markOnly ? 'Invoice Focus mark' : 'Invoice Focus'}
        className={cn('block shrink-0 object-contain', markSize)}
        draggable={false}
      />
      {!markOnly && (
        <span className={cn('font-display font-semibold tracking-[-0.04em] text-transparent bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 bg-clip-text', text)}>
          Invoice Focus
        </span>
      )}
    </span>
  )
}