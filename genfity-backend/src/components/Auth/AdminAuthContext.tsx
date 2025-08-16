"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { User, AuthResponse } from "./types"
import { SessionManager } from "@/lib/storage"

interface AdminUser extends User {
  role: 'admin' | 'super_admin'
}

interface AdminAuthContextType {
  user: AdminUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any; success: boolean }>
  logout: () => Promise<void>
  updateProfile: (data: { name?: string; email?: string }) => Promise<{ error: any; success: boolean }>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any; success: boolean }>
  isAuthenticated: boolean
  error: string | null
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => ({ error: null, success: false }),
  logout: async () => {},
  updateProfile: async () => ({ error: null, success: false }),
  updatePassword: async () => ({ error: null, success: false }),
  isAuthenticated: false,
  error: null,
})

export const useAdminAuth = () => useContext(AdminAuthContext)

// Admin API request helper
const adminApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const session = SessionManager.getSession()
  const token = session ? SessionManager.getToken() : null

  const response = await fetch(`/api/admin${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }))
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Session check
  useEffect(() => {
    const checkAdminSession = async () => {
      setIsLoading(true)
      try {
        // First check localStorage
        const localSession = SessionManager.getSession()
        
        if (localSession && (localSession.role === 'admin' || localSession.role === 'super_admin')) {
          // Verify token with backend
          try {
            const result = await adminApiRequest('/auth/verify', { method: 'POST' })
            if (result.success && result.user) {
              setUser(result.user as AdminUser)
            } else {
              // Invalid session, clear it
              SessionManager.clearSession()
              setUser(null)
            }
          } catch (err) {
            // Token invalid, clear session
            console.warn("[AdminAuth] Token verification failed:", err)
            SessionManager.clearSession()
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (err) {
        console.log("[AdminAuthContext] Session check error:", err)
        SessionManager.clearSession()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkAdminSession()
  }, [])

  // Admin Sign In
  const signIn = async (email: string, password: string) => {
    setError(null)
    try {
      const result = await adminApiRequest('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (result.success && result.user && result.token) {
        // Verify user has admin role
        if (result.user.role !== 'admin' && result.user.role !== 'super_admin') {
          const error = { message: "Access denied. Admin privileges required." }
          setError(error.message)
          return { error, success: false }
        }

        const adminUser = result.user as AdminUser
        
        // Save to localStorage and cookies
        SessionManager.saveSession(adminUser, result.token)
        
        // Set admin token in cookie for middleware
        document.cookie = `admin-token=${result.token}; path=/; secure; samesite=strict; max-age=${7 * 24 * 60 * 60}` // 7 days
        
        setUser(adminUser)
        return { error: null, success: true }
      } else {
        const error = { message: result.message || "Authentication failed" }
        setError(error.message)
        return { error, success: false }
      }
    } catch (err: any) {
      const error = { message: err.message || "Sign in failed" }
      setError(error.message)
      return { error, success: false }
    }
  }

  // Admin Logout
  const logout = async () => {
    try {
      // Clear local session first
      SessionManager.clearSession()
      
      // Clear admin token cookie
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      setUser(null)
      
      // Try to logout from backend (optional)
      try {
        await adminApiRequest("/auth/logout", { method: "POST" })
      } catch (backendError) {
        // Don't block logout if backend call fails
        console.warn("Backend logout failed:", backendError)
      }
      
      // Redirect to admin login
      router.push("/admin/signin")
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setError(err.message)
    }
  }

  // Update Profile
  const updateProfile = async (data: { name?: string; email?: string }) => {
    setError(null)
    if (!user) {
      const err = new Error("User not authenticated")
      setError(err.message)
      return { error: err, success: false }
    }

    try {
      const result = await adminApiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      })

      if (result.success && result.user) {
        const updatedUser = result.user as AdminUser
        // Update localStorage
        const token = SessionManager.getToken()
        if (token) {
          SessionManager.saveSession(updatedUser, token)
        }
        setUser(updatedUser)
        return { error: null, success: true }
      } else {
        const error = { message: result.message || "Profile update failed" }
        setError(error.message)
        return { error, success: false }
      }
    } catch (err: any) {
      const error = { message: err.message || "Profile update failed" }
      setError(error.message)
      return { error, success: false }
    }
  }

  // Update Password
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    setError(null)
    if (!user) {
      const err = new Error("User not authenticated")
      setError(err.message)
      return { error: err, success: false }
    }

    try {
      const result = await adminApiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (result.success) {
        return { error: null, success: true }
      } else {
        const error = { message: result.message || "Password update failed" }
        setError(error.message)
        return { error, success: false }
      }
    } catch (err: any) {
      const error = { message: err.message || "Password update failed" }
      setError(error.message)
      return { error, success: false }
    }
  }

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        logout,
        updateProfile,
        updatePassword,
        isAuthenticated: !!user,
        error,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}
