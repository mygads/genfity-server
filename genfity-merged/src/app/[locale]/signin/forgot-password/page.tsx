"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/components/Auth/AuthContext"
import { BorderBeam } from "@/components/ui/border-beam"
import { ShineBorder } from "@/components/ui/shine-border"

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth.forgotPassword')
  const router = useRouter()
  const { } = useAuth()
  const [step, setStep] = useState<"request" | "verify" | "success">("request")
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isEmail, setIsEmail] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Check if identifier is email or phone
      const isEmailInput = identifier.includes("@")
      setIsEmail(isEmailInput)

      // Format phone number if needed
      let formattedIdentifier = identifier
      if (!isEmailInput && identifier.startsWith("0")) {
        formattedIdentifier = "+62" + identifier.substring(1)
      }
      
      const response = await fetch('/api/auth/send-password-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          identifier: formattedIdentifier, 
          method: isEmailInput ? "email" : "whatsapp" 
        })
      })
      const result = await response.json()

      if (result.success) {
        setStep("verify")
      } else if (result.error) {
        setError(result.error.message || t('errors.sendFailed'))
      }
    } catch (err) {
      setError(t('errors.unexpected'))
    } finally {
      setIsLoading(false)
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

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (newPassword !== confirmPassword) {
        setError(t('errors.passwordMismatch'))
        setIsLoading(false)
        return
      }
      
      const otpValue = otp.join("")

      const response = await fetch('/api/auth/verify-password-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          identifier, 
          otp: otpValue, 
          newPassword 
        })
      })
      const result = await response.json()

      if (result.success) {
        setStep("success")
      } else if (result.error) {
        setError(result.error.message || t('errors.resetFailed'))
      }
    } catch (err) {
      setError(t('errors.unexpected'))
    } finally {
      setIsLoading(false)
    }
  }
  async function handleSendOtp(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
    event.preventDefault()
    if (resendCooldown > 0) return
    setError("")
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, purpose: "reset-password" })
      })
      const result = await response.json()
      
      if (result.success) {
        setOtp(["", "", "", ""])
        setResendCooldown(60)
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)      
      } else if (result.error) {
        setError(result.error.message || result.message || t('errors.resendFailed'))
      }
    } catch (err) {
      setError(t('errors.unexpected'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative z-10 overflow-hidden pb-16 pt-36 md:pb-20 lg:pb-28 lg:pt-[180px]">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">          
          <div className="w-full px-4">
            <div className="mx-auto max-w-[500px] relative rounded-xl bg-white px-6 py-10 shadow-2xl dark:bg-dark sm:p-[60px]">
              <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
              <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                {step === "request" && t('steps.request.title')}
                {step === "verify" && t('steps.verify.title')}
                {step === "success" && t('steps.success.title')}
              </h3>
              <p className="mb-11 text-center text-base font-medium text-gray-600 dark:text-gray-400">
                {step === "request" && t('steps.request.description')}
                {step === "verify" && `${t('steps.verify.description')} ${isEmail ? "email" : "WhatsApp"} Anda`}
              </p>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
                  {error}
                </div>
              )}

              {step === "request" && (
                <form onSubmit={handleRequestSubmit}>                  
                <div className="mb-8">
                    <label htmlFor="identifier" className="mb-3 block text-sm text-dark dark:text-white">
                      {t('steps.request.form.identifier')}
                    </label>
                    <input
                      type="text"
                      id="identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t('steps.request.form.identifierPlaceholder')}
                      className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B]  dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={isLoading || !identifier}
                      className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-70"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t('steps.request.form.sendCode')}
                    </button>
                  </div>
                </form>
              )}

              {step === "verify" && (
                <form onSubmit={handleVerifySubmit}>                  <div className="mb-8">
                    <label htmlFor="otp" className="mb-3 block text-sm text-dark dark:text-white">
                      {t('steps.verify.form.enterCode')}
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
                          className="border-stroke w-10 h-12 rounded-sm border bg-[#f8f8f8] text-center text-lg font-bold text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                          required
                        />
                      ))}
                    </div>
                  </div>                  <div className="mb-8">
                    <label htmlFor="newPassword" className="mb-3 block text-sm text-dark dark:text-white">
                      {t('steps.verify.form.newPassword')}
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('steps.verify.form.newPasswordPlaceholder')}
                      className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B]  dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="mb-8">
                    <label htmlFor="confirmPassword" className="mb-3 block text-sm text-dark dark:text-white">
                      {t('steps.verify.form.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('steps.verify.form.confirmPasswordPlaceholder')}
                      className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B]  dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                      required
                    />
                  </div>

                  <div className="mb-6">                    <button
                      type="submit"
                      disabled={isLoading || otp.join("").length !== 4 || !newPassword || !confirmPassword}
                      className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-70"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t('steps.verify.form.resetPassword')}
                    </button>
                  </div>                  <div className="mb-6 flex justify-center">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading || resendCooldown > 0}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 dark:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {resendCooldown > 0 ? `${t('steps.verify.resendCode')} (${resendCooldown}s)` : t('steps.verify.resendCode')}
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("request")}
                      className="inline-flex items-center text-sm text-primary dark:text-blue-500 hover:underline"
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      {t('links.backToSignIn')}
                    </button>
                  </div>
                </form>
              )}

              {step === "success" && (
                <div className="text-center">
                  <div className="mb-8 flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/30">
                      <svg
                        className="h-8 w-8 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  <p className="mb-8 text-base text-body-color">
                    {t('steps.success.description')}
                  </p>
                  <Link
                    href="/signin"
                    className="rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark"
                  >
                    {t('steps.success.signIn')}
                  </Link>
                </div>
              )}              {step === "request" && (
                <p className="text-center text-base font-medium text-gray-600 dark:text-gray-400 mt-6">
                  {t('links.rememberPassword')}{" "}
                  <Link href="/signin" className="text-primary dark:text-blue-500 hover:underline">
                    {t('links.signIn')}
                  </Link>
                </p>
              )}
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
