// Environment variables utility
export const ENV = {
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL,
    BACKEND_API_KEY: process.env.BACKEND_API_KEY,
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const

// Legacy exports for backward compatibility
export const BACKEND_URL = ENV.BACKEND_URL
