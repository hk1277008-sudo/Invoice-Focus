import { Link } from 'wouter'
import { AuthLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUpPage() {
  return (
    <AuthLayout>
      <div className="rounded-xl border border-border bg-card px-8 py-10 shadow-sm">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Request early access
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We&apos;re rolling out access gradually. We&apos;ll email you when your spot is ready.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" placeholder="Alex" autoComplete="given-name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" placeholder="Kim" autoComplete="family-name" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@studio.com" autoComplete="email" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">
              Studio or company{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="company" placeholder="Acme Studio" autoComplete="organization" />
          </div>

          <Button type="submit" className="w-full">
            Join the waitlist
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
