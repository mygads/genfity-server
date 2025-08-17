"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  User,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Hash,
  Package,
  Zap,
  MessageSquare,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { format } from "date-fns"
import { PaymentStatusBadge, TransactionStatusBadge } from "@/components/payments/PaymentStatusBadge"
import { ExpirationTimer, ExpirationInfo } from "@/components/payments/ExpirationTimer"

interface PaymentDetails {
  id: string
  amount: number
  serviceFee: number
  method: string
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'
  externalId: string | null
  paymentUrl: string | null
  createdAt: string
  paymentDate: string | null
  expiresAt: string | null
  transaction: {
    id: string
    currency: string
    status: string
    type: string
    originalType?: string
    amount: number
    originalAmount: number
    discountAmount: number
    serviceFeeAmount: number
    finalAmount: number
    transactionDate: string
    expiresAt: string | null
    user: {
      id: string
      name: string | null
      email: string
    } | null
    voucher: {
      id: string
      code: string
      name: string
      type: string
      value: number
    } | null
    items: Array<{
      type: string
      name: string
      category: string
      price_idr?: number
      price_usd?: number
      quantity?: number
      duration?: string
    }>
  } | null
  expirationInfo: {
    paymentExpiresAt: string | null
    transactionExpiresAt: string | null
    paymentTimeRemaining: string | null
    transactionTimeRemaining: string | null
    isPaymentExpired: boolean
    isTransactionExpired: boolean
  }
  adminActions: {
    canApprove: boolean
    needsManualApproval: boolean
    requiresAdminReview: boolean
  }
  paymentInstructions: {
    instructions: string
    additionalInfo: any
  }
}

export default function PaymentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const paymentId = params.paymentId as string

  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPaymentDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`)
      const data = await response.json()
      
      if (data.success) {
        setPayment(data.data)
      } else {
        console.error("Failed to fetch payment details:", data.error)
      }
    } catch (error) {
      console.error("Error fetching payment details:", error)
    } finally {
      setLoading(false)
    }
  }, [paymentId])

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails()
    }
  }, [paymentId, fetchPaymentDetails])

  const handlePaymentAction = async (action: 'approve' | 'reject') => {
    if (!payment) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNotes: `Payment ${action}ed via detail page`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchPaymentDetails()
      } else {
        console.error(`Failed to ${action} payment:`, data.error)
      }
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error)
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'idr') => {
    if (currency === 'usd') {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(amount)
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR"
    }).format(amount)
  }

  const getMethodLabel = (method: string) => {
    const methodLabels: Record<string, string> = {
      'manual_bank_transfer': 'Manual Bank Transfer',
      'va_bca': 'Virtual Account - BCA',
      'va_mandiri': 'Virtual Account - Mandiri',
      'va_bni': 'Virtual Account - BNI',
      'va_bri': 'Virtual Account - BRI',
      'va_permata': 'Virtual Account - Permata',
      'va_cimb': 'Virtual Account - CIMB Niaga',
      'qris': 'QRIS',
      'card_domestic': 'Card Payment (Domestic)',
      'card_international': 'Card Payment (International)',
      'e_wallet': 'E-Wallet',
      'midtrans': 'Midtrans Gateway',
    }
    return methodLabels[method] || method
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'package':
      case 'product':
        return <Package className="w-4 h-4" />
      case 'addon':
        return <Zap className="w-4 h-4" />
      case 'whatsapp_service':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }
  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'package':
      case 'product':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'addon':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'whatsapp_service':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTransactionTypeDescription = (type: string) => {
    switch (type) {
      case 'mixed_purchase':
        return 'Products/Services + WhatsApp API'
      case 'product_with_addons':
        return 'Products with Add-ons'
      case 'product_only':
        return 'Products Only'
      case 'addon_only':
        return 'Add-ons Only'
      case 'whatsapp_service':
        return 'WhatsApp API Service'
      default:
        return type.replace(/_/g, ' ')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading payment details...</span>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Not Found</h3>
            <p className="text-gray-600">The payment you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = payment.expirationInfo.isPaymentExpired || payment.expirationInfo.isTransactionExpired

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Payment Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Payment ID: {payment.id}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        {payment.adminActions.needsManualApproval && payment.status === 'pending' && !isExpired && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handlePaymentAction('reject')}
              disabled={actionLoading}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Payment
            </Button>
            <Button
              onClick={() => handlePaymentAction('approve')}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Payment
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Payment & Transaction Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Payment Method
                  </label>
                  <p className="text-lg font-semibold">{getMethodLabel(payment.method)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </label>
                  <div className="mt-1">
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Amount
                  </label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(payment.amount, payment.transaction?.currency)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Created At
                  </label>
                  <p className="text-sm">
                    {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {payment.paymentDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Payment Date
                  </label>
                  <p className="text-sm">
                    {format(new Date(payment.paymentDate), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}

              {payment.externalId && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    External ID
                  </label>
                  <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {payment.externalId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Information */}
          {payment.transaction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Transaction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Transaction ID
                    </label>
                    <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {payment.transaction.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Transaction Status
                    </label>
                    <div className="mt-1">
                      <TransactionStatusBadge status={payment.transaction.status} />
                    </div>
                  </div>
                </div>                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Type
                    </label>                    <div className="flex items-center gap-2">
                      <p className="text-sm capitalize">{getTransactionTypeDescription(payment.transaction.type)}</p>
                      {payment.transaction.originalType && payment.transaction.originalType !== payment.transaction.type && (
                        <Badge variant="outline" className="text-xs">
                          DB: {payment.transaction.originalType.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Currency
                    </label>
                    <p className="text-sm uppercase">{payment.transaction.currency}</p>
                  </div>
                </div>

                {payment.transaction.user && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Customer
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mt-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <p className="font-medium">{payment.transaction.user.name || 'No name'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.transaction.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transaction Items */}
          {payment.transaction?.items && payment.transaction.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Transaction Items
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of purchased items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payment.transaction.items.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getItemIcon(item.type)}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getItemTypeColor(item.type)}>
                              {item.type.replace('_', ' ')}
                            </Badge>
                            {item.duration && (
                              <Badge variant="outline">
                                {item.duration}
                              </Badge>
                            )}
                            {item.category && (
                              <Badge variant="outline">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">
                          Qty: {item.quantity || 1}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          Unit: {formatCurrency(
                            payment.transaction?.currency === 'usd' 
                              ? (item.price_usd || 0)
                              : (item.price_idr || 0), 
                            payment.transaction?.currency
                          )}
                        </div>
                        <p className="font-semibold">
                          Total: {formatCurrency(
                            (payment.transaction?.currency === 'usd' 
                              ? (item.price_usd || 0)
                              : (item.price_idr || 0)) * (item.quantity || 1), 
                            payment.transaction?.currency
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Pricing & Summary */}
        <div className="space-y-6">
          {/* Pricing Breakdown */}
          {payment.transaction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing Breakdown
                </CardTitle>
              </CardHeader>              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(payment.transaction.originalAmount, payment.transaction.currency)}
                  </span>
                </div>

                {payment.transaction.voucher && payment.transaction.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">Voucher Discount ({payment.transaction.voucher.code})</span>
                      <span className="text-sm font-medium">
                        -{formatCurrency(payment.transaction.discountAmount, payment.transaction.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">After Discount</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(
                          payment.transaction.originalAmount - payment.transaction.discountAmount, 
                          payment.transaction.currency
                        )}
                      </span>
                    </div>
                  </>
                )}

                {payment.serviceFee > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span className="text-sm">Service Fee</span>
                    <span className="text-sm font-medium">
                      +{formatCurrency(payment.serviceFee, payment.transaction.currency)}
                    </span>
                  </div>
                )}

                {/* Unique Code / Payment Code */}
                {payment.transaction.originalAmount > payment.transaction.finalAmount && (
                    <div className="flex justify-between text-purple-600">
                        <span className="text-sm">Kode Unik</span>
                        <span className="text-sm font-medium font-mono">
                            {payment.amount - (payment.transaction.originalAmount - payment.transaction.discountAmount + payment.serviceFee)}
                        </span>
                    </div>
                )}

                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Payment</span>
                  <span className="text-green-600">
                    {formatCurrency(payment.amount, payment.transaction.currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}          {/* Voucher Information */}
          {payment.transaction?.voucher && payment.transaction.discountAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Voucher Applied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="font-medium text-green-800 dark:text-green-300">
                    {payment.transaction.voucher.name}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Code: {payment.transaction.voucher.code}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Discount: {formatCurrency(payment.transaction.discountAmount, payment.transaction.currency)}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400">
                    {payment.transaction.voucher.type === 'percentage' 
                      ? `${payment.transaction.voucher.value}% discount applied`
                      : `Fixed discount applied`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expiration Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Expiration Information
              </CardTitle>
            </CardHeader>            <CardContent>
              <ExpirationInfo 
                paymentExpiresAt={payment.expirationInfo.paymentExpiresAt}
                transactionExpiresAt={payment.expirationInfo.transactionExpiresAt}
                paymentStatus={payment.status}
                transactionStatus={payment.transaction?.status || ''}
              />
            </CardContent>
          </Card>

          {/* Admin Notes */}
          {isExpired && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Expired Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">
                  This payment has expired and cannot be processed. 
                  {payment.expirationInfo.isPaymentExpired && " Payment timeout exceeded."}
                  {payment.expirationInfo.isTransactionExpired && " Transaction timeout exceeded."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
