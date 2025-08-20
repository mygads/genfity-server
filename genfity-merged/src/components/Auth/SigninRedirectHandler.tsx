"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SessionManager } from '@/lib/storage'

interface SigninRedirectHandlerProps {
  redirectTo: string
  children: React.ReactNode
}

export default function SigninRedirectHandler({ redirectTo, children }: SigninRedirectHandlerProps) {
  const router = useRouter()

  useEffect(() => {
    // Only check once when component mounts
    const session = SessionManager.getSession()
    
    if (session) {
      // User is already authenticated, redirect based on role
      if (session.role === 'admin' || session.role === 'super_admin') {
        // Admin users go to admin dashboard
        router.push('/admin/dashboard')
      } else {
        // Customer users go to specified redirect or customer dashboard
        router.push(redirectTo)
      }
    }
  }, [router, redirectTo])

  // Always render children (signin form) - redirect will happen if needed
  return <>{children}</>
}
