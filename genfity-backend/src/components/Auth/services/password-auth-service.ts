import { apiRequest } from "@/services/auth-api"

export class PasswordAuthService {
  static async signInWithPassword(identifier: string, password: string) {
    try {
      // Endpoint harus ke backend sesuai OpenAPI: /signin
      const res = await apiRequest("/auth/sign-in", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      })
      return { error: null, success: true, data: res }
    } catch (error: any) {
      return { error, success: false }
    }
  }

  static async updatePassword(currentPassword: string, newPassword: string, userEmail: string) {
    try {
      const res = await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      return { error: null, success: true, data: res }
    } catch (error: any) {
      return { error, success: false }
    }
  }

  static async resetPassword(identifier: string) {
    try {
      // You may want to ask user for method (email/whatsapp) if identifier is phone
      const method = identifier.includes("@") ? "email" : "whatsapp"
      const res = await apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ identifier, method }),
      })
      return { error: null, success: true, data: res }
    } catch (error: any) {
      return { error, success: false }
    }
  }

  static async verifyPasswordReset(identifier: string, token: string, newPassword: string) {
    try {
      const res = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ identifier, otp: token, newPassword }),
      })
      return { error: null, success: true, data: res }
    } catch (error: any) {
      return { error, success: false }
    }
  }
}
