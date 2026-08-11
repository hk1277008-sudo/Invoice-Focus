import { MarketingLayout } from '../layout'

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="mt-10 space-y-6 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Acceptance of Terms</h2>
            <p>
              By using Invoice Focus, you agree to these Terms of Service. If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when registering.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Use of the Service</h2>
            <p>
              Invoice Focus is provided for creating, managing, and sending invoices. You may not use the service for illegal, abusive, or fraudulent purposes. We reserve the right to suspend accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Limitation of Liability</h2>
            <p>
              Invoice Focus is provided as-is. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  )
}
