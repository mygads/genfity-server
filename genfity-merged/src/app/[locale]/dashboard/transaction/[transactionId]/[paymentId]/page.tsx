"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Ban,
  Loader2,
  Receipt,
  CreditCard,
  Building,
  Hash,
  Calendar,
  RefreshCw,
  Info
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import type { PaymentStatus } from "@/types/checkout"

export default function PaymentInstructionPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const transactionId = params.transactionId as string
  const paymentId = params.paymentId as string
  const [paymentData, setPaymentData] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [expiredDate, setExpiredDate] = useState<string>("")
  
  // Utility functions for formatting
  const formatStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'created': 'Created',
      'pending': 'Pending',
      'in-progress': 'In Progress',
      'success': 'Success',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'expired': 'Expired',
      'failed': 'Failed',
      'paid': 'Paid'
    }
    return statusMap[status] || status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatPaymentMethod = (method: string): string => {
    const methodMap: { [key: string]: string } = {
      'manual_bank_transfer': 'Manual Bank Transfer',
      'bank_transfer': 'Bank Transfer',
      'credit_card': 'Credit Card',
      'e_wallet': 'E-Wallet',
      'virtual_account': 'Virtual Account',
      'qr_code': 'QR Code'
    }
    return methodMap[method] || method.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "success":
      case "completed":
      case "paid":
        return "default"
      case "pending":
      case "created":
      case "in-progress":
        return "secondary"
      case "failed":
      case "expired":
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }
  
  // Status polling for pending payments (unlimited)
  useEffect(() => {
    if (!paymentId) return

    let intervalId: NodeJS.Timeout | null = null

    const checkStatus = async () => {
      try {
        setRefreshing(true)
        const response = await fetch(`/api/payment/${paymentId}/status`)
        const result: PaymentStatus = await response.json()
        setPaymentData(result)
        setError(null)

        // If payment is successful, redirect to success page
        if (result.data.payment.status === "paid") {
          if (intervalId) clearInterval(intervalId)
          return
        }

        // If payment failed, expired, cancelled, or rejected, stop polling
        if (["failed", "expired", "cancelled", "rejected"].includes(result.data.payment.status)) {
          if (intervalId) clearInterval(intervalId)
          return
        }
      } catch (err: unknown) {
        console.error("Error checking payment status:", err)
        setError("Gagal mengecek status pembayaran")
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }

    // Initial check
    checkStatus()

    // Set up polling interval for pending payments (no time limit)
    intervalId = setInterval(checkStatus, 3000) // Check every 3 seconds

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [paymentId, router])

  // Redirect to invoice page if payment is paid - moved before conditional returns
  useEffect(() => {
    if (paymentData?.data?.payment?.status === "paid") {
      router.push(`/payment/success/${paymentId}`)
      return
    }
  }, [paymentData?.data?.payment?.status, paymentId, router])

  // Handle copy to clipboard
  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
      })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard"
      })
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          label: "Awaiting Payment",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800"
        }
      case "paid":
        return {
          icon: CheckCircle,
          label: "Payment Completed",
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800"
        }
      case "cancelled":
        return {
          icon: Ban,
          label: "Payment Cancelled",
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800"
        }
      case "expired":
        return {
          icon: XCircle,
          label: "Payment Expired",
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800"
        }
      case "failed":
        return {
          icon: AlertCircle,
          label: "Payment Failed",
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800"
        }
      default:
        return {
          icon: AlertCircle,
          label: status,
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800"
        }    }
  }

  // Countdown timer for payment expiration
  useEffect(() => {
    if (!paymentData?.data?.payment) return

    const payment = paymentData.data.payment
    
    // Check if payment has expiresAt field (from PaymentStatusData interface)
    const expiresAt = (payment as any).expiresAt
    if (!expiresAt) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`)
        } else {
          setTimeLeft(`${seconds}s`)
        }
      } else {
        setTimeLeft("Expired")
      }
    }

    // Set expired date for display
    setExpiredDate(new Date(expiresAt).toLocaleString('id-ID'))

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [paymentData])

  // Redirect to invoice page if payment is paid - moved before conditional returns
  useEffect(() => {
    if (paymentData?.data?.payment?.status === "paid") {
      router.push(`/payment/success/${paymentId}`)
      return
    }
  }, [paymentData?.data?.payment?.status, paymentId, router])

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium">Loading Payment Details</h3>
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Payment not found</h3>
            <p className="text-muted-foreground mb-4">{error || "The payment you're looking for doesn't exist or you don't have access to it."}</p>
            <Link href={`/dashboard/transaction/${transactionId}`}>
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transaction
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )  }

  const { payment, instructions, additionalInfo, pricing, items, voucher, serviceFeeInfo } = paymentData.data
  const statusConfig = getStatusConfig(payment.status)
  const StatusIcon = statusConfig.icon
  const isPending = payment.status === "pending"

  // Don't render the page if redirecting
  if (payment.status === "paid") {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium">Redirecting to Invoice</h3>
            <p className="text-muted-foreground">Payment completed successfully...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/transaction/${transactionId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
            <p className="text-muted-foreground">
              Payment ID: {payment.id ? payment.id : 'N/A'}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Payment Status & Instructions */}
        <div className="md:col-span-2 space-y-6">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-lg border-2 ${statusConfig.bgColor} ${statusConfig.borderColor}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm`}>
                <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${statusConfig.color}`}>
                  {statusConfig.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {payment.status === "pending" && "Complete your payment using the instructions below"}
                  {payment.status === "paid" && "Your payment has been processed successfully"}
                  {payment.status === "cancelled" && "This payment has been cancelled"}
                  {payment.status === "expired" && "This payment has expired"}
                  {payment.status === "failed" && "Payment processing failed"}
                </p>                {isPending && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Status akan diperbarui secara otomatis setiap 3 detik</p>
                    <p>Terakhir dicek: {new Date().toLocaleTimeString('id-ID')}</p>
                    {expiredDate && (
                      <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                          <strong>Payment expires:</strong> {expiredDate}
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                          <strong>Time remaining:</strong> {timeLeft === "Expired" ? "Payment Expired" : timeLeft}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Payment Details Card */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Payment ID</p>
                    <p className="font-mono text-sm">{payment.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Payment Method</p>
                    <p className="text-sm">{formatPaymentMethod(payment.method)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Created Date</p>
                    <p className="text-sm">{new Date(payment.createdAt).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                  <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>
                      {formatStatus(payment.status)}
                    </Badge>
                  </div>
                </div>

                {/* Expiry Information for pending payments */}
                {isPending && expiredDate && (
                  <>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Expires At</p>
                        <p className="text-sm">{expiredDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Time Remaining</p>
                        <p className={`text-sm font-medium ${timeLeft === "Expired" ? "text-red-600" : "text-orange-600"}`}>
                          {timeLeft === "Expired" ? "Payment Expired" : timeLeft}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary">Rp {payment.amount.toLocaleString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions (only for pending payments) */}
          {isPending && additionalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {instructions && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {instructions}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {additionalInfo.bankDetails && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Bank Transfer Details</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-medium">{additionalInfo.bankDetails.bankName}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-lg font-bold">{additionalInfo.bankDetails.accountNumber}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(additionalInfo.bankDetails.accountNumber, "Account Number")}
                          >
                            {copiedField === "Account Number" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-medium">{additionalInfo.bankDetails.accountName}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(additionalInfo.bankDetails.accountName, "Account Name")}
                          >
                            {copiedField === "Account Name" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Transfer Amount */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-medium">Transfer Amount:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xl text-primary">
                            Rp {payment.amount.toLocaleString('id-ID')}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(payment.amount.toString(), "Amount")}
                          >
                            {copiedField === "Amount" ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Steps */}
                {additionalInfo.steps && additionalInfo.steps.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Steps to complete payment:</h4>
                    <ol className="space-y-2">
                      {additionalInfo.steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Note */}
                {additionalInfo.note && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Important Note:</strong> {additionalInfo.note}
                    </p>
                  </div>
                )}

                {/* Service Fee Instructions Image */}
                  <div>
                    <h4 className="font-medium mb-3">Payment Instructions:</h4>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      <Image 
                        src={serviceFeeInfo.instructionImageUrl} 
                        alt="Payment Instructions"
                        width={800}
                        height={600}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction Details */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Receipt className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {item.type.replace('_', ' ')} - {item.category} / {item.subcategory}
                      </p>
                      {item.duration && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Duration: {item.duration}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Rp {item.price.toLocaleString('id-ID')}</p>
                      {item.originalPriceIdr && item.originalPriceIdr !== item.price && (
                        <p className="text-xs text-gray-500 line-through">
                          Rp {item.originalPriceIdr.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>Rp {pricing.subtotal.toLocaleString('id-ID')}</span>
                </div>
                
                {voucher && pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount ({voucher.code}):</span>
                    <span className="text-green-600">-Rp {pricing.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}

                {voucher && pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total after discount:</span>
                    <span>Rp {pricing.totalAfterDiscount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                {pricing.serviceFee && pricing.serviceFee.amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Admin Fee ({pricing.serviceFee.description}):</span>
                    <span>Rp {pricing.serviceFee.amount.toLocaleString('id-ID')}</span>
                  </div>
                )}

                {payment.uniqueCode && payment.uniqueCode > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unique Code:</span>
                    <span>Rp {payment.uniqueCode.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Payment:</span>
                  <span className="text-primary">Rp {payment.amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => router.push(`/dashboard/transaction/${transactionId}`)}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transaction
              </Button>

              {payment.status === "paid" && (
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/payment/success/${payment.id}`)}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Invoice
                </Button>
              )}

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push('/dashboard/transaction')}
              >
                View All Transactions
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          {paymentData.data.subscriptionInfo && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Subscription Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Activation Status:</span>
                  <Badge variant={paymentData.data.subscriptionInfo.activated ? "default" : "secondary"}>
                    {paymentData.data.subscriptionInfo.activated ? 'Active' : 'Not Active'}
                  </Badge>
                </div>
                {paymentData.data.subscriptionInfo.message && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {paymentData.data.subscriptionInfo.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
