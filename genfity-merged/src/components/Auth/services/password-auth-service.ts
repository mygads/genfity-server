export class PasswordAuthService {
  static async signInWithPassword(identifier: string, password: string) {
    try {
      // Endpoint harus ke backend sesuai OpenAPI: /signin
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, password }),
      })
      const res = await response.json()
      return { error: null, success: true, data: res }
    } catch (error: any) {
      return { error, success: false }
    }
  }

  static async updatePassword(currentPassword: string, newPassword: string, userEmail: string) {
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const res = await response.json()
      return { error: null, success: true, data: res }
    } catch (error: any) {
      return { error, success: false }
    }
  }

  static async resetPassword(identifier: string) {
    try {
      // You may want to ask user for method (email/whatsapp) if identifier is phone
      const method = identifier.includes("@") ? "email" : "whatsapp"
      const response = await fetch("/api/auth/send-password-reset-otp", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, method }),
      })
      const res = await response.json()
      return { error: null, success: true, data: res }
    } catch (error: any) {
      return { error, success: false }
    }
  }

  static async verifyPasswordReset(identifier: string, token: string, newPassword: string) {
    try {
      const response = await fetch("/api/auth/verify-password-reset-otp", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, otp: token, newPassword }),
      })
      const res = await response.json()
      return { error: null, success: true, data: res }
    } catch (error: any) {
      return { error, success: false }
    }
  }
}
