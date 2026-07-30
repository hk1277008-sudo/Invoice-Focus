import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { AuthLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase, getRememberMe, setRememberMe } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { logAuthDiagnostic } from '@/lib/dev-diagnostics'

export default function SignInPage() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMeState] = useState(getRememberMe)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    logAuthDiagnostic('sign-in mounted', {
      rememberMeInitialState: rememberMe,
      rememberMeStorageDefault: false,
    })
  }, [])

  useEffect(() => {
    logAuthDiagnostic('React auth state updated', {
      email,
      passwordLength: password.length,
      controlledPasswordValue: '[redacted]',
      rememberMe,
      isLoading,
      errors,
      passwordDom: passwordRef.current
        ? {
            value: '[redacted]',
            valueLength: passwordRef.current.value.length,
            focused: document.activeElement === passwordRef.current,
            disabled: passwordRef.current.disabled,
            readOnly: passwordRef.current.readOnly,
          }
        : null,
    })
  }, [email, password, rememberMe, isLoading, errors])

  const logPasswordEvent = (event: string, details: Record<string, unknown> = {}) => {
    const input = passwordRef.current
    logAuthDiagnostic(event, {
      ...details,
      inputValue: '[redacted]',
      inputValueLength: input?.value.length ?? 0,
      controlledComponentValue: '[redacted]',
      controlledValueLength: password.length,
      focused: input ? document.activeElement === input : false,
      disabled: input?.disabled ?? false,
      readOnly: input?.readOnly ?? false,
    })
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email'
    if (!password) nextErrors.password = 'Password is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setErrors({})
    setRememberMe(rememberMe)
    logAuthDiagnostic('sign-in submit started', {
      email,
      rememberMe,
      passwordLength: password.length,
    })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      logAuthDiagnostic('Supabase signInWithPassword response', {
        data: {
          session: data.session
            ? {
                hasAccessToken: Boolean(data.session.access_token),
                hasRefreshToken: Boolean(data.session.refresh_token),
                expiresAt: data.session.expires_at,
                userId: data.session.user?.id,
              }
            : null,
          user: data.user ? { id: data.user.id, email: data.user.email } : null,
        },
        error: error
          ? {
              name: error.name,
              message: error.message,
              status: error.status,
              code: error.code,
            }
          : null,
        httpStatus: error?.status ?? 200,
      })

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          logAuthDiagnostic('frontend auth error source', {
            source: 'Supabase signInWithPassword',
            category: 'email-not-confirmed',
            message: 'Please verify your email before signing in.',
            httpStatus: error.status,
          })
          setErrors({ email: 'Please verify your email before signing in.' })
          toast({ title: 'Sign in failed', description: 'Please verify your email before signing in.', variant: 'destructive' })
        } else if (
          error.code === 'invalid_credentials' ||
          error.message.toLowerCase().includes('invalid login credentials')
        ) {
          logAuthDiagnostic('frontend auth error source', {
            source: 'Supabase signInWithPassword',
            category: 'invalid-credentials',
            message: 'Invalid email or password',
            httpStatus: error.status,
          })
          setErrors({ password: 'Invalid email or password' })
          toast({ title: 'Sign in failed', description: 'Invalid email or password', variant: 'destructive' })
        } else {
          logAuthDiagnostic('frontend auth error source', {
            source: 'Supabase signInWithPassword',
            category: 'unexpected-auth-error',
            message: 'Unable to sign in right now. Please try again.',
            httpStatus: error.status,
          })
          setErrors({ password: 'Unable to sign in right now. Please try again.' })
          toast({ title: 'Sign in failed', description: 'Unable to sign in right now. Please try again.', variant: 'destructive' })
        }
        return
      }

      if (data.session) {
        logAuthDiagnostic('authentication succeeded', {
          source: 'Supabase signInWithPassword',
          sessionPresent: true,
          staleErrorsCleared: true,
        })
        toast({ title: 'Signed in', description: 'Welcome back.' })
        navigate('/dashboard')
      } else {
        logAuthDiagnostic('authentication returned without session', {
          source: 'Supabase signInWithPassword',
          sessionPresent: false,
        })
        setErrors({ password: 'Unable to sign in right now. Please try again.' })
        toast({ title: 'Sign in failed', description: 'Unable to sign in right now. Please try again.', variant: 'destructive' })
      }
    } catch (error) {
      logAuthDiagnostic('authentication exception', {
        source: 'Supabase signInWithPassword',
        error,
        networkFailure: true,
      })
      setErrors({ password: 'Unable to sign in right now. Please check your connection and try again.' })
      toast({ title: 'Sign in failed', description: 'Unable to sign in right now. Please check your connection and try again.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
      logAuthDiagnostic('sign-in submit finished', {
        isLoadingAfterSubmit: false,
      })
    }
  }

  return (
    <AuthLayout>
      <div className="rounded-lg border border-border bg-card px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your InvoiceFocus workspace.
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
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors({})
              }}
              aria-invalid={!!errors.email}
              disabled={isLoading}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              ref={passwordRef}
              onFocus={() => logPasswordEvent('password focus')}
              onBlur={() => logPasswordEvent('password blur')}
              onKeyDown={(e) =>
                logPasswordEvent('password keydown', {
                  key: e.key,
                  code: e.code,
                  ctrlKey: e.ctrlKey,
                  metaKey: e.metaKey,
                  shiftKey: e.shiftKey,
                  altKey: e.altKey,
                })
              }
              onInput={(e) =>
                logPasswordEvent('password input', {
                  inputType: e.nativeEvent instanceof InputEvent ? e.nativeEvent.inputType : undefined,
                })
              }
              onChange={(e) => {
                logPasswordEvent('password React onChange', {
                  nextValueLength: e.target.value.length,
                })
                setPassword(e.target.value)
                setErrors({})
              }}
              aria-invalid={!!errors.password}
              disabled={isLoading}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            <div className="mt-3 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMeState(checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="remember-me" className="text-sm font-normal">
              Remember me
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
