"use client"

import { useState, useEffect } from 'react'
import { SessionManager } from '@/lib/storage'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface SessionExpiryWarningProps {
  onExtendSession?: () => void
}

export default function SessionExpiryWarning({ onExtendSession }: SessionExpiryWarningProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkSessionExpiry = () => {
      const shouldShow = SessionManager.shouldShowExpiryWarning()
      const minutes = SessionManager.getTimeUntilExpiry()
      
      setShowWarning(shouldShow)
      setTimeLeft(minutes)

      // If session has expired, redirect to sign-in
      if (minutes === 0 && !SessionManager.isAuthenticated()) {
        router.push('/signin?redirectedFrom=/dashboard&reason=session-expired')
      }
    }

    // Check immediately
    checkSessionExpiry()

    // Check every minute
    const interval = setInterval(checkSessionExpiry, 60000)

    return () => clearInterval(interval)
  }, [router])

  const handleExtendSession = () => {
    SessionManager.refreshSession()
    setShowWarning(false)
    
    if (onExtendSession) {
      onExtendSession()
    }
  }

  const handleSignOut = () => {
    SessionManager.clearSession()
    router.push('/signin')
  }

  if (!showWarning) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Session Expiring Soon
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''}. 
                  Would you like to extend your session?
                </p>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleExtendSession}
                  className="bg-yellow-400 hover:bg-yellow-500 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Extend Session
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-transparent hover:bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowWarning(false)}
                className="text-yellow-400 hover:text-yellow-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
