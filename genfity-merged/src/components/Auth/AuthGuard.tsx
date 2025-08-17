"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/storage'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function AuthGuard({ children, redirectTo = '/signin' }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const session = SessionManager.getSession()
        
        if (!session) {
          // No session, redirect to signin
          const currentPath = window.location.pathname
          const redirectUrl = `${redirectTo}?redirectedFrom=${encodeURIComponent(currentPath)}`
          router.push(redirectUrl)
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth check error:', error)
        const currentPath = window.location.pathname
        const redirectUrl = `${redirectTo}?redirectedFrom=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Check session every minute
    const interval = setInterval(() => {
      const session = SessionManager.getSession()
      if (!session) {
        setIsAuthenticated(false)
        const currentPath = window.location.pathname
        const redirectUrl = `${redirectTo}?redirectedFrom=${encodeURIComponent(currentPath)}&reason=session-expired`
        router.push(redirectUrl)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [router, redirectTo])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}
