"use client"

import { useEffect, useCallback } from 'react'
import { SessionManager } from '@/lib/storage'
import { useRouter } from 'next/navigation'

interface UseSessionMonitorOptions {
  enableAutoRefresh?: boolean
  enableCrossTabSync?: boolean
  onSessionExpired?: () => void
  onSessionRefreshed?: () => void
}

export function useSessionMonitor({
  enableAutoRefresh = true,
  enableCrossTabSync = true,
  onSessionExpired,
  onSessionRefreshed
}: UseSessionMonitorOptions = {}) {
  const router = useRouter()

  const handleSessionExpired = useCallback(() => {
    SessionManager.clearSession()
    
    if (onSessionExpired) {
      onSessionExpired()
    } else {
      // Default behavior: redirect to sign-in
      router.push('/signin?redirectedFrom=/dashboard&reason=session-expired')
    }
  }, [onSessionExpired, router])

  const handleSessionRefreshed = useCallback(() => {
    if (onSessionRefreshed) {
      onSessionRefreshed()
    }
  }, [onSessionRefreshed])

  useEffect(() => {
    if (!enableAutoRefresh) return

    const autoRefreshInterval = setInterval(() => {
      // Check if session is expiring within 2 hours and auto-refresh
      if (SessionManager.isSessionExpiringSoon(120)) {
        const refreshed = SessionManager.autoRefreshSession()
        if (refreshed) {
          handleSessionRefreshed()
        }
      }
      
      // Check if session has already expired
      if (!SessionManager.isAuthenticated()) {
        handleSessionExpired()
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(autoRefreshInterval)
  }, [enableAutoRefresh, handleSessionExpired, handleSessionRefreshed])

  useEffect(() => {
    if (!enableCrossTabSync) return

    // Listen for session changes across tabs
    const unsubscribe = SessionManager.onSessionChange((session) => {
      if (!session) {
        // Session was cleared in another tab
        handleSessionExpired()
      }
    })

    return unsubscribe
  }, [enableCrossTabSync, handleSessionExpired])

  // Manual refresh function
  const refreshSession = useCallback(() => {
    SessionManager.refreshSession()
    handleSessionRefreshed()
  }, [handleSessionRefreshed])

  // Check if session is expiring soon
  const isExpiringSoon = useCallback(() => {
    return SessionManager.shouldShowExpiryWarning()
  }, [])

  // Get time until expiry
  const getTimeUntilExpiry = useCallback(() => {
    return SessionManager.getTimeUntilExpiry()
  }, [])

  return {
    refreshSession,
    isExpiringSoon,
    getTimeUntilExpiry,
    isAuthenticated: SessionManager.isAuthenticated()
  }
}
