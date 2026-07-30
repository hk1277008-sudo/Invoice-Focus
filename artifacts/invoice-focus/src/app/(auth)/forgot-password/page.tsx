import { useState } from 'react'
import { Link } from 'wouter'
import { AuthLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
        <div className="rounded-lg border border-border bg-card px-5 py-8 text-center shadow-sm sm:px-8 sm:py-10">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="rounded-lg border border-border bg-card px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@studio.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              disabled={isLoading}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
