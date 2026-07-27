import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const [, navigate] = useLocation()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/sign-in')
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-svh items-center justify-center bg-background">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
