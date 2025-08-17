"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, LogIn } from "lucide-react"
import Link from "next/link"
import { CheckoutForm } from "@/types/checkout"
import { User } from "../Auth/types"
import { CheckoutLoginModal } from "./CheckoutLoginModal"

interface ContactInformationStepProps {
  formData: CheckoutForm
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleNextStep: () => void
  isAuthenticated: boolean
  user: User | null
  error: string
  onLoginSuccess?: () => void
}

export function ContactInformationStep({
  formData,
  handleInputChange,
  handleNextStep,
  isAuthenticated,
  user,
  error,
  onLoginSuccess,
}: ContactInformationStepProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    if (onLoginSuccess) {
      onLoginSuccess()
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-primary/80 dark:border-gray-600 p-6 mb-6"
      >      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Informasi Kontak</h2>
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span>Sudah Login</span>
          </div>
        ) : (
          <button 
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary/10 dark:bg-gray-600/50 px-4 py-2 text-sm font-medium text-primary dark:text-white transition-all hover:bg-primary hover:text-white"
          >
            <LogIn className="h-4 w-4" />
            Login
          </button>        )}</div>

      {isAuthenticated && user && (
        <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 p-4 flex gap-3">
          <div className="text-green-500 mt-0.5">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              Informasi kontak telah diisi otomatis
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Data diambil dari akun yang sedang login. Anda dapat mengubahnya jika diperlukan.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium mb-1">
            Nomor WhatsApp <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="whatsapp"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleInputChange}
            placeholder="Contoh: 08123456789"
            className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Catatan (opsional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-between">
          <Link href="/products">
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Kembali Belanja
            </button>
          </Link>          <button
            onClick={handleNextStep}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-white transition-all hover:bg-primary/90"
          >
            Lanjutkan
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      </motion.div>

      {/* Login Modal */}
      <CheckoutLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  )
}
