"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Copy,
  Download,
  Calendar,
  DollarSign,
  Package,
  Tag,
  Receipt,
  Building,
  User,
  Hash,
  Printer,
  FileText,
  QrCode,
  ExternalLink
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { PaymentStatus } from "@/types/checkout"
import Invoice from "@/components/dashboard/Invoice"

export default function PaymentDetailPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const paymentId = params.paymentId as string
  
  const [paymentData, setPaymentData] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [cancellingPayment, setCancellingPayment] = useState(false)

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`/api/payment/${paymentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const data = await response.json()
        setPaymentData(data)
      } catch (error) {
        console.error("Failed to fetch payment details:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load payment details"
        })
      } finally {
        setLoading(false)
      }
    }

    if (paymentId) {
      fetchPaymentDetails()
    }
  }, [paymentId, toast])

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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard"
      })
    }
  }

  const handleCancelPayment = async () => {
    try {
      setCancellingPayment(true)
      
      const response = await fetch(`/api/payment/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: "Cancelled by user" })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Payment cancelled successfully"
        })
        
        // Refresh payment data
        const refreshResponse = await fetch(`/api/payment/${paymentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const refreshData = await refreshResponse.json()
        setPaymentData(refreshData)
      } else {
        throw new Error(data.message || "Failed to cancel payment")
      }
    } catch (error) {
      console.error("Failed to cancel payment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel payment"
      })
    } finally {
      setCancellingPayment(false)
    }
  }
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          icon: CheckCircle,
          label: "Payment Successful",
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800"
        }
      case "pending":
        return {
          icon: Clock,
          label: "Payment Pending",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800"
        }
      case "failed":
        return {
          icon: XCircle,
          label: "Payment Failed",
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800"
        }
      case "expired":
        return {
          icon: AlertTriangle,
          label: "Payment Expired",
          color: "text-orange-600",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-200 dark:border-orange-800"
        }
      case "cancelled":
        return {
          icon: XCircle,
          label: "Payment Cancelled",
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800"
        }
      default:
        return {
          icon: Clock,
          label: `Payment ${status}`,
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800"
        }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payment details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Payment not found</h3>
            <p className="text-muted-foreground mb-4">The payment you&#39;re looking for doesn&#39;t exist or you don&#39;t have access to it.</p>
            <Link href="/dashboard/payment">
              <Button>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }  const { payment, transaction, items, voucher, bankDetails, serviceFeeInfo } = paymentData.data
  const statusConfig = getStatusConfig(payment.status)
  const StatusIcon = statusConfig.icon
  // If payment is paid, show invoice
  if (payment.status === "paid") {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/payment">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoice</h1>
            <p className="text-muted-foreground">Payment ID: {payment.id}</p>
          </div>
        </div>

        {/* Invoice Component */}
        <Invoice paymentData={paymentData} />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/payment">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Details</h1>
          <p className="text-muted-foreground">Payment ID: {payment.id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Payment Status & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor} p-6`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full bg-white dark:bg-gray-900 shadow-sm`}>
                <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${statusConfig.color}`}>
                  {statusConfig.label}
                </h2>                <p className="text-sm text-muted-foreground mt-1">
                  {payment.status === "paid" && (
                    <>Payment completed successfully</>
                  )}
                  {payment.status === "pending" && (
                    <>Waiting for payment verification</>
                  )}
                  {payment.status === "failed" && (
                    <>Payment could not be processed</>
                  )}
                  {payment.status === "expired" && (
                    <>Payment time limit exceeded</>
                  )}
                  {(payment.status === "failed" || payment.status === "expired" || payment.status === "cancelled") && (
                    <>Created on {new Date(payment.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</>
                  )}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm">{payment.id}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(payment.id, "Payment ID")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm">{payment.transactionId}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(payment.transactionId, "Transaction ID")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="mt-1">{payment.method.replace(/_/g, ' ').toUpperCase()}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="mt-1 font-semibold text-lg">Rp {payment.amount.toLocaleString('id-ID')}</p>
                </div>

                {paymentData.data.pricing?.serviceFee && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service Fee</label>
                    <p className="mt-1">Rp {paymentData.data.pricing.serviceFee.amount.toLocaleString('id-ID')}</p>
                  </div>
                )}

                {payment.externalId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">External ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sm">{payment.externalId}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(payment.externalId!, "External ID")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items Purchased
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{item.type}</Badge>
                        {item.category && (
                          <Badge variant="secondary">{item.category}</Badge>
                        )}
                        {item.duration && (
                          <Badge variant="outline">{item.duration}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rp {item.price.toLocaleString('id-ID')}</p>
                      {item.originalPriceIdr && item.originalPriceIdr !== item.price && (
                        <p className="text-sm text-muted-foreground line-through">
                          Rp {item.originalPriceIdr.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>Rp {paymentData.data.pricing.subtotal.toLocaleString('id-ID')}</span>
                </div>
                
                {paymentData.data.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-Rp {paymentData.data.pricing.discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                {paymentData.data.pricing.serviceFee && (
                  <div className="flex justify-between text-sm">
                    <span>Service Fee</span>
                    <span>Rp {paymentData.data.pricing.serviceFee.amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>Rp {payment.amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {voucher && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Voucher Applied</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{voucher.code}</p>
                      <p className="text-sm text-green-600">-Rp {voucher.discountAmount.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bank Details (for manual transfer) */}
          {bankDetails && payment.method === "manual_bank_transfer" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Bank Transfer Details
                </CardTitle>
                <CardDescription>
                  Use these details to complete your payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{bankDetails.bankName}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono">{bankDetails.accountNumber}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(bankDetails.accountNumber, "Account Number")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{bankDetails.accountName}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transfer Amount</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono font-bold text-lg">Rp {payment.amount.toLocaleString('id-ID')}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(payment.amount.toString(), "Amount")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {payment.status === "pending" && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Payment Instructions
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li>Transfer the exact amount to the bank account above</li>
                      <li>Use the Transaction ID as your transfer reference</li>
                      <li>Payment will be automatically verified within 1-24 hours</li>
                      <li>You will receive confirmation once payment is verified</li>
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Instructions Image */}
          {payment.instructionImageUrl && payment.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Image
                    src={payment.instructionImageUrl}
                    alt="Payment Instructions"
                    width={400}
                    height={300}
                    className="mx-auto rounded-lg border"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payment.status === "pending" && payment.paymentUrl && (
                <Button className="w-full" asChild>
                  <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Continue Payment
                  </a>
                </Button>
              )}              {payment.status === "paid" && (
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              )}

              {payment.status === "pending" && (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleCancelPayment}
                  disabled={cancellingPayment}
                >
                  {cancellingPayment ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Cancel Payment
                </Button>
              )}
              
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/payment">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Payment Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>                {payment.status === "paid" && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Payment Completed</p>
                      <p className="text-xs text-muted-foreground">
                        Payment was successful
                      </p>
                    </div>
                  </div>
                )}

                {(payment.status === "failed" || payment.status === "expired" || payment.status === "cancelled") && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Payment {payment.status}</p>
                      <p className="text-xs text-muted-foreground">
                        Status updated
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
