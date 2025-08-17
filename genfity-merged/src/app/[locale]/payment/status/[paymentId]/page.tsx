"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  ArrowLeft,
  CreditCard,
  Building,
  Calendar,
  Hash,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { PaymentStatus } from "@/types/checkout"
import { useAuth } from "@/components/Auth/AuthContext"

export default function PaymentStatusPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const paymentId = params.paymentId as string
  const [paymentData, setPaymentData] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [expiredDate, setExpiredDate] = useState<string>("")
  const [cancellingPayment, setCancellingPayment] = useState(false)
  const maxAttempts = 10 * 60 // 10 minutes with 3-second intervals

  // Status polling for pending payments
  useEffect(() => {
    if (!paymentId || !isAuthenticated || authLoading) return

    let intervalId: NodeJS.Timeout | null = null
    let currentAttempts = 0

    const checkStatus = async () => {
      try {
        setLoading(currentAttempts === 0) // Only show loading on first attempt
        const response = await fetch(`/api/payment/${paymentId}/status`)
        const result = await response.json()
        setPaymentData(result)
        setError(null)

        // If payment is successful, redirect to success page
        if (result.data.payment.status === "paid") {
          if (intervalId) clearInterval(intervalId)
          router.push(`/payment/success/${paymentId}`)
          return
        }

        // If payment failed, expired, cancelled, or rejected, stop polling
        if (["failed", "expired", "cancelled", "rejected"].includes(result.data.payment.status)) {
          if (intervalId) clearInterval(intervalId)
          return
        }

        // Increment attempts
        currentAttempts++
        setAttempts(currentAttempts)

        // Check if max attempts reached
        // if (currentAttempts >= maxAttempts) {
        //   if (intervalId) clearInterval(intervalId)
        //   setError("Timeout: Gagal mengecek status pembayaran setelah 5 menit")
        //   return
        // }
      } catch (err: any) {
        console.error("Error checking payment status:", err)
        setError("Gagal mengecek status pembayaran")
        currentAttempts++
        setAttempts(currentAttempts)
        
        if (currentAttempts >= maxAttempts) {
          if (intervalId) clearInterval(intervalId)
          setError("Timeout: Gagal mengecek status pembayaran setelah 10 menit")
        }
      } finally {
        setLoading(false)
      }
    }

    // Initial check
    checkStatus()

    // Set up polling interval for pending payments
    intervalId = setInterval(checkStatus, 3000) // Check every 3 seconds

    return () => {
      if (intervalId) clearInterval(intervalId)
    }  }, [paymentId, isAuthenticated, authLoading, router, maxAttempts])

  // Countdown timer for payment expiration
  useEffect(() => {
    if (!paymentData?.data?.payment) return

    const payment = paymentData.data.payment
    
    // Check if payment has expiresAt field (using type assertion for API response data)
    const expiresAt = (payment as any).expiresAt || (paymentData.data as any).expirationInfo?.paymentExpiresAt
    if (!expiresAt) return

    // Set expired date
    setExpiredDate(new Date(expiresAt).toLocaleString('id-ID'))

    const updateCountdown = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        let timeString = ""
        if (days > 0) timeString += `${days} hari `
        if (hours > 0) timeString += `${hours} jam `
        if (minutes > 0) timeString += `${minutes} menit `
        timeString += `${seconds} detik`

        setTimeLeft(timeString)
      } else {
        setTimeLeft("Expired")
      }
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const countdownInterval = setInterval(updateCountdown, 500)

    return () => clearInterval(countdownInterval)
  }, [paymentData])

  // Handle copy to clipboard
  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  // Handle cancel payment
  const handleCancelPayment = async () => {
    if (!paymentData?.data?.payment?.id) return
    
    try {
      setCancellingPayment(true)
      const response = await fetch(`/api/payment/${paymentData.data.payment.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: "Cancelled by user" })
      })
      
      // Refresh payment data to show updated status
      const statusResponse = await fetch(`/api/payment/${paymentId}/status`)
      const result = await statusResponse.json()
      setPaymentData(result)
    } catch (error) {
      console.error("Failed to cancel payment:", error)
      setError("Gagal membatalkan pembayaran")
    } finally {
      setCancellingPayment(false)
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [authLoading, isAuthenticated, router])

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {authLoading ? "Memverifikasi akses..." : "Memuat status pembayaran..."}
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
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Terjadi Kesalahan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "Gagal memuat status pembayaran"}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Coba Lagi
            </button>
            <Link
              href="/dashboard"
              className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }
  const { payment, instructions, additionalInfo, pricing, items, voucher, serviceFeeInfo } = paymentData.data
  
  // Group items by category with their related add-ons
  const groupItemsByCategory = () => {
    const packages = items.filter(item => item.type === 'package' || item.type === 'whatsapp_service')
    const addons = items.filter(item => item.type === 'addon')
    
    const grouped = packages.map(packageItem => ({
      package: packageItem,
      addons: addons.filter(addon => addon.category === packageItem.category)
    }))
    
    // Handle standalone add-ons (add-ons without matching package category)
    const usedAddonCategories = new Set(grouped.flatMap(group => group.addons.map(addon => addon.category)))
    const standaloneAddons = addons.filter(addon => !usedAddonCategories.has(addon.category))
    
    // Group standalone add-ons by category
    const standaloneGroups = standaloneAddons.reduce((acc, addon) => {
      if (!acc[addon.category]) {
        acc[addon.category] = []
      }
      acc[addon.category].push(addon)
      return acc
    }, {} as Record<string, typeof addons>)
    
    return {
      packageGroups: grouped,
      standaloneGroups: Object.entries(standaloneGroups).map(([category, addons]) => ({
        category,
        addons
      }))
    }
  }
  
  const { packageGroups, standaloneGroups } = groupItemsByCategory()
  
  // Status configuration
  const getStatusConfig = () => {
    switch (payment.status) {
      case "paid":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
          title: "Pembayaran Berhasil!",
          description: "Pembayaran Anda telah berhasil dikonfirmasi dan diproses."
        }
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          title: "Menunggu Pembayaran",
          description: "Silakan lakukan pembayaran sesuai instruksi di bawah ini."
        }
      case "failed":
        return {
          icon: XCircle,
          color: "text-red-500",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          title: "Pembayaran Gagal",
          description: "Pembayaran tidak dapat diproses. Silakan coba lagi."
        }
      case "expired":
        return {
          icon: XCircle,
          color: "text-gray-500",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800",
          title: "Pembayaran Kedaluwarsa",
          description: "Waktu pembayaran telah habis. Silakan buat pesanan baru."
        }
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-gray-500",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800",
          title: "Pembayaran Dibatalkan",
          description: "Pembayaran telah dibatalkan."
        }
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-500",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800",
          title: "Status Tidak Diketahui",
          description: "Status pembayaran sedang diperbarui."
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 pt-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Status Pembayaran</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-lg p-6`}
            >
              <div className="flex items-start gap-4">
                <StatusIcon className={`h-8 w-8 ${statusConfig.color} flex-shrink-0 mt-1`} />
                <div className="flex-1">
                  <h2 className={`text-xl font-bold ${statusConfig.color} mb-2`}>
                    {statusConfig.title}
                  </h2>                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {statusConfig.description}
                  </p>
                  {payment.status === "pending" && expiredDate && (
                    <div className="space-y-3">
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="text-sm text-orange-800 dark:text-orange-200">
                          <p className="font-medium">Batas Waktu Pembayaran:</p>
                          <p>{expiredDate}</p>
                          {timeLeft && timeLeft !== "Expired" && (
                            <p className="text-lg font-bold mt-1">Sisa waktu: {timeLeft}</p>
                          )}
                          {timeLeft === "Expired" && (
                            <p className="text-lg font-bold mt-1 text-red-600 dark:text-red-400">Pembayaran telah kedaluwarsa</p>
                          )}
                        </div>
                      </div>
                      {paymentData.data.statusInfo?.canCancel && (
                        <button
                          onClick={handleCancelPayment}
                          disabled={cancellingPayment}
                          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                        >
                          {cancellingPayment ? "Membatalkan..." : "Batalkan Pembayaran"}
                        </button>
                      )}
                    </div>
                  )}
                  {payment.status === "pending" && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                      <p>Status akan diperbarui secara otomatis setiap 3 detik</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>            {/* Payment Instructions (for pending payments) */}
            {payment.status === "pending" && additionalInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Instruksi Pembayaran
                </h3>
                
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-200 font-medium">{instructions}</p>
                </div>

                {/* Bank Details */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white">Detail Rekening</h4>
                  <div className="grid gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                      <span className="font-medium">{additionalInfo.bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">No. Rekening:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{additionalInfo.bankDetails.accountNumber}</span>
                        <button
                          onClick={() => handleCopy(additionalInfo.bankDetails.accountNumber, 'accountNumber')}
                          className="text-gray-400 hover:text-primary transition-colors p-1"
                          title="Salin nomor rekening"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        {copiedField === 'accountNumber' && (
                          <span className="text-xs text-green-600">Disalin!</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Atas Nama:</span>
                      <span className="font-medium">{additionalInfo.bankDetails.accountName}</span>
                    </div>
                  </div>
                </div>

                {/* Transfer Amount */}
                <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-primary font-medium">Jumlah Transfer:</span>
                    <div className="flex items-center gap-2">                      <span className="font-bold text-xl text-primary">
                        Rp {payment.amount.toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={() => handleCopy(payment.amount.toString(), 'amount')}
                        className="text-primary/60 hover:text-primary transition-colors p-1"
                        title="Salin jumlah transfer"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {copiedField === 'amount' && (
                        <span className="text-xs text-green-600">Disalin!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Steps */}
                {additionalInfo.steps && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Langkah-langkah:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {additionalInfo.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}                {/* Note */}
                {additionalInfo.note && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Catatan:</strong> {additionalInfo.note}
                    </p>
                  </div>
                )}

                {/* Service Fee Instructions Image */}
                {serviceFeeInfo && serviceFeeInfo.instructionType === "image" && serviceFeeInfo.instructionImageUrl && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Instruksi Pembayaran:</h4>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      <Image 
                        src={serviceFeeInfo.instructionImageUrl} 
                        alt="Instruksi Pembayaran"
                        width={800}
                        height={600}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Transaction Details */}
            {payment.status === "pending" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Rincian Pemesanan
                </h3>

                {/* Package Groups with their Add-ons */}
                <div className="space-y-3 mb-6">
                  {packageGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-2">
                      {/* Package Item */}
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {group.package.name}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {group.package.type.replace('_', ' ')} - {group.package.category}
                              {group.package.subcategory && ` / ${group.package.subcategory}`}
                            </p>
                            {group.package.type === 'whatsapp_service' && (group.package as any).duration && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Durasi: {(group.package as any).duration === 'month' ? 'Bulanan' : 'Tahunan'}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Qty: {(group.package as any).quantity || 1}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Harga satuan: Rp {(group.package.price / ((group.package as any).quantity || 1)).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              Rp {((group.package as any).totalPrice || group.package.price).toLocaleString('id-ID')}
                            </p>
                            {group.package.originalPriceIdr && group.package.originalPriceIdr !== group.package.price && (
                              <p className="text-xs text-gray-500 line-through">
                                Rp {group.package.originalPriceIdr.toLocaleString('id-ID')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Related Add-ons */}
                      {group.addons.length > 0 && (
                        <div className="ml-4 space-y-2">
                          {group.addons.map((addon, addonIndex) => (
                            <div key={addonIndex} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-300 dark:border-blue-600">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-600 dark:text-blue-400 text-sm">+ Add-on:</span>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {addon.name}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                    {addon.type.replace('_', ' ')} - {addon.category}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Qty: {(addon as any).quantity || 1}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Harga satuan: Rp {(addon.price / ((addon as any).quantity || 1)).toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    Rp {((addon as any).totalPrice || addon.price).toLocaleString('id-ID')}
                                  </p>
                                  {addon.originalPriceIdr && addon.originalPriceIdr !== addon.price && (
                                    <p className="text-xs text-gray-500 line-through">
                                      Rp {addon.originalPriceIdr.toLocaleString('id-ID')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Standalone Add-on Groups */}
                  {standaloneGroups.map((group, groupIndex) => (
                    <div key={`standalone-${groupIndex}`} className="space-y-2">
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          {group.category} Add-ons
                        </p>
                      </div>
                      <div className="space-y-2">
                        {group.addons.map((addon, addonIndex) => (
                          <div key={addonIndex} className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-300 dark:border-yellow-600">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-600 dark:text-yellow-400 text-sm">Add-on:</span>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {addon.name}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                  {addon.type.replace('_', ' ')} - {addon.category}
                                </p>
                                <div className="flex items-center gap-4 mt-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Qty: {(addon as any).quantity || 1}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Harga satuan: Rp {(addon.price / ((addon as any).quantity || 1)).toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  Rp {((addon as any).totalPrice || addon.price).toLocaleString('id-ID')}
                                </p>
                                {addon.originalPriceIdr && addon.originalPriceIdr !== addon.price && (
                                  <p className="text-xs text-gray-500 line-through">
                                    Rp {addon.originalPriceIdr.toLocaleString('id-ID')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span>Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {voucher && pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Diskon ({voucher.code}):</span>
                      <span className="text-green-600">-Rp {pricing.discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total setelah diskon:</span>
                    <span>Rp {pricing.totalAfterDiscount.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {pricing.serviceFee && pricing.serviceFee.amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Biaya Admin ({pricing.serviceFee.description}):</span>
                      <span>Rp {pricing.serviceFee.amount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {/* Unique code if any */}
                  {payment.uniqueCode && payment.uniqueCode > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Kode Unik:</span>
                      <span>Rp {payment.uniqueCode.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  <hr className="my-2" />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Bayar:</span>
                    <span className="text-primary">Rp {payment.amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Payment Details */}
          <div className="space-y-6">
            {/* Payment Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detail Pembayaran
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID Pembayaran</p>
                    <p className="font-mono text-sm">{payment.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Metode Pembayaran</p>
                    <p className="text-sm capitalize">{payment.method.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah</p>
                    <p className="text-sm font-medium">Rp {payment.amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Dibuat</p>
                    <p className="text-sm">{new Date(payment.createdAt).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {payment.status === 'paid' && 'Lunas'}
                      {payment.status === 'pending' && 'Menunggu'}
                      {payment.status === 'failed' && 'Gagal'}
                      {payment.status === 'expired' && 'Kedaluwarsa'}
                      {payment.status === 'cancelled' && 'Dibatalkan'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>            {/* Transaction Items */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Item Pembelian
              </h3>

              {/* Package Groups with their Add-ons */}
              <div className="space-y-3">
                {packageGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-2">
                    {/* Package Item */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {group.package.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {group.package.type.replace('_', ' ')} - {group.package.category}
                        </p>
                        {group.package.type === 'whatsapp_service' && (group.package as any).duration && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(group.package as any).duration === 'month' ? 'Bulanan' : 'Tahunan'}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Qty: {(group.package as any).quantity || 1} × Rp {(group.package.price / ((group.package as any).quantity || 1)).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Rp {((group.package as any).totalPrice || group.package.price).toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    {/* Related Add-ons */}
                    {group.addons.length > 0 && (
                      <div className="ml-4 space-y-2">
                        {group.addons.map((addon, addonIndex) => (
                          <div key={addonIndex} className="flex justify-between items-start pl-2 border-l-2 border-blue-300 dark:border-blue-600">
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-blue-600 dark:text-blue-400 text-xs">+</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {addon.name}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {addon.type.replace('_', ' ')} - {addon.category}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Qty: {(addon as any).quantity || 1} × Rp {(addon.price / ((addon as any).quantity || 1)).toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">Rp {((addon as any).totalPrice || addon.price).toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Standalone Add-on Groups */}
                {standaloneGroups.map((group, groupIndex) => (
                  <div key={`standalone-${groupIndex}`} className="space-y-2">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                        {group.category} Add-ons
                      </p>
                    </div>
                    <div className="space-y-2">
                      {group.addons.map((addon, addonIndex) => (
                        <div key={addonIndex} className="flex justify-between items-start pl-2 border-l-2 border-yellow-300 dark:border-yellow-600">
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-600 dark:text-yellow-400 text-xs">•</span>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {addon.name}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {addon.type.replace('_', ' ')} - {addon.category}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Qty: {(addon as any).quantity || 1} × Rp {(addon.price / ((addon as any).quantity || 1)).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">Rp {((addon as any).totalPrice || addon.price).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-semibold">Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {voucher && pricing.discountAmount > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Diskon ({voucher.code})</span>
                    <span className="text-xs text-green-600">-Rp {pricing.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {pricing.serviceFee && pricing.serviceFee.amount > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Biaya Admin</span>
                    <span className="text-xs">Rp {pricing.serviceFee.amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {payment.uniqueCode && payment.uniqueCode > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Kode Unik</span>
                    <span className="text-xs">Rp {payment.uniqueCode.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Total Bayar</span>
                  <span className="font-bold">Rp {payment.amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </motion.div>

            {/* Subscription Info */}
            {paymentData.data.subscriptionInfo && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Status Langganan
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status Aktivasi:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      paymentData.data.subscriptionInfo.activated 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {paymentData.data.subscriptionInfo.activated ? 'Aktif' : 'Belum Aktif'}
                    </span>
                  </div>
                  {paymentData.data.subscriptionInfo.message && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {paymentData.data.subscriptionInfo.message}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Refresh Button for Pending */}
            {payment.status === "pending" && (
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Status
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
