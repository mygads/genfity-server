export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  // Indonesian phone number validation
  const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/
  return phoneRegex.test(phone)
}

export function formatPhoneNumber(phone: string): string {
  // Convert to international format (+62)
  if (phone.startsWith("0")) {
    return "+62" + phone.substring(1)
  }
  if (phone.startsWith("62") && !phone.startsWith("+62")) {
    return "+" + phone
  }
  if (!phone.startsWith("+")) {
    return "+62" + phone
  }
  return phone
}

export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" }
  }
  
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: "Password must contain both letters and numbers" }
  }
  
  return { valid: true }
}

export function getIdentifierType(identifier: string): "email" | "phone" {
  return isValidEmail(identifier) ? "email" : "phone"
}

export function validateOtp(otp: string): { valid: boolean; message?: string } {
  if (otp.length !== 4) {
    return { valid: false, message: "OTP must be 4 digits" }
  }
  
  if (!/^\d{4}$/.test(otp)) {
    return { valid: false, message: "OTP must contain only numbers" }
  }
  
  return { valid: true }
}
