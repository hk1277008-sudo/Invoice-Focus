import { MarketingLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Link } from 'wouter'

export default function HelpPage() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Help Center</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Find answers to common questions about InvoiceFocus.
        </p>

        <div className="mt-10 space-y-6 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">How do I create an invoice?</h2>
            <p>
              Navigate to the Invoice Generator from the home page, fill in your business and client details, add line items, and download or print your invoice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Do I need an account to use InvoiceFocus?</h2>
            <p>
              No. The invoice generator works without an account. Creating an account unlocks future features like saved invoices, clients, and cloud storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How do I reset my password?</h2>
            <p>
              Go to the Sign In page and click “Forgot password?” We will send a secure reset link to your email address.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Why do I need to verify my email?</h2>
            <p>
              Email verification helps keep your account secure and ensures you can recover your account or reset your password when needed.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Button asChild>
            <Link href="/sign-in">Sign in to your account</Link>
          </Button>
        </div>
      </div>
    </MarketingLayout>
  )
}
