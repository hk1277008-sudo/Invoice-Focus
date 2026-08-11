import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { AuthLayout } from '../layout'
import { AuthCard, AuthField } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiBaseUrl } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function SignUpPage() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!fullName.trim()) nextErrors.fullName = 'Full name is required'
    if (!email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email'
    if (!password) nextErrors.password = 'Password is required'
    else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
    }
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    const signupUrl = `${getApiBaseUrl()}/api/auth/signup`
    try {
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      })

      const responseText = await response.text()
      let data: { error?: string; [key: string]: unknown }
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch {
        data = { error: 'Something went wrong' }
      }

      if (!response.ok) {
        setErrors({ email: data.error || 'Sign up failed' })
        toast({ title: 'Sign up failed', description: data.error, variant: 'destructive' })
        return
      }

      setIsSuccess(true)
      toast({ title: 'Account created', description: 'Check your email to verify your account.' })
    } catch {
      setErrors({ email: 'Unable to create your account right now. Please check your connection and try again.' })
      toast({ title: 'Sign up failed', description: 'Please check your connection and try again.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthCard className="text-center">
          <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.035em] text-foreground">
            Verify your email
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            We sent a verification link to <strong>{email}</strong>. Please click it to activate your account.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-7 h-11 rounded-xl px-5"
            onClick={() => navigate('/sign-in')}
          >
            Go to Sign In
          </Button>
        </AuthCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="mb-7">
          <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.035em] text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Create professional documents in minutes.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <AuthField label="Full name" htmlFor="full-name" error={errors.fullName}>
            <Input
              id="full-name"
              placeholder="Alex Kim"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'full-name-error' : undefined}
              disabled={isLoading}
              className="h-12 rounded-xl bg-background px-4 shadow-none"
            />
          </AuthField>

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

          <AuthField label="Password" htmlFor="password" error={errors.password}>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              disabled={isLoading}
            />
          </AuthField>

          <AuthField
            label="Confirm password"
            htmlFor="confirm-password"
            error={errors.confirmPassword}
          >
            <PasswordInput
              id="confirm-password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              disabled={isLoading}
            />
          </AuthField>

          <Button type="submit" className="mt-2 h-12 w-full rounded-xl" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
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
