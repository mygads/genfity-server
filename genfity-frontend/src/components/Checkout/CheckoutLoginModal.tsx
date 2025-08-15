"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useAuth } from "@/components/Auth/AuthContext"
import { OtpInput } from "@/components/Auth/OtpInput"

interface CheckoutLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: () => void
}

export function CheckoutLoginModal({ isOpen, onClose, onLoginSuccess }: CheckoutLoginModalProps) {
  const { signInWithPassword, signInWithSSO, verifySSO, isLoading: isAuthLoading } = useAuth()

  const [loginMode, setLoginMode] = useState<"password" | "sso" | "otp">("password")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [ssoIdentifier, setSsoIdentifier] = useState("")

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error: signInError, success } = await signInWithPassword(identifier, password)
      
      if (success) {
        // Call success callback to continue checkout
        onLoginSuccess()
        onClose()
        // Reset form
        resetForm()
      } else if (signInError) {
        setError(signInError.message || "Email/nomor telepon atau kata sandi tidak valid")
        setIsLoading(false)
      } else {
        setError("Terjadi kesalahan yang tidak diketahui")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Sign in modal catch block:", err)
      setError("Terjadi kesalahan yang tidak terduga")
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
        setError(ssoError.message || "Gagal mengirim kode verifikasi")
        setIsLoading(false)
      } else {
        setError("Terjadi kesalahan saat mengirim kode")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("SSO sign in modal catch block:", err)
      setError("Terjadi kesalahan yang tidak terduga")
      setIsLoading(false)
    }
  }

  const handleOTPVerification = async (otp: string) => {
    setError("")
    setIsLoading(true)

    try {
      const { error: verifyError, success, user } = await verifySSO(ssoIdentifier, otp)
      
      if (success && user) {
        // Call success callback to continue checkout
        onLoginSuccess()
        onClose()
        // Reset form
        resetForm()
      } else if (verifyError) {
        setError(verifyError.message || "Kode verifikasi tidak valid")
        setIsLoading(false)
      } else {
        setError("Terjadi kesalahan saat verifikasi")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("OTP verification modal catch block:", err)
      setError("Terjadi kesalahan yang tidak terduga")
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError("")
    setIsResending(true)

    try {
      const { error: ssoError, success } = await signInWithSSO(ssoIdentifier)
      
      if (!success && ssoError) {
        setError(ssoError.message || "Gagal mengirim ulang kode")
      }
    } catch (err) {
      console.error("Resend OTP modal catch block:", err)
      setError("Gagal mengirim ulang kode")
    } finally {
      setIsResending(false)
    }
  }

  const resetForm = () => {
    setLoginMode("password")
    setIdentifier("")
    setPassword("")
    setShowPassword(false)
    setError("")
    setSsoIdentifier("")
    setIsLoading(false)
    setIsResending(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="mx-4 w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Login untuk Melanjutkan
            </h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Login untuk melanjutkan proses checkout dan mengisi informasi kontak secara otomatis.
            </p>

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
                    Kembali
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
                    Email/Password
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
                    Kode OTP
                  </button>
                </div>

                {loginMode === "password" ? (
                  <form onSubmit={handleSignIn}>
                    <div className="mb-4">
                      <label htmlFor="modal-identifier" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email atau Nomor Telepon
                      </label>
                      <input
                        type="text"
                        id="modal-identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Masukkan email atau nomor telepon"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label htmlFor="modal-password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="modal-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Masukkan password"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-gray-900 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !identifier || !password || isAuthLoading}
                      className="w-full flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-gray-900"
                    >
                      {isLoading || isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Login
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSSOSignIn}>
                    <div className="mb-4">
                      <label htmlFor="modal-sso-identifier" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email atau Nomor Telepon
                      </label>
                      <input
                        type="text"
                        id="modal-sso-identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Masukkan email atau nomor telepon"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                        required
                      />
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Kami akan mengirim kode verifikasi 4 digit ke email atau WhatsApp Anda
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !identifier || isAuthLoading}
                      className="w-full flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-gray-900"
                    >
                      {isLoading || isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Kirim Kode
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
