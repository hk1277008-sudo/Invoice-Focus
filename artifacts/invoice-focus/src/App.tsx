import { Suspense, lazy } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Route, Switch, Router as WouterRouter } from 'wouter'
import { AuthProvider } from '@/providers/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import NotFound from '@/pages/not-found'
import HomePage from '@/app/(marketing)/page'
import PrivacyPage from '@/app/(marketing)/privacy/page'
import TermsPage from '@/app/(marketing)/terms/page'
import HelpPage from '@/app/(marketing)/help/page'
import PricingPage from '@/app/(marketing)/pricing/page'
import { PlaceholderPage } from '@/app/(marketing)/placeholder-page'
import SignInPage from '@/app/(auth)/sign-in/page'
import SignUpPage from '@/app/(auth)/sign-up/page'
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'
import ResetPasswordPage from '@/app/(auth)/reset-password/page'
import VerifyEmailPage from '@/app/(auth)/verify-email/page'
import DashboardPage from '@/app/(dashboard)/dashboard/page'
import ProfilePage from '@/app/(dashboard)/profile/page'

const InvoicePage = lazy(() => import('@/app/(invoice)/invoice/page'))

const queryClient = new QueryClient()

function InvoicePageFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground">Loading invoice generator...</div>
    </div>
  )
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/guides">
        <PlaceholderPage
          eyebrow="Guides"
          title="Learn the craft of better invoicing."
          description="Practical guidance for creating polished invoices, improving cash flow, and building a calmer billing workflow."
          message="Our guides are coming soon."
        />
      </Route>
      <Route path="/developers">
        <PlaceholderPage
          eyebrow="AI Docs"
          title="Documentation for the next generation of billing."
          description="Explore the future InvoiceFocus platform and learn how intelligent workflows will fit into your business."
          message="AI Docs are coming soon."
        />
      </Route>
      <Route path="/status">
        <PlaceholderPage
          eyebrow="System status"
          title="Everything is running smoothly."
          description="We’ll share live service health, uptime, and incident updates here as InvoiceFocus grows."
          message="Status monitoring is coming soon."
        />
      </Route>
      <Route path="/about">
        <PlaceholderPage
          eyebrow="About InvoiceFocus"
          title="Built for the people behind the work."
          description="InvoiceFocus is creating a more thoughtful, focused way for independent professionals and growing teams to get paid."
          message="Our story is coming soon."
        />
      </Route>
      <Route path="/blog">
        <PlaceholderPage
          eyebrow="The InvoiceFocus journal"
          title="Ideas for better business operations."
          description="Product updates, practical advice, and thoughtful perspectives on invoicing and running a modern business."
          message="The journal is coming soon."
        />
      </Route>
      <Route path="/contact">
        <PlaceholderPage
          eyebrow="Contact"
          title="We’d love to hear from you."
          description="Have a question, idea, or partnership proposal? Our team will make it easy to connect when this space launches."
          message="Contact options are coming soon."
        />
      </Route>
      <Route path="/cookies">
        <PlaceholderPage
          eyebrow="Cookie policy"
          title="A clear approach to privacy."
          description="We’ll explain how InvoiceFocus uses cookies and similar technologies to keep the product secure and useful."
          message="Our Cookie Policy is coming soon."
        />
      </Route>
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/:rest*">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
      <Route path="/invoice">
        <Suspense fallback={<InvoicePageFallback />}>
          <InvoicePage />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
