"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { CheckoutPhase } from "./CheckoutPhase"
import type { CheckoutResponse } from "@/types/checkout"

interface CheckoutStepProps {
  isAuthenticated: boolean
  formData: {
    name: string
    whatsapp: string
    email: string
    notes: string
    voucher: string
  }
  selectedItems: any[]
  whatsappItems: any[]
  regularItems: any[]
  addOns: any[]
  voucherApplied: boolean
  selectedItemsTotal: number
  voucherDiscount: number
  setStep: (step: number) => void
  onCheckoutSuccess: (response: CheckoutResponse) => void
  onError: (error: string) => void
  error: string
}

export function CheckoutStep({
  isAuthenticated,
  formData,
  selectedItems,
  whatsappItems,
  regularItems,
  addOns,
  voucherApplied,
  selectedItemsTotal,
  voucherDiscount,
  setStep,
  onCheckoutSuccess,
  onError,
  error
}: CheckoutStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold">Checkout</h2>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Checkout Phase */}
      <div className="mb-6">
        <CheckoutPhase
          formData={formData}
          selectedItems={selectedItems}
          whatsappItems={whatsappItems}
          regularItems={regularItems}
          addOns={addOns}
          voucherApplied={voucherApplied}
          selectedItemsTotal={selectedItemsTotal}
          voucherDiscount={voucherDiscount}
          onCheckoutSuccess={onCheckoutSuccess}
          onError={onError}
        />
      </div>

      {/* Navigation */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
        <button
          onClick={() => setStep(isAuthenticated ? 1 : 2)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </div>
    </motion.div>
  )
}
