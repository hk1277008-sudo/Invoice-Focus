import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { AuthLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase, setRememberMe } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function SignInPage() {
  const [location, navigate] = useLocation()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMeState] = useState(false)
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
      <div className="rounded-lg border border-border bg-card px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your InvoiceFocus account.
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
              onChange={(e) => {
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
