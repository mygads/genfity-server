import { useState } from 'react'
import { 
  signIn, 
  signUp, 
  verifyOtp, 
  resendOtp, 
  sendPasswordResetOtp, 
  verifyPasswordResetOtp, 
  sendEmailOtp 
} from '@/services/auth-api'
import { formatPhoneNumber, getIdentifierType } from '@/lib/auth-utils'

export interface UseAuthActionsReturn {
  // Sign In
  signInUser: (identifier: string, password: string) => Promise<{ success: boolean; error?: any; user?: any }>
  
  // Sign Up
  signUpUser: (data: { name: string; phone?: string; email?: string; password: string }) => Promise<{ success: boolean; error?: any }>
    // OTP Operations
  verifyUserOtp: (identifier: string, otp: string, purpose: "signup" | "reset-password" | "verify-email" | "sso-login") => Promise<{ success: boolean; error?: any; user?: any }>
  resendUserOtp: (identifier: string, purpose: "signup" | "reset-password" | "verify-email" | "sso-login") => Promise<{ success: boolean; error?: any }>
  
  // Password Reset
  requestPasswordReset: (identifier: string, method?: "email" | "whatsapp") => Promise<{ success: boolean; error?: any }>
  verifyPasswordReset: (identifier: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: any }>
  
  // Email Verification
  requestEmailVerification: (email: string) => Promise<{ success: boolean; error?: any }>
  
  // Loading states
  isLoading: boolean
  error: string | null
}

export function useAuthActions(): UseAuthActionsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signInUser = async (identifier: string, password: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signIn({ identifier, password })
      
      if (result.success) {
        return { success: true, user: result.user }
      } else {
        const errorMessage = result.error?.message || "Sign in failed"
        setError(errorMessage)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred"
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }

  const signUpUser = async (data: { name: string; phone?: string; email?: string; password: string }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Format phone number if provided
      const formattedData = {
        ...data,
        phone: data.phone ? formatPhoneNumber(data.phone) : undefined
      }
      
      const result = await signUp(formattedData)
      
      if (result.success) {
        return { success: true }
      } else {
        const errorMessage = result.error?.message || "Sign up failed"
        setError(errorMessage)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred"
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }
  const verifyUserOtp = async (identifier: string, otp: string, purpose: "signup" | "reset-password" | "verify-email" | "sso-login") => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await verifyOtp({ identifier, otp, purpose })
      
      if (result.success) {
        return { success: true, user: result.user }
      } else {
        const errorMessage = result.error?.message || "OTP verification failed"
        setError(errorMessage)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred"
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }
  const resendUserOtp = async (identifier: string, purpose: "signup" | "reset-password" | "verify-email" | "sso-login") => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await resendOtp({ identifier, purpose })
      
      if (result.success) {
        return { success: true }
      } else {
        const errorMessage = result.error?.message || "Failed to resend OTP"
        setError(errorMessage)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred"
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }

  const requestPasswordReset = async (identifier: string, method?: "email" | "whatsapp") => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Auto-detect method if not provided
      const detectedMethod = method || (getIdentifierType(identifier) === "email" ? "email" : "whatsapp")
      
      const result = await sendPasswordResetOtp({ identifier, method: detectedMethod })
      
      if (result.success) {
        return { success: true }
      } else {
        const errorMessage = result.error?.message || "Failed to send password reset code"
        setError(errorMessage)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred"
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }

  const verifyPasswordReset = async (identifier: string, otp: string, newPassword: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await verifyPasswordResetOtp({ identifier, otp, newPassword })
      
      if (result.success) {
        return { success: true }
      } else {
        const errorMessage = result.error?.message || "Password reset verification failed"
        setError(errorMessage)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred"
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }

  const requestEmailVerification = async (email: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await sendEmailOtp({ email })
      
      if (result.success) {
        return { success: true }
      } else {
        const errorMessage = result.error?.message || "Failed to send email verification code"
        setError(errorMessage)
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred"
      setError(errorMessage)
      return { success: false, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    signInUser,
    signUpUser,
    verifyUserOtp,
    resendUserOtp,
    requestPasswordReset,
    verifyPasswordReset,
    requestEmailVerification,
    isLoading,
    error
  }
}
