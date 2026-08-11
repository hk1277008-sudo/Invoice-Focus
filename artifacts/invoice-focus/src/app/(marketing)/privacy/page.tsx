import { MarketingLayout } from '../layout'

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="mt-10 space-y-6 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Information We Collect</h2>
            <p>
              We collect the information you provide when creating an account, such as your name, email address, and profile photo. We also collect invoice data that you create and store in your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How We Use Your Information</h2>
            <p>
              We use your information to provide, maintain, and improve Invoice Focus. This includes authenticating your account, sending transactional emails, and storing your invoices and preferences.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Data Security</h2>
            <p>
              We use industry-standard security practices and rely on trusted providers such as Supabase for authentication and data storage. We never store passwords in plain text.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us through your account dashboard or at the support email associated with your account.
            </p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  )
}
