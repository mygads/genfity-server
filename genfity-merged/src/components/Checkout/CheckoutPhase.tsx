"use client"

import { motion } from "framer-motion"
import { ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import type { 
  CheckoutRequest, 
  CheckoutPackage,
  CheckoutAddon, 
  CheckoutWhatsApp,
  CheckoutResponse
} from "@/types/checkout"

interface CheckoutPhaseProps {
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
  onCheckoutSuccess: (response: CheckoutResponse) => void
  onError: (error: string) => void
}

export function CheckoutPhase({ 
  formData,
  selectedItems,
  whatsappItems,
  regularItems,
  addOns,
  voucherApplied,
  selectedItemsTotal,
  voucherDiscount,
  onCheckoutSuccess,
  onError
}: CheckoutPhaseProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    setIsProcessing(true)
    onError("") // Clear any previous errors

    try {
      // Prepare checkout data according to new API structure
      const packages: CheckoutPackage[] = regularItems.map(item => ({
        id: item.id,
        quantity: item.qty || item.quantity || 1
      }))

      const addons: CheckoutAddon[] = addOns.map(item => ({
        id: item.id,
        quantity: item.qty || item.quantity || 1
      }))

      const whatsapp: CheckoutWhatsApp[] = whatsappItems.map(item => {
        // Extract package ID and duration from composite ID
        // WhatsApp items have IDs like "packageId_monthly" or "packageId_yearly"
        const idParts = item.id.split('_')
        const packageId = idParts[0] // Original package ID
        const billingType = idParts[1] // "monthly" or "yearly"
        
        // Convert billing type to duration format expected by backend
        const duration = billingType === "yearly" ? "year" : "month"
        
        return {
          packageId: packageId, // Use the original package ID, not the composite one
          duration: duration
        }
      })

      const checkoutData: CheckoutRequest = {
        currency: "idr",
        notes: formData.notes || undefined,
        ...(packages.length > 0 && { packages }),
        ...(addons.length > 0 && { addons }),
        ...(whatsapp.length > 0 && { whatsapp }),
        ...(voucherApplied && formData.voucher && { voucherCode: formData.voucher })
      }

      // Process checkout using global API client
      const result = await apiClient.post('/api/customer/checkout', checkoutData)
      
      onCheckoutSuccess(result)

    } catch (error: any) {
      console.error('Checkout error:', error)
      onError(error.message || "Terjadi kesalahan saat memproses checkout. Silakan coba lagi.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-lg font-semibold mb-2">Checkout</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Tinjau pesanan Anda dan lanjutkan ke pembayaran
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Ringkasan Pesanan</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rp {selectedItemsTotal.toLocaleString('id-ID')}</span>
          </div>
          {voucherApplied && (
            <div className="flex justify-between text-green-600">
              <span>Diskon Voucher:</span>
              <span>-Rp {voucherDiscount.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between font-medium text-base">
              <span>Total:</span>
              <span className="text-primary">Rp {(selectedItemsTotal - voucherDiscount).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses Checkout...
          </>
        ) : (
          <>
            Lanjutkan ke Pembayaran
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </motion.div>
  )
}
