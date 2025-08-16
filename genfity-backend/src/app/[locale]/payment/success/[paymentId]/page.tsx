"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  CheckCircle, 
  Download, 
  ExternalLink,
  Loader2,
  FileText,
  Package
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/Auth/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { PaymentStatus } from "@/types/checkout"

export default function PaymentSuccessPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const paymentId = params.paymentId as string
  
  const [paymentData, setPaymentData] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string>("")

  // Get customer name from localStorage
  useEffect(() => {
    try {
      const userSession = localStorage.getItem('user_session')
      if (userSession) {
        const session = JSON.parse(userSession)
        setCustomerName(session.name || 'Customer')
      } else {
        // Fallback to other possible keys
        const storedName = localStorage.getItem('customerName') || localStorage.getItem('name') || 'Customer'
        setCustomerName(storedName)
      }
    } catch (error) {
      console.error('Error parsing user session:', error)
      setCustomerName('Customer')
    }
  }, [])

  // Fetch payment details
  useEffect(() => {
    if (!paymentId || !isAuthenticated || authLoading) return

    const fetchPaymentDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/payment/${paymentId}`)
        const result = await response.json()
        setPaymentData(result)
        setError(null)      } catch (err: unknown) {
        console.error("Error fetching payment details:", err)
        setError("Gagal memuat detail pembayaran")
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [paymentId, isAuthenticated, authLoading])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [authLoading, isAuthenticated, router])

  // Handle download PDF (future implementation)  
  const handleDownloadPDF = () => {
    toast({
      title: "Coming Soon",
      description: "PDF download feature will be available soon"
    })
  }  // Helper functions to get item price and calculate totals
  const getItemPrice = (item: PaymentStatus['data']['items'][0]) => {
    if (!item) return "0"
    return item.price.toString()
  }

  const getItemName = (item: PaymentStatus['data']['items'][0]) => {
    if (!item) return "Item"
    return item.name || "Item"
  }

  const getItemDescription = (item: PaymentStatus['data']['items'][0]) => {
    if (!item) return ""
    return item.category || ""
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {authLoading ? "Memverifikasi akses..." : "Memuat detail pembayaran..."}
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Detail Tidak Ditemukan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "Gagal memuat detail pembayaran"}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
            <Link
              href="/dashboard/transaction"
              className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali ke Transaksi
            </Link>
          </div>
        </div>
      </div>
    )  }

  // Ensure data exists before destructuring
  if (!paymentData.data || !paymentData.data.payment || !paymentData.data.transaction) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Data Tidak Lengkap
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Data pembayaran tidak lengkap atau rusak
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
            <Link
              href="/dashboard/transaction"
              className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kembali ke Transaksi
            </Link>
          </div>
        </div>
      </div>
    )
  }
  const { payment, pricing, items, voucher } = paymentData.data
  
  // Generate invoice data
  const invoiceData = {
    invoiceNumber: `INV-${new Date().getFullYear()}-${payment.id.slice(-6).toUpperCase()}`,
    issuedDate: payment.createdAt || new Date().toISOString(),
    paymentDate: payment.createdAt || new Date().toISOString()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 pt-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 print:hidden">

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoice Pembayaran</h1>
            <div className="flex gap-3">
              {/* <button
                onClick={handlePrintInvoice}
                className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <Receipt className="h-4 w-4" />
                Print
              </button> */}
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Success Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6 print:hidden"
        >
          <div className="flex items-start gap-4">
            <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                Pembayaran Berhasil!
              </h2>
              <p className="text-green-700 dark:text-green-300 mb-4">
                Terima kasih! Pembayaran Anda telah berhasil diproses dan dikonfirmasi.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  href={`/dashboard/transaction/${paymentData.data.transaction.id}`}
                  className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Lihat Detail Transaksi
                </Link>
                <Link
                  href="/products"
                  className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  Explore Products
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Invoice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 print:shadow-none print:border-0"
        >
          {/* Invoice Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">INVOICE</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">#{invoiceData.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary">PT GENERATION INFINITY INDONESIA</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">GENFITY - DIGITAL SOLUTION</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bill To */}              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tagihan Kepada:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{customerName}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {(() => {
                      try {
                        const userSession = localStorage.getItem('user_session')
                        if (userSession) {
                          const session = JSON.parse(userSession)
                          return session.email || 'Email tidak tersedia'
                        }
                        return localStorage.getItem('customerEmail') || localStorage.getItem('email') || 'Email tidak tersedia'
                      } catch (error) {
                        return 'Email tidak tersedia'
                      }
                    })()}
                  </p>
                </div>
              </div>

              {/* Invoice Info */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Detail Invoice:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tanggal Invoice:</span>
                    <span>{new Date(invoiceData.issuedDate).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tanggal Bayar:</span>
                    <span>{new Date(invoiceData.paymentDate).toLocaleDateString('id-ID')}</span>
                  </div>                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ID Pembayaran:</span>
                    <span className="font-mono text-xs">{payment?.id || 'ID tidak tersedia'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Metode Bayar:</span>
                    <span className="capitalize">{payment?.method?.replace('_', ' ') || 'Metode tidak tersedia'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Rincian Pemesanan:</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Item</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Qty</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Harga</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items && Array.isArray(items) ? items.map((item, index) => {
                    const itemPrice = getItemPrice(item)
                    const quantity = 1 // Default quantity since API doesn't provide this
                    const itemTotal = parseInt(itemPrice) * quantity
                    
                    return (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {getItemName(item)}
                            </p>
                            {getItemDescription(item) && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getItemDescription(item)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-center">{quantity}</td>
                        <td className="py-3 text-right">Rp {parseInt(itemPrice).toLocaleString('id-ID')}</td>
                        <td className="py-3 text-right font-medium">
                          Rp {itemTotal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada item ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="p-6">
            <div className="max-w-md ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span>Rp {pricing?.subtotal?.toLocaleString('id-ID') || '0'}</span>
              </div>
              
              {voucher && voucher.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Diskon ({voucher.code}):
                  </span>
                  <span className="text-green-600">-Rp {voucher.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}

              {pricing?.serviceFee?.amount && pricing.serviceFee.amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Biaya Admin:</span>
                  <span>Rp {pricing.serviceFee.amount.toLocaleString('id-ID')}</span>
                </div>
              )}

              <hr className="my-2" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total Bayar:</span>
                <span className="text-primary">Rp {payment.amount.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
                  LUNAS
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg print:hidden"
        >
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Catatan:</strong> Invoice ini telah dibayar penuh. Untuk pertanyaan lebih lanjut, 
            silakan hubungi tim support kami atau kunjungi dashboard Anda.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
