import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager, UserSession } from '@/lib/storage'

export interface UseAuthGuardOptions {
  redirectTo?: string
  requireAuth?: boolean
  allowedRoles?: string[]
}

export interface UseAuthGuardReturn {
  user: UserSession | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
  refreshSession: () => void
}

export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardReturn {
  const {
    redirectTo = '/signin',
    requireAuth = true,
    allowedRoles = []
  } = options
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasCheckedAuth = useRef(false)

  const checkAuth = useCallback(() => {
    if (hasCheckedAuth.current) return
    hasCheckedAuth.current = true

    try {
      const session = SessionManager.getSession()
      
      if (!session && requireAuth) {
        // No session and auth is required
        const currentPath = window.location.pathname
        // Avoid redirect loop - don't redirect if already on signin page
        if (!currentPath.includes('/signin')) {
          const redirectUrl = `${redirectTo}?redirectedFrom=${encodeURIComponent(currentPath)}`
          router.push(redirectUrl)
        }
        setIsLoading(false)
        return
      }

      if (session && allowedRoles.length > 0) {
        if (!allowedRoles.includes(session.role)) {
          // User doesn't have required role
          SessionManager.clearSession()
          router.push(redirectTo)
          setIsLoading(false)
          return
        }
      }

      setUser(session)
    } catch (error) {
      console.error('Error checking auth:', error)
      if (requireAuth) {
        const currentPath = window.location.pathname
        // Avoid redirect loop - don't redirect if already on signin page
        if (!currentPath.includes('/signin')) {
          router.push(redirectTo)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [requireAuth, allowedRoles, redirectTo, router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Separate useEffect for session expiry check
  useEffect(() => {
    if (!user) return

    // Set up interval to check session expiry
    const interval = setInterval(() => {
      const session = SessionManager.getSession()
      
      if (!session && user) {
        // Session expired
        setUser(null)
        if (requireAuth) {
          const currentPath = window.location.pathname
          // Avoid redirect loop - don't redirect if already on signin page
          if (!currentPath.includes('/signin')) {
            const redirectUrl = `${redirectTo}?redirectedFrom=${encodeURIComponent(currentPath)}&reason=session-expired`
            router.push(redirectUrl)
          }
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [user, requireAuth, redirectTo, router])

  const logout = useCallback(() => {
    SessionManager.clearSession()
    setUser(null)
    router.push(redirectTo)
  }, [router, redirectTo])

  const refreshSession = useCallback(() => {
    SessionManager.refreshSession()
    const updatedSession = SessionManager.getSession()
    setUser(updatedSession)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshSession
  }
}

// Hook for components that need current user info without auth protection
export function useCurrentUser(): UserSession | null {
  const [user, setUser] = useState<UserSession | null>(null)

  useEffect(() => {
    const session = SessionManager.getSession()
    setUser(session)

    // Listen for storage changes (in case user logs out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_session') {
        const newSession = SessionManager.getSession()
        setUser(newSession)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return user
}
