import { useEffect, useState } from 'react'
import { Link, useSearch, useLocation } from 'wouter'
import { AuthLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
        } catch (error) {
          console.error('Failed to send welcome email:', error)
        }
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
      <div className="rounded-xl border border-border bg-card px-8 py-10 shadow-sm text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Email verification
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>

        {status === 'success' && (
          <Button type="button" className="mt-6" onClick={() => navigate('/sign-in')}>
            Sign In
          </Button>
        )}

        {status === 'error' && email && (
          <form onSubmit={handleResend} className="mt-6 space-y-3 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="resend-password">Enter your password to resend</Label>
              <Input
                id="resend-password"
                type="password"
                placeholder="••••••••"
                value={resendPassword}
                onChange={(e) => setResendPassword(e.target.value)}
                disabled={isResending}
              />
              {resendError && <p className="text-xs text-destructive">{resendError}</p>}
            </div>
            <Button type="submit" variant="outline" disabled={isResending || !resendPassword} className="w-full">
              {isResending ? 'Resending...' : 'Resend verification email'}
            </Button>
            <div className="text-center">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {status === 'error' && !email && (
          <Link
            href="/sign-in"
            className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to Sign In
          </Link>
        )}
      </div>
    </AuthLayout>
  )
}
