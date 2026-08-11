import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { AuthLayout } from '../layout'
import { AuthCard, AuthField } from '@/components/auth/AuthCard'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase, setRememberMe } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function SignInPage() {
  const [location, navigate] = useLocation()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMeState] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRememberMe(false)
  }, [])

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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setRememberMe(false)
          setErrors({ email: 'Please verify your email before signing in.' })
          toast({ title: 'Sign in failed', description: 'Please verify your email before signing in.', variant: 'destructive' })
        } else if (
          error.code === 'invalid_credentials' ||
          error.message.toLowerCase().includes('invalid login credentials')
        ) {
          setRememberMe(false)
          setErrors({ password: 'Invalid email or password' })
          toast({ title: 'Sign in failed', description: 'Invalid email or password', variant: 'destructive' })
        } else {
          setRememberMe(false)
          setErrors({ password: 'Unable to sign in right now. Please try again.' })
          toast({ title: 'Sign in failed', description: 'Unable to sign in right now. Please try again.', variant: 'destructive' })
        }
        return
      }

      if (data.session) {
        toast({ title: 'Signed in', description: 'Welcome back.' })
        const next = new URLSearchParams(location.split('?')[1] || '').get('next')
        navigate(next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard')
      } else {
        setRememberMe(false)
        setErrors({ password: 'Unable to sign in right now. Please try again.' })
        toast({ title: 'Sign in failed', description: 'Unable to sign in right now. Please try again.', variant: 'destructive' })
      }
    } catch (error) {
      setRememberMe(false)
      setErrors({ password: 'Unable to sign in right now. Please check your connection and try again.' })
      toast({ title: 'Sign in failed', description: 'Unable to sign in right now. Please check your connection and try again.', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <div className="mb-7">
          <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.035em] text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in to continue to Invoice Focus.
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
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors({})
              }}
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
              autoComplete="current-password"
              value={password}
              ref={passwordRef}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors({})
              }}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              disabled={isLoading}
            />
            <div className="-mt-1 flex justify-end">
              <Link
                href="/forgot-password"
                className="rounded-sm text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                Forgot password?
              </Link>
            </div>
          </AuthField>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMeState(checked === true)}
              disabled={isLoading}
            />
            <label htmlFor="remember-me" className="cursor-pointer text-sm text-muted-foreground">
              Remember me
            </label>
          </div>

          <Button type="submit" className="mt-2 h-12 w-full rounded-xl" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="rounded-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Create account
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
