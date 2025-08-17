"use client"

import { ReactNode } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Loader2 } from 'lucide-react'

interface AuthProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
  allowedRoles?: string[]
  fallback?: ReactNode
}

export function AuthProtectedRoute({ 
  children, 
  redirectTo = '/signin',
  allowedRoles = [],
  fallback 
}: AuthProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuthGuard({
    redirectTo,
    requireAuth: true,
    allowedRoles
  })

  if (isLoading) {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect automatically
  }

  return <>{children}</>
}

// Higher-order component version
export function withAuthProtection<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthProtectedRouteProps, 'children'> = {}
) {
  return function AuthProtectedComponent(props: P) {
    return (
      <AuthProtectedRoute {...options}>
        <Component {...props} />
      </AuthProtectedRoute>
    )
  }
}
