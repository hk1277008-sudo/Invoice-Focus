import { useState, useEffect } from 'react'
import { Link, useLocation, useSearch } from 'wouter'
import { AuthLayout } from '../layout'
import { AuthCard, AuthField } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
  const search = useSearch()
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSuccess, setIsSuccess] = useState(false)
  const [recoveryReady, setRecoveryReady] = useState(false)

  useEffect(() => {
    let active = true
    const prepareRecovery = async () => {
      const params = new URLSearchParams(search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const tokenValue = params.get('token_hash') || params.get('token') || hashParams.get('token_hash')
      const code = params.get('code')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else if (tokenValue) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenValue,
            type: 'recovery',
          })
          if (error) throw error
        } else {
          throw new Error('Invalid or expired reset link. Please request a new one.')
        }

        const { data } = await supabase.auth.getSession()
        if (!data.session) throw new Error('Invalid or expired reset link. Please request a new one.')
        if (active) setRecoveryReady(true)
      } catch (error) {
        if (active) {
          setErrors({ password: error instanceof Error ? error.message : 'Invalid or expired reset link.' })
          setRecoveryReady(false)
        }
      }
    }
    void prepareRecovery()
    return () => { active = false }
  }, [search])

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!password) nextErrors.password = 'Password is required'
    else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)

    try {
      if (!recoveryReady) {
        setErrors({ password: 'Invalid or expired reset link. Please request a new one.' })
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setErrors({ password: updateError.message || 'Failed to update password.' })
        toast({ title: 'Reset failed', description: updateError.message, variant: 'destructive' })
        return
      }

      setIsSuccess(true)
      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthCard className="text-center">
          <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.035em] text-foreground">
            Password updated
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your password has been reset successfully.
          </p>
          <Link
            href="/sign-in"
            className="mt-7 inline-block rounded-sm text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Sign in
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
            Choose a new password
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            name="username"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <AuthField label="New password" htmlFor="password" error={errors.password}>
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
            label="Confirm new password"
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

          <Button type="submit" className="mt-2 h-12 w-full rounded-xl" disabled={isLoading || !recoveryReady}>
            {isLoading ? 'Updating...' : 'Reset password'}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
