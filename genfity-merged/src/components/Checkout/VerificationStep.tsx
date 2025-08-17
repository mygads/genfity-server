"use client"

import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Info, RefreshCw } from "lucide-react"

interface VerificationStepProps {
  formData: { whatsapp: string }
  error: string
  successMessage: string
  otpSent: boolean
  isSubmitting: boolean
  otp: string[]
  handleSendOtp: () => Promise<void>
  handleResendOtp: () => Promise<void>
  handleOtpChange: (index: number, value: string) => void
  handleVerifyOtp: () => Promise<void>
  setStep: (step: number) => void
}

export function VerificationStep({
  formData,
  error,
  successMessage,
  otpSent,
  isSubmitting,
  otp,
  handleSendOtp,
  handleResendOtp,
  handleOtpChange,
  handleVerifyOtp,
  setStep,
}: VerificationStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6"
    >
      <h2 className="text-xl font-bold mb-4">Verifikasi Nomor WhatsApp</h2>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-4 mb-6 flex gap-3">
        <div className="text-blue-500 mt-0.5">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            Kami perlu memverifikasi nomor WhatsApp Anda untuk memastikan informasi kontak yang valid. Kode OTP akan
            dikirimkan ke nomor WhatsApp Anda. Setelah verifikasi berhasil, Anda akan otomatis login.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-500 dark:bg-green-900/10 dark:text-green-400">
          {successMessage}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Nomor WhatsApp</label>
        <div className="flex items-center">
          <div className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {formData.whatsapp}
          </div>
          <button
            onClick={() => setStep(1)}
            className="ml-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      {!otpSent ? (
        <button
          onClick={handleSendOtp}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Mengirim OTP...
            </>
          ) : (
            <>
              Kirim Kode OTP
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      ) : (        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Masukkan Kode OTP</label>
            <div className="flex justify-center gap-2">
              {otp.slice(0, 4).map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  name={`otp-${index}`}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-10 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800"
                />
              ))}
            </div>
          </div>          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={handleResendOtp}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Mengirim ulang...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Kirim Ulang OTP
                </>
              )}
            </button><button
              onClick={handleVerifyOtp}
              disabled={otp.join("").length !== 4 || isSubmitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Verifikasi
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </div>
    </motion.div>
  )
}
