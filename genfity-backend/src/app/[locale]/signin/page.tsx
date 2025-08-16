"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/components/Auth/AuthContext"
import SigninRedirectHandler from "@/components/Auth/SigninRedirectHandler"
import { OtpInput } from "@/components/Auth/OtpInput"
import { ShineBorder } from "@/components/ui/shine-border"

export default function SigninPage() {
  const t = useTranslations('Auth.signIn')
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get("redirectedFrom") || "/dashboard"
  const reason = searchParams.get("reason")
  const { signInWithPassword, signInWithSSO, verifySSO, signInWithGoogle, isLoading: isAuthLoading } = useAuth()

  const [loginMode, setLoginMode] = useState<"password" | "sso" | "otp">("password")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [ssoIdentifier, setSsoIdentifier] = useState("")
  // Set appropriate message based on redirect reason
  const getRedirectMessage = () => {
    if (reason === "session-expired") {
      return t('sessionExpiredMessage')
    }
    if (searchParams.get("redirectedFrom")) {
      return t('accessPageMessage')
    }
    return t('description')
  }
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error: signInError, success } = await signInWithPassword(identifier, password)
      
      if (success) {
        // Redirect after successful signin        router.push(redirectTo)
      } else if (signInError) {
        setError(signInError.message || t('errors.invalidCredentials'))
        setIsLoading(false)
      } else {
        setError(t('errors.unknownError'))
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Sign in page catch block:", err)
      setError(t('errors.unexpectedError'))
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
        setError(ssoError.message || t('errors.ssoFailed'))
        setIsLoading(false)
      } else {
        setError(t('errors.ssoUnknownError'))
        setIsLoading(false)
      }
    } catch (err) {
      console.error("SSO sign in page catch block:", err)
      setError(t('errors.unexpectedError'))
      setIsLoading(false)
    }
  }

  const handleOTPVerification = async (otp: string) => {
    setError("")
    setIsLoading(true)

    try {
      const { error: verifyError, success, user } = await verifySSO(ssoIdentifier, otp)
      
      if (success && user) {
        // Redirect after successful verification
        router.push(redirectTo)
      } else if (verifyError) {
        setError(verifyError.message || t('errors.verifyFailed'))
        setIsLoading(false)
      } else {
        setError(t('errors.verifyUnknownError'))
        setIsLoading(false)
      }
    } catch (err) {
      console.error("OTP verification catch block:", err)
      setError(t('errors.unexpectedError'))
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError("")
    setIsResending(true)

    try {
      const { error: ssoError, success } = await signInWithSSO(ssoIdentifier)
      
      if (success) {
        // Show success message or toast
      } else if (ssoError) {
        setError(ssoError.message || t('errors.ssoFailed'))
      }
    } catch (err) {
      console.error("Resend OTP catch block:", err)
      setError(t('errors.ssoFailed'))
    } finally {
      setIsResending(false)
    }
  }
  const handleGoogleSignIn = async () => {
    await signInWithGoogle()
  }


  return (
    <SigninRedirectHandler redirectTo={redirectTo}>
      <section className="relative z-10 overflow-hidden pb-16 pt-36 md:pb-20 lg:pb-28 lg:pt-[180px]">
        <div className="container">
          <div className="flex flex-wrap">            
            <div className="w-full px-4">
              <div className="mx-auto max-w-[500px] relative rounded-xl bg-white px-6 py-10 shadow-2xl dark:bg-gray-900 sm:p-[60px]">
                <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
                <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                  {t('title')}
                </h3>
                
                {reason === "session-expired" && (
                  <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {t('sessionExpired')}
                    </div>
                    <p className="mt-1">{getRedirectMessage()}</p>
                  </div>
                )}
                  {/* <p className="mb-11 text-center text-base font-medium text-gray-700 dark:text-gray-300">
                  {getRedirectMessage()}
                </p> */}

                {error && (
                  <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
                    {error}
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
                        {t('otp.back')}
                      </button>
                    </div>
                    
                    <OtpInput
                      onComplete={handleOTPVerification}
                      onResend={handleResendOTP}
                      isLoading={isLoading}
                      isResending={isResending}
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
                        {t('loginModes.password')}
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
                        {t('loginModes.sso')}
                      </button>
                    </div>

                    {loginMode === "password" ? (
                      <form onSubmit={handleSignIn}>                        
                      <div className="mb-8">
                          <label htmlFor="identifier" className="mb-3 block text-sm text-dark dark:text-white">
                            {t('form.emailOrPhone')}
                          </label>
                          <input
                            type="text"
                            id="identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder={t('form.emailOrPhonePlaceholder')}
                            className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-black outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                            required
                          />
                        </div>
                        <div className="mb-8">
                          <label htmlFor="password" className="mb-3 block text-sm text-dark dark:text-white">
                            {t('form.password')}
                          </label>
                          <div className="relative">                            
                            <input
                              type={showPassword ? "text" : "password"}
                              id="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={t('form.passwordPlaceholder')}
                              className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 pr-12 text-base text-black outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
                              // aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>                        
                        <div className="mb-4 flex flex-col justify-between sm:flex-row sm:items-center">
                          <div>
                            <Link href="/signin/forgot-password" className="text-sm font-medium text-primary dark:text-blue-500 hover:underline">
                              {t('form.forgotPassword')}
                            </Link>
                          </div>
                        </div>
                        <div className="mb-6">
                          <button
                            type="submit"
                            disabled={isLoading || !identifier || !password || isAuthLoading}
                            className="flex w-full items-center justify-center rounded-md bg-primary dark:bg-primary px-9 py-2 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/60 dark:shadow-submit-dark disabled:opacity-50 disabled:hover:bg-primary/60"
                          >
                            {isLoading || isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('form.signInButton')}
                          </button>
                        </div>
                      </form>
                    ) : (                      
                    <form onSubmit={handleSSOSignIn}>
                        <div className="mb-8">
                          <label htmlFor="sso-identifier" className="mb-3 block text-sm text-dark dark:text-white">
                            {t('form.ssoIdentifier')}
                          </label>
                          <input
                            type="text"
                            id="sso-identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder={t('form.ssoIdentifierPlaceholder')}
                            className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-2 text-base text-black outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                            required
                          />
                          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            We&#39;ll send a 4-digit verification code to your email or WhatsApp
                          </p>
                        </div>
                        <div className="mb-6">
                          <button
                            type="submit"
                            disabled={isLoading || !identifier || isAuthLoading}
                            className="flex w-full items-center justify-center rounded-md bg-primary dark:bg-primary px-9 py-2 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/60 dark:shadow-submit-dark disabled:opacity-50 disabled:hover:bg-primary/60"
                          >
                            {isLoading || isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('form.sendCodeButton')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}                
                <p className="text-center text-base font-medium text-foreground">
                  {t('links.noAccount')}{" "}
                  <Link href="/signup" className="text-primary dark:text-blue-500 hover:underline">
                    {t('links.signUp')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
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
    </SigninRedirectHandler>
  )
}
