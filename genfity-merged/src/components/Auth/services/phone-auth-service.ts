import type { AuthResponse, User, VerifyOtpResponse } from "../types"

export class PhoneAuthService {
  // Step 1: Sign in with phone number to get OTP
  static async signInWithPhone(phone: string): Promise<AuthResponse & { user?: User }> {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone }),
      })
      const res = await response.json()
      return { error: null, success: true, user: res.user }
    } catch (error: any) {
      return { error, success: false }
    }
  }

  // Step 2: Verify OTP
  static async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier: phone, otp }),
      })
      const res = await response.json()
      return { error: null, success: true, user: res.user }
    } catch (error: any) {
      return { error, success: false, user: null }
    }
  }
  
  static async sendOTP(identifier: string): Promise<AuthResponse & { method?: 'email' | 'whatsapp' }> {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          identifier,
          method: identifier.includes("@") ? "email" : "whatsapp",
        }),
      })
      const res = await response.json()
      return { error: null, success: true, method: res.method }
    } catch (error: any) {
      return { error, success: false, method: undefined }
    }
  }

  // Step 3: Complete sign up with email and password
  static async completeSignUp(email: string, password: string, name: string, phone: string | null): Promise<AuthResponse & { user?: User }> {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name, phone }),
      })
      const res = await response.json()
      return { error: null, success: true, user: res.user }
    } catch (error: any) {
      return { error, success: false }
    }
  }
}
