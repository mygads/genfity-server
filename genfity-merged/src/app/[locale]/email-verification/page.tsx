"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function EmailVerificationPage() {
  const router = useRouter()
  const [step, setStep] = useState<"request" | "verify" | "success">("request")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })
      const result = await response.json()

      if (result.success) {
        setStep("verify")
      } else if (result.error) {
        setError(result.error.message || "Failed to send verification code. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
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
      if (value && index < 3) {
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
      const otpValue = otp.join("")
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          identifier: email, 
          otp: otpValue, 
          purpose: "verify-email" 
        })
      })
      const result = await response.json()

      if (result.success) {
        setStep("success")
        // Auto redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else if (result.error) {
        setError(result.error.message || "Invalid OTP. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendOtp(): Promise<void> {
    if (resendCooldown > 0) return
    setError("")
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier: email, purpose: "verify-email" })
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
        setError(result.error.message || "Failed to resend code. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative z-10 overflow-hidden pb-16 pt-36 md:pb-20 lg:pb-28 lg:pt-[180px]">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="mx-auto max-w-[500px] rounded bg-white px-6 py-10 shadow-three dark:bg-dark sm:p-[60px]">
              {step === "request" && (
                <>
                  <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                    Verify Your Email
                  </h3>
                  <p className="mb-11 text-center text-base font-medium text-body-color">
                    Enter your email address to receive a verification code
                  </p>

                  {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleRequestSubmit}>
                    <div className="mb-8">
                      <label htmlFor="email" className="mb-3 block text-sm text-dark dark:text-white">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-body-color outline-none transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                        required
                      />
                    </div>

                    <div className="mb-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Verification Code"
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {step === "verify" && (
                <>
                  <div className="mb-6 flex items-center">
                    <button
                      onClick={() => setStep("request")}
                      className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h3 className="text-2xl font-bold text-black dark:text-white sm:text-3xl">
                      Enter Verification Code
                    </h3>
                  </div>

                  <p className="mb-11 text-center text-base font-medium text-body-color">
                    We&#39;ve sent a 4-digit verification code to {email}
                  </p>

                  {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleVerifySubmit}>
                    <div className="mb-8">
                      <label className="mb-3 block text-sm text-dark dark:text-white">
                        Verification Code
                      </label>
                      <div className="flex justify-center space-x-2">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            type="text"
                            name={`otp-${index}`}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            className="h-12 w-12 rounded-sm border border-stroke bg-[#f8f8f8] text-center text-lg font-semibold text-body-color outline-none transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:shadow-two dark:focus:border-primary"
                            maxLength={1}
                            required
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify Email"
                        )}
                      </button>
                    </div>

                    <div className="text-center">
                      <p className="text-base font-medium text-body-color">
                        Didn&#39;t receive the code?{" "}
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendCooldown > 0}
                          className="text-primary hover:underline disabled:opacity-50"
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              )}

              {step === "success" && (
                <>
                  <h3 className="mb-3 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                    Email Verified!
                  </h3>
                  <p className="mb-11 text-center text-base font-medium text-body-color">
                    Your email has been successfully verified.
                  </p>

                  <div className="mb-6">
                    <Link
                      href="/dashboard"
                      className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-4 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </>
              )}

              <p className="text-center text-base font-medium text-body-color">
                <Link href="/signin" className="text-primary hover:underline">
                  Back to Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
