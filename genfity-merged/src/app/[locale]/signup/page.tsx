"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/components/Auth/AuthContext"
import { BorderBeam } from "@/components/ui/border-beam"
import { ShineBorder } from "@/components/ui/shine-border"

export default function SignupPage() {
  const t = useTranslations('Auth.signUp')
  const tCommon = useTranslations('Auth.common')
  const router = useRouter()
  const { verifyOtp, resendOtp: resendOtpContext } = useAuth()

  const [step, setStep] = useState<"form" | "verify">("form")
  const [phone, setPhone] = useState("")
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null)
  const [otp, setOtp] = useState(["", "", "", ""])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignupLoading, setIsSignupLoading] = useState(false)
  const [isVerifyLoading, setIsVerifyLoading] = useState(false)
  const [isResendLoading, setIsResendLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isRegistrationInProgress, setIsRegistrationInProgress] = useState(false)

  // International phone validation regex (supports country codes)
  const phoneRegex = /^(\+\d{1,3})?[0-9\s\-\(\)]{7,15}$/

  // Validate phone format on client side
  const validatePhone = (phone: string) => {
    return phoneRegex.test(phone.trim())
  }

  // Handle phone input change with validation
  const handlePhoneChange = (value: string) => {
    setPhone(value)
    if (value.length > 0) {
      setPhoneValid(validatePhone(value))
    } else {
      setPhoneValid(null)
    }
  }

  // Handle registration in progress redirect
  const handleRegistrationInProgress = useCallback((result: any) => {
    console.log('Registration in progress - redirecting to verification step')
    
    // Use flushSync to force immediate state update
    flushSync(() => {
      setError("")
      setIsRegistrationInProgress(true)
      setStep("verify")
    })
    
    // Pre-fill phone if available from API
    if (result.data?.phone) {
      setPhone(result.data.phone)
      setPhoneValid(true)
    }
    
    // Show informational message after a brief delay
    setTimeout(() => {
      setError(t('errors.registrationInProgress'))
    }, 500)
  }, [t])

  // Handle signup form submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Client-side phone validation
    if (!validatePhone(phone)) {
      setError(t('errors.invalidPhone'))
      return
    }
    
    setIsSignupLoading(true)
    try {
      // Kirim data signup ke backend menggunakan API langsung
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, phone, password })
      })
      const result = await response.json()
      
      if (result.success) {
        setStep("verify")
        setIsRegistrationInProgress(false)
      } else {
        // Check for registration in progress first (most important case)
        const hasRegistrationInProgress = 
          (result.errorCode === 'REGISTRATION_IN_PROGRESS') ||
          (result.error === 'REGISTRATION_IN_PROGRESS') ||
          (result.message && result.message.toLowerCase().includes('registration already in progress'));
          
        if (hasRegistrationInProgress) {
          handleRegistrationInProgress(result)
          return // Early return to avoid other error handling
        }
        
        // Handle specific error codes from API
        if (result.errorCode || result.error) {
          const errorCode = result.errorCode || result.error;
          
          switch (errorCode) {
            case 'INVALID_PHONE':
            case 'INVALID_PHONE_FORMAT':
              setError(t('errors.invalidPhone'))
              break
            case 'EMAIL_EXISTS':
            case 'DUPLICATE_EMAIL':
              setError(t('errors.emailExists'))
              break
            case 'PHONE_EXISTS':
            case 'DUPLICATE_PHONE':
            case 'DUPLICATE_PHONE_VERIFIED':
              setError(t('errors.phoneExists'))
              break
            case 'USER_EXISTS':
              setError(t('errors.userExists'))
              break
            default:
              setError(result.error?.message || result.message || t('errors.generalError'))
          }
        } else {
          setError(result.error?.message || result.message || t('errors.signupFailed'))
        }
      }
    } catch (err) {
      setError(t('errors.unexpectedError'))
    } finally {
      setIsSignupLoading(false)
    }
  }

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsVerifyLoading(true)
    try {
      const otpValue = otp.join("")
      const { error, success } = await verifyOtp(phone, otpValue)
      
      if (success) {
        // Auto login: redirect ke dashboard
        router.push("/dashboard")
      } else if (error) {
        // Handle specific OTP errors
        if (error.code === 'OTP_EXPIRED') {
          setError(t('errors.otpExpired'))
        } else if (error.code === 'VERIFICATION_EXPIRED') {
          setError(t('errors.verificationExpired'))
          // Redirect back to signup form after 3 seconds
          setTimeout(() => {
            setStep("form")
            setOtp(["", "", "", ""])
          }, 3000)
        } else {
          setError(error.message || t('errors.invalidOtp'))
        }
      }
    } catch (err) {
      setError(t('errors.unexpectedError'))
    } finally {
      setIsVerifyLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`) as HTMLInputElement
        if (nextInput) nextInput.focus()
      }
    }
  }
  async function handleResendOtp(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
    event.preventDefault()
    if (resendCooldown > 0) return
    setError("")
    setIsResendLoading(true)
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier: phone, purpose: "signup" })
      })
      const result = await response.json()
      
      if (result.success) {
        setOtp(["", "", "", ""])
        setResendCooldown(60)
        // Mulai timer mundur
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })        
        }, 1000)
      } else {
        // Handle specific resend errors
        if (result.errorCode === 'VERIFICATION_EXPIRED') {
          setError(t('errors.verificationExpired'))
          // Redirect back to signup form after 3 seconds  
          setTimeout(() => {
            setStep("form")
            setOtp(["", "", "", ""])
          }, 3000)
        } else {
          setError(result.error?.message || result.message || t('errors.resendFailed'))
        }
      }
    } catch (err) {
      setError(t('errors.unexpectedError'))
    } finally {
      setIsResendLoading(false)
    }
  }

  // Handle back to form from verification step
  const handleBackToForm = () => {
    setStep("form")
    setOtp(["", "", "", ""])
    setError("")
    setIsRegistrationInProgress(false)
  }

  return (
    <section className="relative z-10 overflow-hidden py-16 pt-24 md:py-20 lg:py-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">          
          <div className="w-full px-4">
            <div className="mx-auto max-w-[500px] relative rounded-xl bg-white px-6 py-10 dark:bg-dark sm:p-[60px] shadow-2xl">
              <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
              <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                {step === "form" && t('title')}
                {step === "verify" && t('verification.title')}
              </h3>
              <p className="mb-11 text-center text-base font-medium text-gray-600 dark:text-gray-400">
                {step === "form" && t('subtitle')}
                {step === "verify" && isRegistrationInProgress && `${t('verification.continueDescription')} (${phone})`}
                {step === "verify" && !isRegistrationInProgress && `${t('verification.description')} (${phone})`}
              </p>

              {error && (
                <div className={`mb-6 rounded-lg p-4 text-sm ${
                  error.includes(t('errors.registrationInProgress')) 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400' 
                    : 'bg-red-50 text-red-500 dark:bg-red-900/10 dark:text-red-400'
                }`}>
                  {error}
                </div>
              )}

              {step === "form" && (
                <form onSubmit={handleSignupSubmit}>
                <div className="mb-8">
                    <label htmlFor="name" className="mb-3 block text-sm text-dark dark:text-white">
                      {t('form.name')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('form.namePlaceholder')}
                      className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B]  dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                      required
                    />
                  </div>
                  <div className="mb-8">
                    <label htmlFor="email" className="mb-3 block text-sm text-dark dark:text-white">
                      {t('form.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('form.emailPlaceholder')}
                      className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B]  dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                      required
                    />
                  </div>
                  <div className="mb-8">
                    <label htmlFor="phone" className="mb-3 block text-sm text-dark dark:text-white">
                      {t('form.phone')}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder={t('form.phonePlaceholder')}
                        className={`border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 pr-10 text-base text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:shadow-two dark:focus:border-primary dark:focus:shadow-none ${
                          phoneValid === false ? 'border-red-500 dark:border-red-500' : phoneValid === true ? 'border-green-500 dark:border-green-500' : ''
                        }`}
                        required
                      />
                      {phoneValid === false && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 group">
                          <AlertCircle className="h-5 w-5 text-red-500 cursor-help" />
                          <div className="invisible group-hover:visible absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 z-10 shadow-lg">
                            <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                            {t('form.phoneHelper')}
                          </div>
                        </div>
                      )}
                    </div>
                    {phoneValid === false && (
                      <p className="mt-1 text-xs text-red-500">
                        {t('errors.invalidPhone')}
                      </p>
                    )}
                    {phoneValid === true && (
                      <p className="mt-1 text-xs text-green-500">
                        {t('form.phoneValid')}
                      </p>
                    )}
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
                        className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 pr-12 text-base text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        aria-label={showPassword ? tCommon('hidePassword') : tCommon('showPassword')}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>                  
                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={isSignupLoading || !name || !email || !phone || !password || phoneValid === false}
                      className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-2 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-70"
                    >
                      {isSignupLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t('form.signUpButton')}
                    </button>
                  </div>
                </form>
              )}              
              {step === "verify" && (
                <form onSubmit={handleVerifyOtp}>                  
                <div className="mb-8">
                    <label htmlFor="otp" className="mb-3 block text-sm text-dark dark:text-white">
                      {t('verification.enterCode')}
                    </label>
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          name={`otp-${index}`}
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          className="border-stroke w-10 h-12 rounded-sm border bg-[#f8f8f8] text-center text-lg font-bold text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B]  dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                          required
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={isVerifyLoading || otp.join("").length !== 4}
                      className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-2 text-sm font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-70"
                    >                      
                    {isVerifyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t('verification.verify')}
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResendLoading || resendCooldown > 0}
                      className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-2 text-sm font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-70 mt-2"
                    >
                      {isResendLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {resendCooldown > 0 ? `${t('verification.resendCode')} (${resendCooldown}s)` : t('verification.resendCode')}
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToForm}
                      disabled={isVerifyLoading || isResendLoading}
                      className="flex w-full items-center justify-center rounded-sm border border-gray-300 dark:border-gray-600 px-9 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 duration-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-70 mt-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('verification.backToForm')}
                    </button>
                  </div>
                </form>
              )}              <p className="text-center text-base font-medium text-foreground">
                {t('links.hasAccount')}{" "}
                <Link href="/signin" className="text-primary dark:text-blue-500 hover:underline">
                  {t('links.signIn')}
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
  )
}
