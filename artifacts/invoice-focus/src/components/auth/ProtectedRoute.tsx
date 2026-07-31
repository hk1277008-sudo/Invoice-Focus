import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/hooks/useAuth'
import { getOnboarding } from '@/lib/onboarding'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const [location, navigate] = useLocation()
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(`/sign-in?next=${encodeURIComponent(location)}`)
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (isLoading || !isAuthenticated || location === '/onboarding' || location.startsWith('/onboarding/')) return
    let active = true
    setCheckingOnboarding(true)
    getOnboarding()
      .then(({ onboarding }) => {
        if (active && onboarding.needsOnboarding) navigate('/onboarding')
      })
      .catch(() => undefined)
      .finally(() => { if (active) setCheckingOnboarding(false) })
    return () => { active = false }
  }, [isAuthenticated, isLoading, location, navigate])

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-svh items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )
    )
  }

  if (checkingOnboarding) {
    return fallback ?? (
        <div className="flex min-h-svh items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">Loading workspace…</div>
        </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
