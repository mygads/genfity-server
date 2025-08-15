# Authentication API Documentation

## Overview

Sistem autentikasi ini menyediakan layanan API yang dapat digunakan kembali untuk berbagai operasi autentikasi termasuk sign in, sign up, verifikasi OTP, reset password, dan verifikasi email.

## File Structure

```
src/
├── services/
│   └── auth-api.ts          # Core API functions
├── types/
│   └── auth.ts              # TypeScript interfaces
├── components/Auth/
│   └── AuthContext.tsx      # React Context untuk state management
├── hooks/
│   └── useAuthActions.ts    # Custom hook untuk auth operations
├── lib/
│   └── auth-utils.ts        # Utility functions
└── app/[locale]/
    ├── signin/page.tsx      # Sign in page
    ├── signup/page.tsx      # Sign up page
    ├── signin/forgot-password/page.tsx  # Forgot password page
    └── email-verification/page.tsx     # Email verification page
```

## Core API Functions

### 1. Sign In
```typescript
import { signIn } from '@/services/auth-api'

const result = await signIn({
  identifier: "081233784490", // email atau nomor telepon
  password: "1234abcd"
})
```

### 2. Sign Up
```typescript
import { signUp } from '@/services/auth-api'

const result = await signUp({
  name: "Yoga Admin",
  phone: "081233784490",    // optional
  email: "user@example.com", // optional
  password: "1234abcd"      // optional
})
```

### 3. Verify OTP
```typescript
import { verifyOtp } from '@/services/auth-api'

const result = await verifyOtp({
  identifier: "081233784490",
  otp: "1594",
  purpose: "signup" // "signup" | "reset-password" | "verify-email"
})
```

### 4. Resend OTP
```typescript
import { resendOtp } from '@/services/auth-api'

const result = await resendOtp({
  identifier: "081233784490",
  purpose: "signup"
})
```

### 5. Send Password Reset OTP
```typescript
import { sendPasswordResetOtp } from '@/services/auth-api'

const result = await sendPasswordResetOtp({
  identifier: "user@example.com",
  method: "email" // "email" | "whatsapp"
})
```

### 6. Verify Password Reset OTP
```typescript
import { verifyPasswordResetOtp } from '@/services/auth-api'

const result = await verifyPasswordResetOtp({
  identifier: "081233784490",
  otp: "9166",
  newPassword: "newpassword123"
})
```

### 7. Send Email OTP
```typescript
import { sendEmailOtp } from '@/services/auth-api'

const result = await sendEmailOtp({
  email: "user@example.com"
})
```

## Using AuthContext

```typescript
import { useAuth } from '@/components/Auth/AuthContext'

function MyComponent() {
  const { 
    user, 
    isLoading, 
    signInWithPassword, 
    verifyOtp, 
    resendOtp,
    sendEmailOtp,
    resetPassword,
    verifyPasswordReset 
  } = useAuth()

  // Use the functions...
}
```

## Using Custom Hook

```typescript
import { useAuthActions } from '@/hooks/useAuthActions'

function MyComponent() {
  const { 
    signInUser, 
    signUpUser, 
    verifyUserOtp, 
    resendUserOtp,
    requestPasswordReset,
    verifyPasswordReset,
    requestEmailVerification,
    isLoading,
    error 
  } = useAuthActions()

  const handleSignIn = async () => {
    const result = await signInUser("user@example.com", "password123")
    if (result.success) {
      // Handle success
    } else {
      // Handle error
    }
  }
}
```

## Utility Functions

```typescript
import { 
  isValidEmail, 
  isValidPhone, 
  formatPhoneNumber, 
  isValidPassword,
  getIdentifierType,
  validateOtp 
} from '@/lib/auth-utils'

// Validate email
const emailValid = isValidEmail("user@example.com")

// Validate phone
const phoneValid = isValidPhone("081233784490")

// Format phone number
const formatted = formatPhoneNumber("081233784490") // "+6281233784490"

// Validate password
const passwordCheck = isValidPassword("password123")

// Get identifier type
const type = getIdentifierType("user@example.com") // "email"

// Validate OTP
const otpCheck = validateOtp("1234")
```

## Error Handling

Semua API functions mengembalikan object dengan struktur:

```typescript
{
  success: boolean
  error?: {
    message: string
    // additional error properties
  }
  user?: User // untuk operations yang mengembalikan user data
}
```

## Examples

### Complete Sign Up Flow
```typescript
// 1. Sign up
const signupResult = await signUp({
  name: "John Doe",
  phone: "081234567890",
  email: "john@example.com",
  password: "password123"
})

if (signupResult.success) {
  // 2. Verify OTP
  const verifyResult = await verifyOtp({
    identifier: "081234567890",
    otp: "1234",
    purpose: "signup"
  })
  
  if (verifyResult.success) {
    // User is now registered and logged in
  }
}
```

### Complete Password Reset Flow
```typescript
// 1. Request password reset
const resetResult = await sendPasswordResetOtp({
  identifier: "user@example.com",
  method: "email"
})

if (resetResult.success) {
  // 2. Verify OTP and set new password
  const verifyResult = await verifyPasswordResetOtp({
    identifier: "user@example.com",
    otp: "9166",
    newPassword: "newpassword123"
  })
  
  if (verifyResult.success) {
    // Password has been reset
  }
}
```

## Backend API Endpoints

- `POST /api/auth/signin`
- `POST /api/auth/signup`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/send-password-reset-otp`
- `POST /api/auth/verify-password-reset-otp`
- `POST /api/auth/send-email-otp`

## Environment Configuration

Pastikan `BACKEND_URL` sudah dikonfigurasi di `src/lib/env.ts`:

```typescript
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
```
