export interface User {
    id: string
    name: string | null // Allow null for name initially
    email: string | null // Allow null for email initially
    phone?: string | null // Make phone optional and allow null
  }
  
  export interface AuthError {
    message: string
    status?: number // Optional status code
    cause?: any // Keep cause flexible
  }
  
  export interface AuthResponse {
    error: AuthError | Error | null // Allow Supabase AuthError or standard Error
    success: boolean
  }
  
  export interface VerifyOtpResponse extends AuthResponse {
    user?: User | null
  }  export interface VerifyCheckoutOtpResponse extends AuthResponse {
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
    name: string
    email: string
    phone: string
  }
