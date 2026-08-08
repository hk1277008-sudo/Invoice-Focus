import { MarketingLayout } from '../layout'
import { Button } from '@/components/ui/button'
import { Link } from 'wouter'
import { useAuth } from '@/hooks/useAuth'

const guideGroups = [
  {
    title: 'Creating business documents',
    items: [
      ['Create an invoice', 'Add business and client details, line items, totals, and payment terms before exporting a professional invoice.', '/invoice-generator'],
      ['Create a quote', 'Present proposed scope and pricing before work begins with a clear client-ready quote.', '/quote-generator'],
      ['Create an estimate', 'Outline expected project work and costs while the final scope is still taking shape.', '/estimate-generator'],
      ['Create a receipt', 'Record a completed payment with a concise summary of the client, items, and amount paid.', '/receipt-generator'],
      ['Create a credit note', 'Document a billing reduction or correction with reference details and a clear reason.', '/credit-note-generator'],
      ['Create a purchase order', 'Prepare a supplier request with requested items, quantities, delivery details, and notes.', '/purchase-order-generator'],
    ],
  },
  {
    title: 'Templates and export',
    items: [
      ['Choose a template', 'Compare the available visual families and open the generator with a suitable starting point.', '/templates'],
      ['Use a document template', 'Explore invoice, quote, estimate, receipt, credit note, and purchase order template pages.', '/invoice-template'],
      ['Export a PDF', 'Review the finished document, then use the generator controls to download or print a polished PDF.', '/how-it-works'],
    ],
  },
  {
    title: 'Account questions',
    items: [
      ['Do I need an account?', 'The public generator is available without an account. An account is required for authenticated workspace features such as saved records.', '/sign-in'],
      ['Reset a password', 'Go to Sign In and choose Forgot password to request a secure reset link.', '/forgot-password'],
      ['Verify an email address', 'Email verification helps protect access and supports account recovery and password reset.', '/sign-in'],
    ],
  },
]

export default function HelpPage() {
  const { isAuthenticated } = useAuth()
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Help Center</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">Find practical guidance for creating invoices and related documents, choosing templates, exporting PDFs, and managing your account.</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {guideGroups.map((group) => (
            <section key={group.title} className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">{group.title}</h2>
              <div className="mt-5 space-y-5">
                {group.items.map(([title, copy, href]) => (
                  <div key={title}>
                    <h3 className="text-sm font-semibold text-foreground">
                      <Link href={href} className="hover:text-primary hover:underline">{title}</Link>
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10">
          {isAuthenticated ? (
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/sign-in">Sign in to your account</Link>
            </Button>
          )}
        </div>
      </div>
    </MarketingLayout>
  )
}
