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
import { AboutPage, ContactPage, GuidesPage, StatusPage } from '@/app/(marketing)/saas-pages'
import {
  BlogArticlePage,
  BlogIndexPage,
  CookiesPage,
  DocumentGeneratorPage,
  DocumentTemplatePage,
  FeaturesPage,
  HowItWorksPage,
  IndustryPage,
  TemplatesHubPage,
} from '@/app/(marketing)/seo-pages'
import SignInPage from '@/app/(auth)/sign-in/page'
import SignUpPage from '@/app/(auth)/sign-up/page'
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'
import ResetPasswordPage from '@/app/(auth)/reset-password/page'
import VerifyEmailPage from '@/app/(auth)/verify-email/page'
import OnboardingPage from '@/app/onboarding/page'
import DashboardPage from '@/app/(dashboard)/dashboard/page'
import ClientsPage from '@/app/(dashboard)/clients/page'
import RecurringInvoicesPage from '@/app/(dashboard)/recurring/page'
import NewRecurringInvoicePage from '@/app/(dashboard)/recurring/new/page'
import EditRecurringInvoicePage from '@/app/(dashboard)/recurring/[id]/page'
import FeedbackPage from '@/app/(dashboard)/feedback/page'
import ReportsPage from '@/app/(dashboard)/reports/page'
import TemplatesPage from '@/app/(dashboard)/templates/page'
import InvoiceDetailsPage from '@/components/invoice/InvoiceDetailsPage'
import SharedInvoicePage from '@/app/share/[token]/page'
import { RouteSeo } from '@/components/seo/RouteSeo'

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
    <>
      <RouteSeo />
      <Switch>
        <Route path="/" component={HomePage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/guides" component={GuidesPage} />
      <Route path="/status" component={StatusPage} />
      <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/cookies" component={CookiesPage} />
        <Route path="/blog/:slug">
          {(params) => <BlogArticlePage slug={params.slug} />}
        </Route>
        <Route path="/blog" component={BlogIndexPage} />
        <Route path="/templates" component={TemplatesHubPage} />
        <Route path="/features" component={FeaturesPage} />
        <Route path="/how-it-works" component={HowItWorksPage} />
        <Route path="/invoice-generator">
          <DocumentGeneratorPage documentType="invoice" />
        </Route>
        <Route path="/receipt-generator">
          <DocumentGeneratorPage documentType="receipt" />
        </Route>
        <Route path="/estimate-generator">
          <DocumentGeneratorPage documentType="estimate" />
        </Route>
        <Route path="/quote-generator">
          <DocumentGeneratorPage documentType="quote" />
        </Route>
        <Route path="/credit-note-generator">
          <DocumentGeneratorPage documentType="credit-note" />
        </Route>
        <Route path="/purchase-order-generator">
          <DocumentGeneratorPage documentType="purchase-order" />
        </Route>
        <Route path="/invoice-template">
          <DocumentTemplatePage documentType="invoice" />
        </Route>
        <Route path="/receipt-template">
          <DocumentTemplatePage documentType="receipt" />
        </Route>
        <Route path="/estimate-template">
          <DocumentTemplatePage documentType="estimate" />
        </Route>
        <Route path="/quote-template">
          <DocumentTemplatePage documentType="quote" />
        </Route>
        <Route path="/credit-note-template">
          <DocumentTemplatePage documentType="credit-note" />
        </Route>
        <Route path="/purchase-order-template">
          <DocumentTemplatePage documentType="purchase-order" />
        </Route>
        <Route path="/invoice-generator-for-freelancers">
          <IndustryPage industry="freelancers" />
        </Route>
        <Route path="/invoice-generator-for-agencies">
          <IndustryPage industry="agencies" />
        </Route>
        <Route path="/invoice-generator-for-consultants">
          <IndustryPage industry="consultants" />
        </Route>
        <Route path="/invoice-generator-for-designers">
          <IndustryPage industry="designers" />
        </Route>
        <Route path="/invoice-generator-for-developers">
          <IndustryPage industry="developers" />
        </Route>
        <Route path="/invoice-generator-for-photographers">
          <IndustryPage industry="photographers" />
        </Route>
        <Route path="/invoice-generator-for-contractors">
          <IndustryPage industry="contractors" />
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
      <Route path="/dashboard/templates">
        <ProtectedRoute>
          <TemplatesPage />
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
      <Route path="/dashboard/feedback">
        <ProtectedRoute>
          <FeedbackPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/reports">
        <ProtectedRoute>
          <ReportsPage />
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
    </>
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
