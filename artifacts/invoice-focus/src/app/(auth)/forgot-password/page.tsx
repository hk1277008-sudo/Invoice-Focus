import { useState } from 'react'
import { Link } from 'wouter'
import { AuthLayout } from '../layout'
import { AuthCard, AuthField } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiBaseUrl } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json().catch(() => ({ error: 'Something went wrong' }))

      if (!response.ok) {
        setErrors({ email: data.error || 'Failed to send reset email' })
        toast({ title: 'Request failed', description: data.error, variant: 'destructive' })
        return
      }

      setIsSuccess(true)
      toast({ title: 'Email sent', description: 'Check your inbox for reset instructions.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthCard className="text-center">
          <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.035em] text-foreground">
            Check your email
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
          </p>
          <Link
            href="/sign-in"
            className="mt-7 inline-block rounded-sm text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Back to Sign In
          </Link>
        </AuthCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="mb-7">
          <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.035em] text-foreground">
            Reset your password
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <AuthField label="Work email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              placeholder="you@studio.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              disabled={isLoading}
              className="h-12 rounded-xl bg-background px-4 shadow-none"
            />
          </AuthField>

          <Button type="submit" className="mt-2 h-12 w-full rounded-xl" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link
            href="/sign-in"
            className="rounded-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
