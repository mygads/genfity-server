"use client"

import { motion } from "framer-motion"
import { ArrowRight, Loader2, Check } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  createPayment
} from "@/services/checkout-api"
import type { 
  PaymentCreateRequest,
  PaymentCreateResponse,
  CheckoutResponse
} from "@/types/checkout"

interface PaymentMethodPhaseProps {
  checkoutResponse: CheckoutResponse
  onPaymentCreated: (response: PaymentCreateResponse) => void
  onError: (error: string) => void
}

export function PaymentMethodPhase({ 
  checkoutResponse,
  onPaymentCreated,
  onError
}: PaymentMethodPhaseProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handlePayment = async (paymentMethod: string) => {
    if (!checkoutResponse?.data.transactionId) {
      onError("Transaction ID tidak ditemukan. Silakan coba checkout lagi.")
      return
    }

    setIsProcessing(true)
    onError("") // Clear any previous errors

    try {
      const paymentData: PaymentCreateRequest = {
        transactionId: checkoutResponse.data.transactionId,
        paymentMethod: paymentMethod
      }

      const response = await createPayment(paymentData)
      
      // Redirect to payment status page instead of continuing in checkout
      if (response.success && response.data.payment.id) {
        router.push(`/payment/status/${response.data.payment.id}`)
      } else {
        onError("Gagal membuat pembayaran. Silakan coba lagi.")
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      onError(error.message || "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.")
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
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-green-500 mt-0.5">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-green-800 dark:text-green-300 font-medium">
              Checkout Berhasil!
            </p>
            <p className="text-green-700 dark:text-green-400 text-sm mt-1">
              Silakan pilih metode pembayaran untuk melanjutkan.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Pilih Metode Pembayaran</h3>
        <div className="space-y-3">
          {checkoutResponse.data.availablePaymentMethods.map((method) => {
            const serviceFee = checkoutResponse.data.serviceFeePreview.find(
              fee => fee.paymentMethod === method.paymentMethod
            )
            
            return (
              <div
                key={method.paymentMethod}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPaymentMethod === method.paymentMethod
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5'
                }`}
                onClick={() => setSelectedPaymentMethod(method.paymentMethod)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPaymentMethod === method.paymentMethod}
                        onChange={() => setSelectedPaymentMethod(method.paymentMethod)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {method.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  {serviceFee && (
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Total: Rp {serviceFee.totalWithFee.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Biaya: Rp {serviceFee.feeAmount.toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary showing total with selected service fee */}
      {selectedPaymentMethod && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-4">
          {(() => {
            const serviceFee = checkoutResponse.data.serviceFeePreview.find(
              fee => fee.paymentMethod === selectedPaymentMethod
            )
            return (
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Ringkasan Pembayaran
                </h4>                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-blue-700 dark:text-blue-400">
                    <span>Subtotal setelah diskon:</span>
                    <span>Rp {checkoutResponse.data.totalAfterDiscount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-blue-700 dark:text-blue-400">
                    <span>Biaya layanan:</span>
                    <span>Rp {serviceFee?.feeAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t border-blue-200 dark:border-blue-800 pt-1 flex justify-between font-medium text-blue-800 dark:text-blue-300">
                    <span>Total Akhir:</span>
                    <span>Rp {serviceFee?.totalWithFee.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {selectedPaymentMethod && (
        <button
          onClick={() => handlePayment(selectedPaymentMethod)}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Membuat Pembayaran...
            </>
          ) : (
            <>
              Buat Pembayaran
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </motion.div>
  )
}
