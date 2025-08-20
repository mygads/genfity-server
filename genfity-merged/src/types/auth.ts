export interface User {
    id: string
    name: string
    email: string
    phone?: string
    role?: string
    image?: string | null
    verification?: {
      phoneVerified?: Date | null
      emailVerified?: Date | null
    }
  }
  
  export interface AuthError {
    message: string
    cause?: Error
  }
    export interface AuthResponse {
    error: AuthError | null
    success: boolean
    // Define expected response structure from your backend
    message?: string
    token?: string
    user?: any // You might want to use the User interface here if applicable
    data?: {
      user: User
      token: string
      passwordGenerated?: boolean
    }
  }
  
  export interface VerifyOtpResponse extends AuthResponse {
    user?: User | null
  }
  
  export interface VerifyCheckoutOtpResponse extends AuthResponse {
    isNewUser: boolean
    user?: User | null
    token?: string
    passwordGenerated?: boolean
  }
  
  export interface ProfileUpdateData {
    name?: string
    email?: string
  }
  
  export interface TempCheckoutData {
    id?: string
    name: string
    email: string
    phone: string
    packages?: string[]
    addons?: string[]
    totalAmount?: number
    createdAt?: Date
    expiresAt?: Date
  }
  
  export interface SignInPayload {
    identifier: string
    password?: string
  }
  
  export interface SignUpPayload {
    name: string
    phone?: string
    email?: string
    password?: string
  }
    export interface VerifyOtpPayload {
    identifier: string
    otp: string
    purpose: "signup" | "reset-password" | "verify-email" | "sso-login"
  }
  
  export interface ResendOtpPayload {
    identifier: string
    purpose: "signup" | "reset-password" | "verify-email" | "sso-login"
  }
  
  export interface SendPasswordResetOtpPayload {
    identifier: string
    method: "email" | "whatsapp"
  }
  
  export interface VerifyPasswordResetOtpPayload {
    identifier: string
    otp: string
    newPassword?: string
  }
  
  export interface SendEmailOtpPayload {
    email: string
  }
