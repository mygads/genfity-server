import { apiRequest } from "@/services/auth-api"
import { formatPhoneNumber, sendWhatsAppOtp } from "../utils/phone-utils"
import type { AuthResponse, TempCheckoutData, User, VerifyCheckoutOtpResponse } from "../types"

export class CheckoutAuthService {
  // Checkout with phone (for guest users)
  static async checkoutWithPhone(
    phone: string,
    name: string,
    email: string,
  ): Promise<AuthResponse & { checkoutData?: TempCheckoutData; otp?: string }> {
    try {
      const res = await apiRequest<any>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ 
          phone: formatPhoneNumber(phone), 
          name, 
          email 
        }),
      })
      return { error: null, success: true, checkoutData: res.checkoutData, otp: res.otp }
    } catch (error: any) {
      return { error, success: false }
    }
  }  // Verify checkout OTP and create/login user
  static async verifyCheckoutOtp(
    phone: string,
    otp: string,
    tempCheckoutData: TempCheckoutData | null,
    tempOtp: string | null,
  ): Promise<VerifyCheckoutOtpResponse> {
    try {
      const res = await apiRequest<any>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ 
          identifier: formatPhoneNumber(phone), 
          otp,
          purpose: "signup"
        }),
      })
      
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
      }} catch (error: any) {
      return { error, success: false, isNewUser: false, token: undefined, user: undefined }
    }
  }
}
