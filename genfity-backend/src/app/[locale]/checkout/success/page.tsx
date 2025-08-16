"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, Download, Home, ArrowRight } from "lucide-react"
import Link from "next/link"
import { checkPaymentStatus } from "@/services/checkout-api"
import { PaymentStatus } from "@/types/checkout"

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("paymentId")
  const transactionId = searchParams.get("transactionId")
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Clear checkout state when arriving at success page
  useEffect(() => {
    // Clear checkout persistence state since checkout is complete
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('checkout-state')
        console.log("[Success] Checkout state cleared")
      } catch (error) {
        console.error('Error clearing checkout state:', error)
      }
    }
  }, [])

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!paymentId) {
        setError("Payment ID tidak ditemukan")
        setIsLoading(false)
        return
      }

      try {
        const status = await checkPaymentStatus(paymentId)
        setPaymentStatus(status)
      } catch (error: any) {
        console.error("Error fetching payment status:", error)
        setError(error.message || "Gagal mengambil status pembayaran")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentStatus()
  }, [paymentId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat status pembayaran...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentStatus) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-red-500 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Terjadi Kesalahan
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "Gagal memuat informasi pembayaran"}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }  const isPaid = paymentStatus.data.payment.status === "paid"
  const isPending = paymentStatus.data.payment.status === "pending" 
  const isFailed = paymentStatus.data.payment.status === "failed" || paymentStatus.data.payment.status === "expired"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className={`text-center p-8 ${
            isPaid ? 'bg-green-50 dark:bg-green-950/30' : 
            isPending ? 'bg-blue-50 dark:bg-blue-950/30' : 
            'bg-red-50 dark:bg-red-950/30'
          }`}>
            <div className="mb-4">
              {isPaid && (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              )}
              {isPending && (
                <div className="h-16 w-16 mx-auto">
                  <svg className="animate-spin h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              {isFailed && (
                <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            
            <h1 className={`text-2xl font-bold mb-2 ${
              isPaid ? 'text-green-800 dark:text-green-200' : 
              isPending ? 'text-blue-800 dark:text-blue-200' : 
              'text-red-800 dark:text-red-200'
            }`}>
              {isPaid && "Pembayaran Berhasil!"}
              {isPending && "Menunggu Pembayaran"}
              {isFailed && "Pembayaran Gagal"}
            </h1>
            
            <p className={`${
              isPaid ? 'text-green-700 dark:text-green-300' : 
              isPending ? 'text-blue-700 dark:text-blue-300' : 
              'text-red-700 dark:text-red-300'
            }`}>
              {isPaid && "Terima kasih! Pembayaran Anda telah dikonfirmasi."}
              {isPending && "Pembayaran Anda sedang diproses. Silakan tunggu konfirmasi."}
              {isFailed && "Pembayaran tidak dapat diproses. Silakan coba lagi."}
            </p>
          </div>

          {/* Payment Details */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Detail Pembayaran</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ID Pembayaran:</span>
                  <span className="font-mono">{paymentStatus.data.payment.id}</span>
                </div>
                {transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ID Transaksi:</span>
                    <span className="font-mono">{transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Metode Pembayaran:</span>
                  <span>{paymentStatus.data.payment.method}</span>
                </div>                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Jumlah:</span>
                  <span className="font-medium">
                    Rp {paymentStatus.data.payment.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isPaid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    isPending ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {paymentStatus.data.payment.status === 'paid' && 'Lunas'}
                    {paymentStatus.data.payment.status === 'pending' && 'Menunggu'}
                    {paymentStatus.data.payment.status === 'failed' && 'Gagal'}
                    {paymentStatus.data.payment.status === 'expired' && 'Kedaluwarsa'}
                    {paymentStatus.data.payment.status === 'cancelled' && 'Dibatalkan'}
                    {paymentStatus.data.payment.status === 'rejected' && 'Ditolak'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tanggal:</span>
                  <span>{new Date(paymentStatus.data.payment.createdAt).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Success Actions */}
            {isPaid && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Langkah Selanjutnya
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Anda akan menerima email konfirmasi dalam 5-10 menit</li>
                    <li>• Akses layanan akan diaktifkan dalam 1x24 jam</li>
                    <li>• Tim kami akan menghubungi Anda untuk setup lebih lanjut</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Cetak Receipt
                  </button>
                  <Link
                    href="/dashboard"
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Pending Actions */}
            {isPending && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Instruksi Pembayaran
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Silakan selesaikan pembayaran sesuai instruksi yang diberikan. 
                    Status akan diperbarui secara otomatis setelah pembayaran dikonfirmasi.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Refresh Status
                  </button>
                  <Link
                    href="/"
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    Beranda
                  </Link>
                </div>
              </div>
            )}

            {/* Failed Actions */}
            {isFailed && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    Apa yang harus dilakukan?
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• Periksa kembali detail pembayaran Anda</li>
                    <li>• Pastikan saldo rekening mencukupi</li>
                    <li>• Coba gunakan metode pembayaran lain</li>
                    <li>• Hubungi customer service jika masalah berlanjut</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/checkout"
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Coba Lagi
                  </Link>
                  <Link
                    href="/contact"
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Hubungi Support
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Additional Information */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Butuh bantuan? <Link href="/contact" className="text-primary hover:underline">Hubungi customer service</Link></p>
        </div>
      </div>
    </div>
  )
}
