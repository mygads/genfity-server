"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { PhoneAuthService } from "./services/phone-auth-service"
import { PasswordAuthService } from "./services/password-auth-service"
import { CheckoutAuthService } from "./services/checkout-auth-service"
import { AuthResponse, ProfileUpdateData, TempCheckoutData, User, VerifyCheckoutOtpResponse, VerifyOtpResponse } from "./types"
import { SessionManager, UserSession } from "@/lib/storage"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithPhone: (identifier: string, password: string) => Promise<{ error: any; success: boolean }>
  verifyOtp: (identifier: string, otp: string) => Promise<{ error: any; success: boolean; user?: User | null }>
  completeSignUp: (email: string, password: string, name: string, phone: string) => Promise<{ error: any; success: boolean }>
  signInWithPassword: (identifier: string, password: string) => Promise<{ error: any; success: boolean }>
  signInWithSSO: (identifier: string) => Promise<{ error: any; success: boolean }>
  verifySSO: (identifier: string, otp: string) => Promise<{ error: any; success: boolean; user?: User | null }>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: { name?: string; email?: string }) => Promise<{ error: any; success: boolean }>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any; success: boolean }>
  resetPassword: (identifier: string) => Promise<{ error: any; success: boolean }>
  verifyPasswordReset: (
    identifier: string,
    token: string,
    newPassword: string,
  ) => Promise<{ error: any; success: boolean }>
  checkoutWithPhone: (phone: string, name: string, email: string) => Promise<{ error: any; success: boolean }>
  verifyCheckoutOtp: (phone: string, token: string) => Promise<{ error: any; success: boolean; isNewUser: boolean; user?: User | null; token?: string; passwordGenerated?: boolean }>;
  resendOtp: (identifier: string, purpose: "signup" | "reset-password" | "verify-email" | "sso-login") => Promise<{ error: any; success: boolean }>
  sendEmailOtp: (email: string) => Promise<{ error: any; success: boolean }>
  isAuthenticated: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signInWithPhone: async () => ({ error: null, success: false }),
  verifyOtp: async () => ({ error: null, success: false, user: null }),
  completeSignUp: async () => ({ error: null, success: false }),
  signInWithPassword: async () => ({ error: null, success: false }),
  signInWithSSO: async () => ({ error: null, success: false }),
  verifySSO: async () => ({ error: null, success: false, user: null }),
  signInWithGoogle: async () => {},
  logout: async () => {},
  updateProfile: async () => ({ error: null, success: false }),
  updatePassword: async () => ({ error: null, success: false }),
  resetPassword: async () => ({ error: null, success: false }),
  verifyPasswordReset: async () => ({ error: null, success: false }),
  checkoutWithPhone: async () => ({ error: null, success: false }),
  verifyCheckoutOtp: async () => ({ error: null, success: false, isNewUser: false, user: null, token: undefined, passwordGenerated: false }),
  resendOtp: async () => ({ error: null, success: false }),
  sendEmailOtp: async () => ({ error: null, success: false }),
  isAuthenticated: false,
  error: null,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tempPhone, setTempPhone] = useState<string | null>(null)
  const [tempOtp, setTempOtp] = useState<string | null>(null)
  const [tempCheckoutData, setTempCheckoutData] = useState<TempCheckoutData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()  // Session check using localStorage first, then backend API
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true)
      try {
        // First check localStorage
        const localSession = SessionManager.getSession()
        
        if (localSession) {
          setUser(localSession)
          setIsLoading(false)
          return
        }

        // If no local session, don't check backend to avoid conflicts
        // Let individual components handle their own redirects
        setUser(null)
      } catch (err) {
        console.log("[AuthContext] Session check error:", err)
        SessionManager.clearSession()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])
  // Phone/Email Authentication Methods
  const signInWithPhone = async (identifier: string, password: string) => {
    setError(null)
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, password })
      })
      const result = await response.json()
      
      if (result.success && result.user) {
        setUser(result.user)
        return { error: null, success: true }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false }
      }
      return { error: { message: "Sign in failed" }, success: false }
    } catch (err: any) {
      const error = { message: err.message || "Sign in failed" }
      setError(error.message)
      return { error, success: false }
    }
  }  // OTP Verification after signup
  const verifyOtp = async (identifier: string, otp: string) => {
    setError(null)
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, otp, purpose: "signup" })
      })
      const result = await response.json()
      console.log("[AuthContext] verifyOtp result:", result)
      
      if (result.success && result.data?.user) {
        const userData = result.data.user
        // Token might be inside user object or separate
        const token = (userData as any).token || result.data?.token
        
        if (token) {
          // Create clean user object without token
          const cleanUserData: User = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone
          }
          
          // Save to localStorage
          SessionManager.saveSession(cleanUserData, token)
          setUser(cleanUserData)
          return { error: null, success: true, user: cleanUserData }
        } else {
          console.warn("[AuthContext] Missing token in verification response:", result)
          return { error: { message: "Verification successful but missing token" }, success: false, user: null }
        }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false, user: null }
      }
      return { error: { message: "OTP verification failed" }, success: false, user: null }
    } catch (err: any) {
      const error = { message: err.message || "OTP verification failed" }
      setError(error.message)
      return { error, success: false, user: null }
    }
  }

  // Signup: requires name, email, whatsapp, password
  const completeSignUp = async (email: string, password: string, name: string, phone: string) => {
    setError(null)
    try {
      const result = await signUp({ name, email, phone, password })
      if (result.success) {
        // Don't set user yet - wait for OTP verification
        return { error: null, success: true }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false }
      }
      return { error: { message: "Sign up failed" }, success: false }
    } catch (err: any) {
      const error = { message: err.message || "Sign up failed" }
      setError(error.message)
      return { error, success: false }
    }
  }  // Password Authentication Methods
  const signInWithPassword = async (identifier: string, password: string) => {
    setError(null)
    try {
      const result = await signIn({ identifier, password })
      console.log("[AuthContext] signInWithPassword result:", result)
      
      if (result.success) {
        // Handle both possible response formats
        const userData = result.data?.user || result.user
        const token = result.data?.token || result.token
        
        if (userData && token) {
          // Save to localStorage
          SessionManager.saveSession(userData, token)
          setUser(userData)
          return { error: null, success: true }
        } else {
          console.warn("[AuthContext] Missing user or token in successful response:", result)
          return { error: { message: "Authentication successful but missing user data" }, success: false }
        }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false }
      }
      return { error: { message: "Sign in failed" }, success: false }
    } catch (err: any) {
      const error = { message: err.message || "Sign in failed" }
      setError(error.message)
      return { error, success: false }
    }
  }

  // SSO Authentication Methods
  const signInWithSSO = async (identifier: string) => {
    setError(null)
    try {
      const result = await ssoSignin(identifier)
      console.log("[AuthContext] signInWithSSO result:", result)
      
      if (result.success) {
        return { error: null, success: true }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false }
      }
      return { error: { message: "SSO sign in failed" }, success: false }    } catch (err: any) {
      const error = { message: err.message || "SSO sign in failed" }
      setError(error.message)
      return { error, success: false }
    }
  }

  const verifySSO = async (identifier: string, otp: string) => {
    setError(null)
    try {
      const result = await verifyOtpAPI({ identifier, otp, purpose: "sso-login" })
      console.log("[AuthContext] verifySSO result:", result)
      
      if (result.success && result.data?.user) {
        const userData = result.data.user
        // Token is inside the user object
        const token = (userData as any).token || result.data?.token
        
        if (token) {
          // Create clean user object without token
          const cleanUserData: User = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone
          }
          
          // Save to localStorage
          SessionManager.saveSession(cleanUserData, token)
          setUser(cleanUserData)
          return { error: null, success: true, user: cleanUserData }
        } else {
          console.warn("[AuthContext] Missing token in SSO response:", result)
          return { error: { message: "Authentication successful but missing token" }, success: false, user: null }
        }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false, user: null }
      }
      return { error: { message: "SSO verification failed" }, success: false, user: null }
    } catch (err: any) {
      const error = { message: err.message || "SSO verification failed" }
      setError(error.message)
      return { error, success: false, user: null }
    }
  }

  // Google Authentication
  const signInWithGoogle = async () => {
    // Implement Google sign-in via backend if needed
    setError("Google sign-in not implemented.")
  }

  // Profile Management
  const updateProfile = async (data: ProfileUpdateData) => {
    setError(null)
    if (!user) {
      const err = new Error("User not authenticated")
      setError(err.message)
      return { error: err, success: false }
    }
  }

  // Password Management
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    setError(null)
    if (!user?.email) {
      const err = new Error("User email not found")
      setError(err.message)
      return { error: err, success: false }
    }
    const result = await PasswordAuthService.updatePassword(currentPassword, newPassword, user.email)
    if (!result.success && result.error) {
      setError(result.error.message)
    }
    return result
  }
  const resetPassword = async (identifier: string) => {
    setError(null)
    try {
      const result = await sendPasswordResetOtp({ identifier, method: "email" })
      if (result.success) {
        return { error: null, success: true }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false }
      }
      return { error: { message: "Password reset failed" }, success: false }
    } catch (err: any) {
      const error = { message: err.message || "Password reset failed" }
      setError(error.message)
      return { error, success: false }
    }
  }

  const verifyPasswordReset = async (identifier: string, token: string, newPassword: string) => {
    setError(null)
    try {
      const result = await verifyPasswordResetOtp({ identifier, otp: token, newPassword })
      if (result.success) {
        return { error: null, success: true }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false }
      }
      return { error: { message: "Password reset verification failed" }, success: false }
    } catch (err: any) {
      const error = { message: err.message || "Password reset verification failed" }
      setError(error.message)
      return { error, success: false }
    }
  }

  // Checkout Authentication
  const checkoutWithPhone = async (phone: string, name: string, email: string) => {
    setError(null)
    const result = await CheckoutAuthService.checkoutWithPhone(phone, name, email)
    if (result.success && result.checkoutData && result.otp) {
      setTempCheckoutData(result.checkoutData)
      setTempOtp(result.otp)
    } else if (result.error) {
      setError(result.error.message)
    }
    return { error: result.error, success: result.success }
  }
  const verifyCheckoutOtp = async (phone: string, token: string) => {
    setError(null)
    const result = await CheckoutAuthService.verifyCheckoutOtp(phone, token, tempCheckoutData, tempOtp)
    if (result.success) {
      setTempOtp(null)
      setTempCheckoutData(null)
      if (result.user && result.token) {
        // Save session to localStorage
        SessionManager.saveSession(result.user, result.token)
        setUser(result.user)
      }
    } else if (result.error) {
      setError(result.error.message)
    }
    return result
  }
  // Resend OTP
  const resendOtpFunc = async (identifier: string, purpose: "signup" | "reset-password" | "verify-email" | "sso-login") => {
    setError(null)
    try {
      const result = await resendOtp({ identifier, purpose })
      if (result.success) {
        return { error: null, success: true }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false }
      }
      return { error: { message: "Resend OTP failed" }, success: false }
    } catch (err: any) {
      const error = { message: err.message || "Resend OTP failed" }
      setError(error.message)
      return { error, success: false }
    }
  }

  // Send Email OTP
  const sendEmailOtpFunc = async (email: string) => {
    setError(null)
    try {
      const result = await sendEmailOtp({ email })
      if (result.success) {
        return { error: null, success: true }
      } else if (result.error) {
        setError(result.error.message)
        return { error: result.error, success: false }
      }
      return { error: { message: "Send email OTP failed" }, success: false }
    } catch (err: any) {
      const error = { message: err.message || "Send email OTP failed" }
      setError(error.message)
      return { error, success: false }
    }
  }
  // Logout
  const logout = async () => {
    try {
      // Clear local session first
      SessionManager.clearSession()
      setUser(null)
      
      // Try to logout from backend (optional)
      try {
        await apiRequest("/auth/logout", { method: "POST" })
      } catch (backendError) {
        // Don't block logout if backend call fails
        console.warn("Backend logout failed:", backendError)
      }
      
      router.push("/signin")
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setError(err.message)
    }
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithPhone,
        verifyOtp,
        completeSignUp,
        signInWithPassword,
        signInWithSSO,
        verifySSO,
        signInWithGoogle,
        logout,
        updateProfile,
        updatePassword,
        resetPassword,
        verifyPasswordReset,
        checkoutWithPhone,
        verifyCheckoutOtp,
        resendOtp: resendOtpFunc,
        sendEmailOtp: sendEmailOtpFunc,
        isAuthenticated: !!user,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
