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

export default function SignupPage() {
  const t = useTranslations('Auth.signUp')
  const router = useRouter()
  const { verifyOtp, resendOtp: resendOtpContext } = useAuth()

  const [step, setStep] = useState<"form" | "verify">("form")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  // Handle signup form submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
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
      } else if (result.error) {
        setError(result.error.message || t('errors.signupFailed'))
      }
    } catch (err) {
      setError(t('errors.unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const otpValue = otp.join("")
      const { error, success } = await verifyOtp(phone, otpValue)
      
      if (success) {
        // Auto login: redirect ke dashboard
        router.push("/dashboard")
      } else if (error) {
        setError(error.message || t('errors.invalidOtp'))
      }
    } catch (err) {
      setError(t('errors.unexpectedError'))
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
  async function handleResendOtp(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
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
      } else if (result.error) {
        setError(result.error.message || result.message || t('errors.resendFailed'))
      }
    } catch (err) {
      setError(t('errors.unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative z-10 overflow-hidden pb-16 pt-36 md:pb-20 lg:pb-28 lg:pt-[180px]">
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
                {step === "verify" && `${t('verification.description')} (${phone})`}
              </p>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
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
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('form.phonePlaceholder')}
                      className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                      required
                    />
                  </div>
                  <div className="mb-8">
                    <label htmlFor="password" className="mb-3 block text-sm text-dark dark:text-white">
                      {t('form.password')}
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('form.passwordPlaceholder')}
                      className="border-stroke w-full rounded-sm border bg-[#f8f8f8] px-6 py-3 text-base text-foreground outline-hidden transition-all duration-300 focus:border-primary dark:border-transparent dark:bg-[#2C303B] = dark:shadow-two dark:focus:border-primary dark:focus:shadow-none"
                      required
                    />
                  </div>                  
                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={isLoading || !name || !email || !phone || !password}
                      className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-2 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-70"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                      disabled={isLoading || otp.join("").length !== 4}
                      className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-2 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-70"
                    >                      
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t('verification.verify')}
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading || resendCooldown > 0}
                      className="flex w-full items-center justify-center rounded-sm bg-primary px-9 py-2 text-base font-medium text-white shadow-submit duration-300 hover:bg-primary/90 dark:shadow-submit-dark disabled:opacity-70 mt-2"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {resendCooldown > 0 ? `${t('verification.resendCode')} (${resendCooldown}s)` : t('verification.resendCode')}
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
