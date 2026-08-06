import { useState, useEffect } from 'react'
import { Link, useLocation, useSearch } from 'wouter'
import { AuthLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
        <div className="rounded-lg border border-border bg-card px-5 py-8 text-center shadow-sm sm:px-8 sm:py-10">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Password updated
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your password has been reset successfully.
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
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
            Choose a new password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            name="username"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              disabled={isLoading}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!errors.confirmPassword}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !recoveryReady}>
            {isLoading ? 'Updating...' : 'Reset password'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
