import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Route, Switch, Router as WouterRouter } from 'wouter'
import NotFound from '@/pages/not-found'
import HomePage from '@/app/(marketing)/page'
import SignInPage from '@/app/(auth)/sign-in/page'
import SignUpPage from '@/app/(auth)/sign-up/page'
import DashboardPage from '@/app/(dashboard)/dashboard/page'

const queryClient = new QueryClient()

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/dashboard/:rest*" component={DashboardPage} />
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
