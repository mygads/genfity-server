import type { AuthResponse, TempCheckoutData, User, VerifyCheckoutOtpResponse } from "../types"

export class CheckoutAuthService {
  // Checkout with phone (for guest users)
  static async checkoutWithPhone(
    phone: string,
    name: string,
    email: string,
  ): Promise<AuthResponse & { checkoutData?: TempCheckoutData; otp?: string }> {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          phone: phone, 
          name, 
          email 
        }),
      })
      const res = await response.json()
      return { error: undefined, success: true, checkoutData: res.checkoutData, otp: res.otp }
    } catch (error: any) {
      return { error: error.message || 'Checkout failed', success: false }
    }
  }  // Verify checkout OTP and create/login user
  static async verifyCheckoutOtp(
    phone: string,
    otp: string,
    tempCheckoutData: TempCheckoutData | null,
    tempOtp: string | null,
  ): Promise<VerifyCheckoutOtpResponse> {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          identifier: phone, 
          otp,
          purpose: "signup"
        }),
      })
      const res = await response.json()
      
      // Extract data from the nested response structure
      const userData = res.data?.user || res.user
      const token = res.data?.token || res.token
      const passwordGenerated = res.data?.passwordGenerated || res.passwordGenerated
      
      return { 
        error: null, 
        success: true, 
        isNewUser: passwordGenerated, // If password was generated, it's a new user
        user: userData,
        token: token,
        passwordGenerated: passwordGenerated
      }
    } catch (error: any) {
      return { error: error.message || 'Verification failed', success: false, isNewUser: false, token: undefined, user: undefined }
    }
  }
}
