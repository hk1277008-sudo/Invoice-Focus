import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        id={id}
        ref={ref}
        type={isVisible ? 'text' : 'password'}
        className={cn('h-12 rounded-xl bg-background px-4 pr-12 shadow-none', className)}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-controls={id}
        onClick={() => setIsVisible((visible) => !visible)}
        disabled={props.disabled}
        className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:pointer-events-none disabled:opacity-50"
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
})

PasswordInput.displayName = 'PasswordInput'