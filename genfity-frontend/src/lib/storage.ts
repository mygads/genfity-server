export interface UserSession {
  id: string
  name: string
  email: string
  phone: string
  role: string
  image: string | null
  verification: {
    phoneVerified: string | null
    emailVerified: string | null
  }
  token: string
  expiresAt: number // timestamp
}

const STORAGE_KEYS = {
  USER_SESSION: 'user_session',
  TOKEN: 'auth_token'
} as const

// Session duration: 7 days
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export class SessionManager {
  static saveSession(userData: any, token: string): void {
    try {
      const session: UserSession = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        image: userData.image,
        verification: userData.verification,
        token: token,
        expiresAt: Date.now() + SESSION_DURATION
      }

      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session))
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  static getSession(): UserSession | null {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.USER_SESSION)
      
      if (!sessionData) {
        return null
      }

      const session: UserSession = JSON.parse(sessionData)
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error('Error getting session:', error)
      this.clearSession()
      return null
    }
  }

  static getToken(): string | null {
    try {
      const session = this.getSession()
      return session?.token || null
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }

  static isAuthenticated(): boolean {
    const session = this.getSession()
    return session !== null && !!session.token && !!session.id
  }

  static clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION)
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
    } catch (error) {
      console.error('Error clearing session:', error)
    }
  }

  static updateSession(updates: Partial<UserSession>): void {
    try {
      const currentSession = this.getSession()
      
      if (!currentSession) {
        return
      }

      const updatedSession: UserSession = {
        ...currentSession,
        ...updates,
        // Don't allow updating expiresAt through this method
        expiresAt: currentSession.expiresAt
      }

      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(updatedSession))
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  static refreshSession(): void {
    try {
      const currentSession = this.getSession()
      
      if (!currentSession) {
        return
      }

      // Extend session by another 7 days
      const refreshedSession: UserSession = {
        ...currentSession,
        expiresAt: Date.now() + SESSION_DURATION
      }

      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(refreshedSession))
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }
  static getRemainingTime(): number {
    const session = this.getSession()
    
    if (!session) {
      return 0
    }

    return Math.max(0, session.expiresAt - Date.now())
  }

  static isSessionExpiringSoon(minutesThreshold: number = 60): boolean {
    const remainingTime = this.getRemainingTime()
    const thresholdMs = minutesThreshold * 60 * 1000
    
    return remainingTime > 0 && remainingTime < thresholdMs
  }

  // Get time until session expires (in minutes)
  static getTimeUntilExpiry(): number {
    const session = this.getSession()
    if (!session) return 0
    
    const timeLeft = session.expiresAt - Date.now()
    return Math.max(0, Math.floor(timeLeft / (60 * 1000))) // Convert to minutes
  }

  // Show expiry warning (can be used by components)
  static shouldShowExpiryWarning(): boolean {
    const timeLeft = this.getTimeUntilExpiry()
    return timeLeft > 0 && timeLeft <= 30 // Show warning when 30 minutes or less remain
  }

  // Auto-refresh session (extend expiry by 7 days)
  static autoRefreshSession(): boolean {
    try {
      const session = this.getSession()
      if (!session) return false

      // Only refresh if session is still valid but expiring soon
      if (this.isSessionExpiringSoon(120)) { // Check if expiring within 2 hours
        session.expiresAt = Date.now() + SESSION_DURATION
        localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error auto-refreshing session:', error)
      return false
    }
  }

  // Listen for session changes across tabs
  static onSessionChange(callback: (session: UserSession | null) => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USER_SESSION) {
        const session = this.getSession()
        callback(session)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Return cleanup function
    return () => window.removeEventListener('storage', handleStorageChange)
  }
}
