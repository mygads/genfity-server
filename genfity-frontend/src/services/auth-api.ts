import {
  SignInPayload,
  SignUpPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  SendPasswordResetOtpPayload,
  VerifyPasswordResetOtpPayload,
  SendEmailOtpPayload,
  AuthResponse,
} from "../types/auth"
import { ENV } from "../lib/env"
import { SessionManager } from "../lib/storage"

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
    const url = `${ENV.BACKEND_URL}/api${path}`
    
    // Get the authentication token from storage
    const token = SessionManager.getToken()
    
    const headers = {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        // Include Authorization header if token exists
        ...(token && { "Authorization": `Bearer ${token}` })
    }
    
    try {
        const res = await fetch(url, { ...options, headers})
        
        if (!res.ok) {
            let error
            try {
                error = await res.json()
            } catch {
                error = { message: res.statusText }
            }
            
            // Return standardized error response instead of throwing
            return {
                success: false,
                error: {
                    message: error.message || error.error || res.statusText
                },
                data: null
            } as T
        }
        
        const result = await res.json()
        
        // Standardize the response format
        return {
            success: true,
            error: null,
            ...result
        } as T
        
    } catch (error: any) {
        // Handle network errors or JSON parsing errors
        return {
            success: false,
            error: {
                message: error.message || "Network error occurred"
            },
            data: null
        } as T
    }
}

export async function signIn(payload: SignInPayload) {
  return apiRequest<AuthResponse>("/auth/signin", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function signUp(payload: SignUpPayload) {
  return apiRequest<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  return apiRequest<AuthResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function resendOtp(payload: ResendOtpPayload) {
  return apiRequest<AuthResponse>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function sendPasswordResetOtp(
  payload: SendPasswordResetOtpPayload
) {
  return apiRequest<AuthResponse>("/auth/send-password-reset-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function verifyPasswordResetOtp(
  payload: VerifyPasswordResetOtpPayload
) {
  return apiRequest<AuthResponse>("/auth/verify-password-reset-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function sendEmailOtp(payload: SendEmailOtpPayload) {
  return apiRequest<AuthResponse>("/auth/send-email-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function ssoSignin(identifier: string) {
  return apiRequest<AuthResponse>("/auth/sso-signin", {
    method: "POST",
    body: JSON.stringify({ identifier }),
  })
}

// Profile API functions
export async function getProfile() {
  return apiRequest<{
    success: boolean
    data: {
      id: string
      name: string
      email: string
      phone: string
      image: string | null
      emailVerified: string | null
      phoneVerified: string | null
      role: string
      _count: {
        transactions: number
      }
      verification: {
        emailVerified: boolean
        phoneVerified: boolean
      }
      stats: {
        totalTransactions: number
        totalWhatsappTransactions: number
        activeWhatsappServices: number
        totalWhatsappServices: number
      }
    }
  }>("/customer/profile", {
    method: "GET",
  })
}

export async function updateProfile(data: { name?: string; email?: string }) {
  return apiRequest<AuthResponse>("/customer/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

// Resend email verification
export async function resendEmailVerification() {
  return apiRequest<AuthResponse>("/auth/resend-email-verification", {
    method: "POST",
  })
}

// Upload profile image
export async function uploadProfileImage(file: File) {
  const formData = new FormData()
  formData.append('image', file)
  
  const token = SessionManager.getToken()
  
  const headers = {
    ...(token && { "Authorization": `Bearer ${token}` })
  }
  
  try {
    const res = await fetch(`${ENV.BACKEND_URL}/api/customer/profile/image`, {
      method: "POST",
      headers,
      body: formData,
    })
    
    if (!res.ok) {
      let error
      try {
        error = await res.json()
      } catch {
        error = { message: res.statusText }
      }
      
      return {
        success: false,
        error: {
          message: error.message || error.error || res.statusText
        },
        data: null
      }
    }
    
    const result = await res.json()
    
    return {
      success: true,
      error: null,
      ...result
    }
    
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || "Network error occurred"
      },
      data: null
    }
  }
}
