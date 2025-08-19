interface AuthResponse {
  success: boolean;
  authenticated?: boolean;
  user?: any;
  token?: string;
  message?: string;
  error?: string;
}

/**
 * Sign in user with email/phone and password
 */
export async function signIn(identifier: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

/**
 * Sign up user with name, email, phone, and password
 */
export async function signUp(name: string, email: string, phone: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

/**
 * Verify OTP for phone verification
 */
export async function verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, otp }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

/**
 * Resend OTP to phone
 */
export async function resendOtp(phone: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Resend OTP error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

/**
 * Send password reset OTP to phone/email
 */
export async function sendPasswordResetOtp(identifier: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Send password reset OTP error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

/**
 * Verify password reset OTP and set new password
 */
export async function verifyPasswordResetOtp(identifier: string, otp: string, newPassword: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, otp, newPassword }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

/**
 * Send email OTP for email verification
 */
export async function sendEmailOtp(email: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/send-email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Send email OTP error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}
