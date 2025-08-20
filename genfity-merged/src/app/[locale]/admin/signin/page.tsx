"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, Shield, Lock, Mail, Phone, ArrowLeft } from "lucide-react"
import { useAuth } from "@/components/Auth/AuthContext"
import { ShineBorder } from "@/components/ui/shine-border"
import { OtpInput } from "@/components/Auth/OtpInput"

export default function AdminSignInPage() {
  const [loginMode, setLoginMode] = useState<"password" | "sso" | "otp">("password")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [ssoIdentifier, setSsoIdentifier] = useState("")
  const [error, setError] = useState("")
  const [isRateLimited, setIsRateLimited] = useState(false)
  
  // Use the same auth hooks as customer signin
  const { signInWithPassword, signInWithSSO, verifySSO, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error: signInError, success } = await signInWithPassword(identifier, password)
      
      if (success) {
        // Additional check: verify user has admin role after successful login
        // The auth system will handle session storage
        router.push("/admin/dashboard")
      } else if (signInError) {
        // Check if user exists but doesn't have admin role
        if (signInError.message?.includes("Admin privileges required") || 
            signInError.error === "INSUFFICIENT_PRIVILEGES") {
          setError("Access denied. Admin privileges required.")
        } else {
          setError(signInError.message || "Invalid credentials")
        }
        setIsLoading(false)
      } else {
        setError("Authentication failed")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Admin sign in error:", err)
      setError("Sign in failed")
      setIsLoading(false)
    }
  }

  const handleSSOSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error: ssoError, success } = await signInWithSSO(identifier)
      
      if (success) {
        setSsoIdentifier(identifier)
        setLoginMode("otp")
        setIsLoading(false)
      } else if (ssoError) {
        // Check if it's a rate limit error and handle it specially
        if (ssoError.error === 'RATE_LIMITED') {
          const cooldownSeconds = extractCooldownFromError(ssoError.message || '')
          startCooldownTimer(cooldownSeconds)
          setError(formatRateLimitedMessage(cooldownSeconds))
        } else {
          setError(ssoError.message || "Failed to send verification code")
        }
        
        setIsLoading(false)
      } else {
        setError("Failed to send verification code")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("SSO sign in error:", err)
      setError("Failed to send verification code")
      setIsLoading(false)
    }
  }

  const handleOTPVerification = async (otp: string) => {
    setError("")
    setIsLoading(true)

    try {
      const { error: verifyError, success, user } = await verifySSO(ssoIdentifier, otp)
      
      if (success && user) {
        // Check if user has admin role
        if ((user as any).role === 'admin' || (user as any).role === 'super_admin') {
          router.push("/admin/dashboard")
        } else {
          setError("Access denied. Admin privileges required.")
          setLoginMode("sso")
          setIsLoading(false)
        }
      } else if (verifyError) {
        setError(verifyError.message || "Invalid verification code")
        setIsLoading(false)
      } else {
        setError("Verification failed")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("OTP verification error:", err)
      setError("Verification failed")
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    
    setError("")
    setIsResending(true)

    try {
      const { error: ssoError, success } = await signInWithSSO(ssoIdentifier)
      
      if (success) {
        // Show success message or toast
        setError("")
      } else if (ssoError) {
        // Check if it's a rate limit error and handle it specially
        if (ssoError.error === 'RATE_LIMITED') {
          const cooldownSeconds = extractCooldownFromError(ssoError.message || '')
          startCooldownTimer(cooldownSeconds)
          setError(formatRateLimitedMessage(cooldownSeconds))
        } else {
          setError(ssoError.message || "Failed to resend code")
        }
      }
    } catch (err) {
      console.error("Resend OTP error:", err)
      setError("Failed to resend code")
    } finally {
      setIsResending(false)
    }
  }

  // Extract cooldown duration from error message
  const extractCooldownFromError = (errorMessage: string) => {
    const match = errorMessage.match(/wait (\d+) seconds?/)
    const seconds = match ? parseInt(match[1]) : 60 // Default to 60 seconds if not found
    return seconds
  }

  // Format rate limited error message
  const formatRateLimitedMessage = (seconds: number) => {
    return `Too many requests. Please wait ${seconds} seconds before trying again.`
  }

  // Start countdown timer
  const startCooldownTimer = (seconds: number) => {
    setIsRateLimited(true)
    setResendCooldown(seconds)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsRateLimited(false)
        }
        // Update error message with countdown
        const newSeconds = prev - 1
        setError(formatRateLimitedMessage(newSeconds))
        return newSeconds
      })
    }, 1000)
  }

  return (
    <section className="relative z-10 overflow-hidden py-16 md:pb-20 lg:pb-28 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 min-h-screen w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center">            
          <div className="w-full px-4">
            <div className="mx-auto max-w-[500px] relative rounded-xl bg-white px-6 py-10 shadow-2xl dark:bg-gray-900 sm:p-[60px]">
              <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
              
              {/* Admin Badge */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </div>
              </div>

              <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                Admin Sign In
              </h3>
              
              <p className="mb-11 text-center text-base font-medium text-gray-700 dark:text-gray-300">
                Access the Genfity administration panel
              </p>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400 border border-red-200 dark:border-red-800">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                </div>
              )}

              {loginMode === "otp" ? (
                // OTP Verification Step
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">                      
                    <button
                      onClick={() => {
                        setLoginMode("sso")
                        setError("")
                      }}
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 dark:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </button>
                  </div>
                  
                  <OtpInput
                    onComplete={handleOTPVerification}
                    onResend={handleResendOTP}
                    isLoading={isLoading}
                    isResending={isResending}
                    resendCooldown={resendCooldown}
                    error={error}
                    identifier={ssoIdentifier}
                  />
                </div>
              ) : (
                // Login Form
                <div>
                  {/* Login Mode Toggle */}
                  <div className="mb-6 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                    <button
                      onClick={() => {
                        setLoginMode("password")
                        setError("")
                      }}                        
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                        loginMode === "password"
                          ? "bg-white text-primary dark:text-white shadow-sm dark:bg-gray-900"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                    >
                      Password Login
                    </button>
                    <button
                      onClick={() => {
                        setLoginMode("sso")
                        setError("")
                      }}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                        loginMode === "sso"
                          ? "bg-white text-primary dark:text-white shadow-sm dark:bg-gray-900"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                    >
                      Quick Access
                    </button>
                  </div>

                  {loginMode === "password" ? (
                    <form onSubmit={handleSignIn}>                        
                      <div className="mb-8">
                        <label htmlFor="identifier" className="mb-3 block text-sm text-dark dark:text-white">
                          <Mail className="inline h-4 w-4 mr-2" />
                          Email or Phone
                        </label>
                        <input
                          type="text"
                          id="identifier"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="admin@genfity.com or +628123456789"
                          className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-black outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="mb-8">
                        <label htmlFor="password" className="mb-3 block text-sm text-dark dark:text-white">
                          <Lock className="inline h-4 w-4 mr-2" />
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 pr-12 text-base text-black outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                            required
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mb-6 space-y-3">
                        <button
                          type="submit"
                          disabled={isLoading || !identifier || !password}
                          className="flex w-full items-center justify-center rounded-md bg-primary dark:bg-primary px-9 py-3 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/80 dark:shadow-submit-dark disabled:opacity-50 disabled:hover:bg-primary"
                        >
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                          {isLoading ? "Signing in..." : "Sign In as Admin"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSSOSignIn}>
                      <div className="mb-8">
                        <label htmlFor="sso-identifier" className="mb-3 block text-sm text-dark dark:text-white">
                          <Phone className="inline h-4 w-4 mr-2" />
                          Phone Number or Email
                        </label>
                        <input
                          type="text"
                          id="sso-identifier"
                          value={ssoIdentifier}
                          onChange={(e) => setSsoIdentifier(e.target.value)}
                          placeholder="+628123456789 or admin@genfity.com"
                          className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-black outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                          required
                          disabled={isLoading}
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          We&apos;ll send you a verification code to access admin panel
                        </p>
                      </div>

                      <div className="mb-6">
                        <button
                          type="submit"
                          disabled={isLoading || !ssoIdentifier}
                          className="flex w-full items-center justify-center rounded-md bg-primary dark:bg-primary px-9 py-3 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/80 dark:shadow-submit-dark disabled:opacity-50 disabled:hover:bg-primary"
                        >
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                          {isLoading ? "Sending Code..." : "Send Verification Code"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  Customer portal? {" "}
                  <Link href="/signin" className="text-primary dark:text-blue-500 hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute left-0 top-0 z-[-1]">
        <svg width="1440" height="969" viewBox="0 0 1440 969" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask
            id="mask0_95:1005"
            style={{ maskType: "alpha" }}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1440"
            height="969"
          >
            <rect width="1440" height="969" fill="#090E34" />
          </mask>
          <g mask="url(#mask0_95:1005)">
            <path
              opacity="0.1"
              d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
              fill="url(#paint0_linear_95:1005)"
            />
            <path
              opacity="0.1"
              d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
              fill="url(#paint1_linear_95:1005)"
            />
          </g>
          <defs>
            <linearGradient
              id="paint0_linear_95:1005"
              x1="1178.4"
              y1="151.853"
              x2="780.959"
              y2="453.581"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_95:1005"
              x1="160.5"
              y1="220"
              x2="1099.45"
              y2="1192.04"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>      
    </section>
  )
}
