import { useEffect, useState } from 'react'
import { Link, useSearch, useLocation } from 'wouter'
import { AuthLayout } from '../layout'
import { AuthCard, AuthField } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase, getApiBaseUrl } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function VerifyEmailPage() {
  const search = useSearch()
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('Verifying your email...')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendPassword, setResendPassword] = useState('')
  const [resendError, setResendError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const tokenValue = params.get('token') || params.get('token_hash') || hashParams.get('token_hash')
    const emailValue = params.get('email') || ''
    setEmail(emailValue)

    if (!tokenValue) {
      setStatus('error')
      setMessage('Invalid verification link. The token is missing.')
      return
    }

    setToken(tokenValue)

    const verify = async () => {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenValue,
        type: 'email',
      })

      if (error) {
        setStatus('error')
        setMessage(error.message || 'The verification link is invalid or expired.')
        return
      }

      if (data.user) {
        try {
          const { data: sessionData } = await supabase.auth.getSession()
          await fetch(`${getApiBaseUrl()}/api/auth/welcome`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(sessionData.session?.access_token
                ? { Authorization: `Bearer ${sessionData.session.access_token}` }
                : {}),
            },
            body: JSON.stringify({
              fullName: data.user.user_metadata?.full_name,
            }),
          })
        } catch { /* Verification is complete even if the welcome email is unavailable. */ }
      }

      setStatus('success')
      setMessage('Your email has been verified. You can now sign in.')
    }

    verify()
  }, [search])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !resendPassword || isResending) return
    setIsResending(true)
    setResendError('')

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: resendPassword }),
      })

      const data = await response.json().catch(() => ({ error: 'Something went wrong' }))

      if (!response.ok) {
        setResendError(data.error || 'Failed to resend verification email')
        toast({ title: 'Resend failed', description: data.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Email sent', description: 'A new verification link has been sent.' })
      setResendPassword('')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard className="text-center">
        <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.035em] text-foreground">
          Email verification
        </h1>
        <p
          className="mt-3 text-sm leading-6 text-muted-foreground"
          role={status === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message}
        </p>

        {status === 'success' && (
          <Button type="button" className="mt-7 h-11 rounded-xl px-5" onClick={() => navigate('/sign-in')}>
            Sign In
          </Button>
        )}

        {status === 'error' && email && (
          <form onSubmit={handleResend} className="mt-7 space-y-3 text-left">
            <AuthField label="Enter your password to resend" htmlFor="resend-password" error={resendError}>
              <PasswordInput
                id="resend-password"
                placeholder="••••••••"
                value={resendPassword}
                onChange={(e) => setResendPassword(e.target.value)}
                disabled={isResending}
              />
            </AuthField>
            <Button type="submit" variant="outline" disabled={isResending || !resendPassword} className="h-11 w-full rounded-xl">
              {isResending ? 'Resending...' : 'Resend verification email'}
            </Button>
            <div className="text-center">
              <Link
                href="/sign-in"
                className="rounded-sm text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {status === 'error' && !email && (
          <Link
            href="/sign-in"
            className="mt-7 inline-block rounded-sm text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Back to Sign In
          </Link>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
