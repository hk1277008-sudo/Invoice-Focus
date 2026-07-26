import { Link } from 'wouter'
import { AuthLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignInPage() {
  return (
    <AuthLayout>
      <div className="rounded-xl border border-border bg-card px-8 py-10 shadow-sm">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your Invoice Focus workspace.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@studio.com" autoComplete="email" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Request access
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
