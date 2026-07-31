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
import { AboutPage, AIDocsPage, BlogPage, ContactPage, GuidesPage, StatusPage } from '@/app/(marketing)/saas-pages'
import SignInPage from '@/app/(auth)/sign-in/page'
import SignUpPage from '@/app/(auth)/sign-up/page'
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'
import ResetPasswordPage from '@/app/(auth)/reset-password/page'
import VerifyEmailPage from '@/app/(auth)/verify-email/page'
import OnboardingPage from '@/app/onboarding/page'
import DashboardPage from '@/app/(dashboard)/dashboard/page'
import ProfilePage from '@/app/(dashboard)/profile/page'
import ClientsPage from '@/app/(dashboard)/clients/page'
import RecurringInvoicesPage from '@/app/(dashboard)/recurring/page'
import NewRecurringInvoicePage from '@/app/(dashboard)/recurring/new/page'
import EditRecurringInvoicePage from '@/app/(dashboard)/recurring/[id]/page'
import SettingsPage from '@/app/(dashboard)/settings/page'
import FeedbackPage from '@/app/(dashboard)/feedback/page'
import UpgradePage from '@/app/(dashboard)/upgrade/page'
import BillingPage from '@/app/(dashboard)/billing/page'
import BillingSuccessPage from '@/app/(dashboard)/billing/success/page'
import ReportsPage from '@/app/(dashboard)/reports/page'
import InvoiceDetailsPage from '@/components/invoice/InvoiceDetailsPage'
import { SubscriptionProvider } from '@/providers/SubscriptionProvider'
import SharedInvoicePage from '@/app/share/[token]/page'

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
      <Route path="/guides" component={GuidesPage} />
      <Route path="/developers" component={AIDocsPage} />
      <Route path="/status" component={StatusPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/cookies">
        <PrivacyPage />
      </Route>
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/onboarding">
        <ProtectedRoute>
          <OnboardingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/clients">
        <ProtectedRoute>
          <ClientsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/recurring">
        <ProtectedRoute>
          <RecurringInvoicesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/recurring/new">
        <ProtectedRoute>
          <NewRecurringInvoicePage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/recurring/:id">
        <ProtectedRoute>
          <EditRecurringInvoicePage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/feedback">
        <ProtectedRoute>
          <FeedbackPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/upgrade">
        <ProtectedRoute>
          <UpgradePage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/billing">
        <ProtectedRoute>
          <BillingPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/billing/success">
        <ProtectedRoute>
          <BillingSuccessPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/reports">
        <ProtectedRoute>
          <ReportsPage />
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
      <Route path="/invoice/:id">
        {(params) => <ProtectedRoute><InvoiceDetailsPage id={params.id} /></ProtectedRoute>}
      </Route>
      <Route path="/share/:token" component={SharedInvoicePage} />
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
