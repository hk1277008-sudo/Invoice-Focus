import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AuthCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'auth-enter rounded-2xl border border-border/80 bg-card px-5 py-7 shadow-[0_18px_50px_-32px_hsl(220_30%_20%_/_0.42)] sm:px-8 sm:py-8',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function AuthField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  const errorId = `${htmlFor}-error`

  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none text-foreground"
      >
        {label}
      </label>
      {children}
      <div className="min-h-4">
        {error ? (
          <p id={errorId} role="alert" className="text-xs leading-4 text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}