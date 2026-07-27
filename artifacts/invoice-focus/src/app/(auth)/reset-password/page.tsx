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
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(search)
    const tokenValue = params.get('token')
    if (tokenValue) {
      setToken(tokenValue)
    }
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
      if (!token) {
        setErrors({ password: 'Invalid or expired reset link. Please request a new one.' })
        return
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      })

      if (verifyError) {
        setErrors({ password: verifyError.message || 'Invalid or expired reset link.' })
        toast({ title: 'Reset failed', description: verifyError.message, variant: 'destructive' })
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
        <div className="rounded-xl border border-border bg-card px-8 py-10 shadow-sm text-center">
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
      <div className="rounded-xl border border-border bg-card px-8 py-10 shadow-sm">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Choose a new password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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

          <Button type="submit" className="w-full" disabled={isLoading || !token}>
            {isLoading ? 'Updating...' : 'Reset password'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
