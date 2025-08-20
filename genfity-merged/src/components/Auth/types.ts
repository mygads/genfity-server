export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  image?: string | null;
  verification?: {
    phoneVerified?: Date | null;
    emailVerified?: Date | null;
  };
}

export interface AuthResponse {
  success: boolean;
  authenticated?: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
  session?: {
    user: User;
    token: string;
    expiresAt: number;
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

export interface VerifyCheckoutOtpResponse {
  success: boolean;
  isNewUser: boolean;
  user?: User;
  token?: string;
  message?: string;
  error: any;
  passwordGenerated?: boolean;
  checkoutData?: TempCheckoutData;
}

export interface TempCheckoutData {
  id?: string;
  phone: string;
  name: string;
  email: string;
  packages?: string[];
  addons?: string[];
  totalAmount?: number;
  createdAt?: Date;
  expiresAt?: Date;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface SigninData {
  identifier: string; // email or phone
  password: string;
}

export interface OtpData {
  phone: string;
  otp: string;
}

export interface CheckoutOtpData {
  phone: string;
  otp: string;
  checkoutId?: string;
}
