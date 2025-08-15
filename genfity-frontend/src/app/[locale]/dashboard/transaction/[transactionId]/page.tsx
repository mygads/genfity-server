"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Package,
  CreditCard,
  Phone,
  FileText,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Ban,
  Plus,
  Loader2,
  Receipt,
  ExternalLink,
  Tag,
  DollarSign,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { getTransactionDetails, cancelTransaction, createPayment, cancelPayment } from "@/services/checkout-api"
import type { TransactionItem, TransactionDetailResponse } from "@/types/checkout"

export default function TransactionDetailPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const transactionId = params.transactionId as string
  const [transactionData, setTransactionData] = useState<TransactionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [cancellingTransaction, setCancellingTransaction] = useState(false)
  const [cancellingPayment, setCancellingPayment] = useState(false)
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("")
  
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

  const formatTransactionType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'package': 'Package',
      'addon': 'Add-on',
      'whatsapp': 'WhatsApp Service',
      'package_addon': 'Package & Add-on',
      'package_whatsapp': 'Package & WhatsApp',
      'addon_whatsapp': 'Add-on & WhatsApp',
      'package_addon_whatsapp': 'Package, Add-on & WhatsApp'
    }
    return typeMap[type] || type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' & ')
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
  
  const fetchTransactionDetails = async () => {
    try {
      setRefreshing(true)
      const response: TransactionDetailResponse = await getTransactionDetails(transactionId)
      console.log('Transaction data received:', response.data) // Debug log
      setTransactionData(response.data)
      
      // Show success toast only when manually refreshing (not on initial load)
      if (!loading) {
        toast({
          title: "Success",
          description: "Transaction data refreshed successfully"
        })
      }
    } catch (error) {
      console.error("Failed to fetch transaction details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transaction details"
      })
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      await fetchTransactionDetails()
      setLoading(false)
    }

    if (transactionId) {
      loadInitialData()
    }
  }, [transactionId, toast])

  // Countdown timer for transaction expiration
  useEffect(() => {
    if (!transactionData?.expiresAt) return

    const updateCountdown = () => {
      const now = new Date().getTime()
      const expiry = new Date(transactionData.expiresAt!).getTime()
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

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [transactionData?.expiresAt])

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
      console.error("Failed to copy text:", error)
    }
  }

  const handleCancelTransaction = async () => {
    try {
      setCancellingTransaction(true)
      await cancelTransaction(transactionId, "Cancelled by user")
      
      toast({
        title: "Success",
        description: "Transaction cancelled successfully"
      })
      
      // Refresh transaction data
      await fetchTransactionDetails()
    } catch (error) {
      console.error("Failed to cancel transaction:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel transaction"
      })
    } finally {
      setCancellingTransaction(false)
    }
  }  
  const handleCreatePayment = async (paymentMethod: string) => {
    try {
      setCreatingPayment(true)
      const response = await createPayment({
        transactionId: transactionId,
        paymentMethod: paymentMethod
      })
      
      if (response.success && response.data.payment.id) {
        toast({
          title: "Payment Created",
          description: "Redirecting to payment page..."
        })
        router.push(`/dashboard/transaction/${transactionId}/${response.data.payment.id}`)
      }
    } catch (error) {
      console.error("Failed to create payment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create payment"
      })
    } finally {
      setCreatingPayment(false)
    }
  }

  const handleCancelPayment = async () => {
    if (!transactionData?.payment) return
    
    try {
      setCancellingPayment(true)
      await cancelPayment(transactionData.payment.id, "Cancelled by user")
      
      toast({
        title: "Success",
        description: "Payment cancelled successfully"
      })
      
      // Refresh transaction data to show updated payment status
      await fetchTransactionDetails()
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
      case "created":
        return {
          icon: Plus,
          label: "Created",
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800"
        }
      case "pending":
        return {
          icon: Clock,
          label: "Pending Payment",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800"
        }
      case "in-progress":
        return {
          icon: Loader2,
          label: "In Progress",
          color: "text-orange-600",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-200 dark:border-orange-800"
        }
      case "success":
        return {
          icon: CheckCircle,
          label: "Completed",
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800"
        }
      case "cancelled":
        return {
          icon: Ban,
          label: "Cancelled",
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800"
        }
      case "expired":
        return {
          icon: XCircle,
          label: "Expired",
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800"
        }
      case "failed":
        return {
          icon: AlertCircle,
          label: "Failed",
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
        }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium">Loading Transaction Details</h3>
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!transactionData) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Transaction not found</h3>
            <p className="text-muted-foreground mb-4">The transaction you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            <Link href="/dashboard/transaction">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transactions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(transactionData.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/transaction">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
            <p className="text-muted-foreground">
              Transaction #{transactionData.id}
            </p>
          </div>
        </div>
        <Button 
          onClick={fetchTransactionDetails} 
          variant="outline" 
          className="gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Main Details */}
        <div className="space-y-6">
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
              <div>
                <h3 className={`text-lg font-semibold ${statusConfig.color}`}>
                  {statusConfig.label}
                </h3>                <p className="text-sm text-muted-foreground">
                  {transactionData.status === "success" && "Transaction completed successfully"}
                  {transactionData.status === "pending" && "Waiting for payment"}
                  {transactionData.status === "created" && "Ready for payment"}
                  {transactionData.status === "in-progress" && "Being processed by our team"}
                  {transactionData.status === "cancelled" && "Transaction was cancelled"}
                  {transactionData.status === "expired" && "Transaction has expired"}
                  {transactionData.status === "failed" && "Transaction failed to process"}
                </p>
                
                {/* Countdown Timer */}
                {(transactionData.status === "created" || transactionData.status === "pending") && 
                 transactionData.expiresAt && timeLeft !== "Expired" && (
                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Time remaining: </span>
                      <span className="text-sm font-mono text-orange-600 dark:text-orange-400">
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Transaction Information */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5" />
                Transaction Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm">{transactionData.id}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(transactionData.id, "Transaction ID")}
                    >
                      {copiedField === "Transaction ID" ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="font-medium mt-1">{formatTransactionType(transactionData.type)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Currency</label>
                  <p className="font-medium uppercase mt-1">{transactionData.currency}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="font-medium mt-1">
                    {new Date(transactionData.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {transactionData.expiresAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expires At</label>
                    <p className="font-medium mt-1">
                      {new Date(transactionData.expiresAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {transactionData.notes && transactionData.notes.trim() !== '' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="mt-1 whitespace-pre-wrap">{transactionData.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Package className="h-5 w-5" />
                Transaction Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Product Transactions */}
                {(transactionData as any).productTransactions && Array.isArray((transactionData as any).productTransactions) && (transactionData as any).productTransactions.length > 0 && (
                  <div className="border border-border/50 rounded-lg p-4 bg-card">
                    <h4 className="font-medium mb-3 text-foreground">Products</h4>
                    <div className="space-y-3">
                      {(transactionData as any).productTransactions.map((productTransaction: any, index: number) => (
                        <div key={productTransaction.id || index} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md bg-primary/10 p-2 flex-shrink-0">
                            <Package className="h-full w-full text-primary" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">
                              {productTransaction.package?.name_en || productTransaction.package?.name_id || 'Product'}
                            </h5>
                            <p className="text-sm text-muted-foreground">Package • Qty: {productTransaction.quantity || 1}</p>
                            <p className="text-sm font-medium text-primary">
                              Rp {parseInt(productTransaction.package?.price_idr || "0").toLocaleString('id-ID')}
                            </p>
                            <div className="mt-1">
                              <Badge variant={getStatusBadgeVariant(productTransaction.status)} className="text-xs">
                                {formatStatus(productTransaction.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addon Transactions */}
                {(transactionData as any).addonTransactions && Array.isArray((transactionData as any).addonTransactions) && (transactionData as any).addonTransactions.length > 0 && (
                  <div className="border border-border/50 rounded-lg p-4 bg-card">
                    <h4 className="font-medium mb-3 text-foreground">Add-ons</h4>
                    <div className="space-y-3">
                      {(transactionData as any).addonTransactions.map((addonTransaction: any, index: number) => (
                        <div key={addonTransaction.id || index} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md bg-secondary/10 p-2 flex-shrink-0">
                            <Plus className="h-full w-full text-secondary" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">
                              {addonTransaction.addon?.name_en || addonTransaction.addon?.name_id || 'Add-on'}
                            </h5>
                            <p className="text-sm text-muted-foreground">Add-on • Qty: {addonTransaction.quantity || 1}</p>
                            <p className="text-sm font-medium text-primary">
                              Rp {parseInt(addonTransaction.addon?.price_idr || "0").toLocaleString('id-ID')}
                            </p>
                            <div className="mt-1">
                              <Badge variant={getStatusBadgeVariant(addonTransaction.status)} className="text-xs">
                                {formatStatus(addonTransaction.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp Transaction */}
                {transactionData.whatsappTransaction && (transactionData.whatsappTransaction as any).whatsappPackage && (
                  <div className="border border-border/50 rounded-lg p-4 bg-card">
                    <h4 className="font-medium mb-3 text-foreground">WhatsApp Service</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md bg-green-100 p-2 flex-shrink-0">
                        <Phone className="h-full w-full text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium">{(transactionData.whatsappTransaction as any).whatsappPackage.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{transactionData.whatsappTransaction.duration}</Badge>
                          {(transactionData.whatsappTransaction as any).whatsappPackage.description && (
                            <p className="text-xs text-muted-foreground">
                              {(transactionData.whatsappTransaction as any).whatsappPackage.description}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-medium text-primary mt-1">
                          Rp {(transactionData.whatsappTransaction.duration === "year" 
                            ? (transactionData.whatsappTransaction as any).whatsappPackage.priceYear 
                            : (transactionData.whatsappTransaction as any).whatsappPackage.priceMonth
                          ).toLocaleString('id-ID')}
                        </p>
                        <div className="mt-1">
                          <Badge variant={getStatusBadgeVariant(transactionData.whatsappTransaction.status)} className="text-xs">
                            {formatStatus(transactionData.whatsappTransaction.status)}
                          </Badge>
                          {transactionData.whatsappTransaction.startDate && transactionData.whatsappTransaction.endDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(transactionData.whatsappTransaction.startDate).toLocaleDateString('id-ID')} - {new Date(transactionData.whatsappTransaction.endDate).toLocaleDateString('id-ID')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fallback: Show old structure if new structure not available */}
                {!((transactionData as any).productTransactions || (transactionData as any).addonTransactions) && 
                 (transactionData as any).productTransaction && (
                  <div className="border border-border/50 rounded-lg p-4 bg-card">
                    <h4 className="font-medium mb-3 text-foreground">Products (Legacy)</h4>
                    <div className="space-y-3">
                      {(transactionData as any).productTransaction.package && (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md bg-primary/10 p-2 flex-shrink-0">
                            <Package className="h-full w-full text-primary" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">
                              {(transactionData as any).productTransaction.package.name_en || 
                               (transactionData as any).productTransaction.package.name_id}
                            </h5>
                            <p className="text-sm text-muted-foreground">Package</p>
                            <p className="text-sm font-medium text-primary">
                              Rp {parseInt((transactionData as any).productTransaction.package.price_idr).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {(transactionData as any).productTransaction.addon && (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md bg-secondary/10 p-2 flex-shrink-0">
                            <Plus className="h-full w-full text-secondary" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">
                              {(transactionData as any).productTransaction.addon.name_en || 
                               (transactionData as any).productTransaction.addon.name_id}
                            </h5>
                            <p className="text-sm text-muted-foreground">Add-on</p>
                            <p className="text-sm font-medium text-primary">
                              Rp {parseInt((transactionData as any).productTransaction.addon.price_idr).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {transactionData.payment && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sm">{transactionData.payment.id}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(transactionData.payment!.id, "Payment ID")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Method</label>
                    <p className="font-medium mt-1">
                      {formatPaymentMethod(transactionData.payment.method)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount</label>
                    <p className="font-bold text-lg mt-1">
                      Rp {(typeof transactionData.payment.amount === 'string' 
                        ? parseInt(transactionData.payment.amount) 
                        : transactionData.payment.amount
                      ).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(transactionData.payment.status)}>
                        {formatStatus(transactionData.payment.status)}
                      </Badge>
                    </div>
                  </div>

                  {transactionData.payment.paymentDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Date</label>
                      <p className="font-medium mt-1">
                        {new Date(transactionData.payment.paymentDate).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {transactionData.payment.externalId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">External ID</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm">{transactionData.payment.externalId}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(transactionData.payment!.externalId!, "External ID")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </CardHeader>            
            <CardContent className="space-y-3">
              {/* Create Payment button logic */}
              {(() => {
                const isTransactionExpired = transactionData.expiresAt && new Date(transactionData.expiresAt) < new Date()
                const canCreatePayment = (
                  // No payment exists and transaction is created
                  (transactionData.status === "created" && !transactionData.payment) ||
                  // Payment exists but is cancelled/expired/failed, transaction not expired and status is pending
                  (transactionData.payment && 
                   ["cancelled", "expired", "failed"].includes(transactionData.payment.status) &&
                   transactionData.status === "pending" && 
                   !isTransactionExpired)
                )

                if (canCreatePayment) {
                  return (
                    <Button 
                      className="w-full" 
                      onClick={() => handleCreatePayment("manual_bank_transfer")}
                      disabled={creatingPayment}
                    >
                      {creatingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          {transactionData.payment ? "Create New Payment" : "Create Payment"}
                        </>
                      )}
                    </Button>
                  )
                }
                return null
              })()}

              {/* View Payment Instructions button */}
              {transactionData.payment && 
               transactionData.payment.status === "pending" && 
               transactionData.status === "pending" && (
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/dashboard/transaction/${transactionId}/${transactionData.payment!.id}`)}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Payment Instructions
                </Button>
              )}              {/* Continue Payment if pending and has payment URL */}
              {transactionData.payment && 
               transactionData.payment.status === "pending" && 
               transactionData.payment.paymentUrl && (
                <Button className="w-full" asChild>
                  <a href={transactionData.payment.paymentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Continue Payment
                  </a>
                </Button>
              )}

              {/* Cancel Payment if pending */}
              {transactionData.payment && 
               transactionData.payment.status === "pending" && (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleCancelPayment}
                  disabled={cancellingPayment}
                >
                  {cancellingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling Payment...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Payment
                    </>
                  )}
                </Button>
              )}

              {/* View Invoice if payment is paid */}
              {transactionData.payment && transactionData.payment.status === "paid" && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => router.push(`/payment/success/${transactionData.payment!.id}`)}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Invoice
                </Button>
              )}

              {/* Cancel Transaction */}
              {(transactionData.status === "created" || transactionData.status === "pending") && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancelTransaction}
                  disabled={cancellingTransaction}
                >
                  {cancellingTransaction ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Cancel Transaction
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Price Summary */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <DollarSign className="h-5 w-5" />
                Price Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Amount:</span>
                  <span>Rp {parseInt(transactionData.originalAmount).toLocaleString('id-ID')}</span>
                </div>
                
                {transactionData.discountAmount && parseInt(transactionData.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="text-green-600">-Rp {parseInt(transactionData.discountAmount).toLocaleString('id-ID')}</span>
                  </div>
                )}

                {transactionData.discountAmount && parseInt(transactionData.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After Discount:</span>
                    <span>Rp {parseInt(transactionData.totalAfterDiscount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                {transactionData.serviceFeeAmount && parseInt(transactionData.serviceFeeAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Fee:</span>
                    <span>Rp {parseInt(transactionData.serviceFeeAmount).toLocaleString('id-ID')}</span>
                  </div>
                )}                
                {/* Unique Code */}
                {(() => {
                  const originalAmount = parseInt(transactionData.amount || "0")
                  const discountAmount = parseInt(transactionData.discountAmount || "0")
                  const serviceFeeAmount = parseInt(transactionData.serviceFeeAmount || "0")
                  const totalPayment = parseInt(transactionData.finalAmount || "0")
                  
                  const calculatedAmount = originalAmount - discountAmount + serviceFeeAmount
                  const uniqueCode = totalPayment - calculatedAmount
                  
                  return uniqueCode > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kode Unik:</span>
                      <span className="font-mono text-primary font-semibold">{uniqueCode}</span>
                    </div>
                  ) : null
                })()}

                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total Payment:</span>
                  <span className="text-primary">Rp {parseInt(transactionData.finalAmount).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {transactionData.voucherId && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Voucher Applied</span>
                    </div>
                    <span className="text-sm text-green-600">
                      -{parseInt(transactionData.discountAmount || "0").toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Transaction Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Transaction Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transactionData.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {transactionData.payment && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Payment Created</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transactionData.payment.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {transactionData.payment?.paymentDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Payment Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transactionData.payment.paymentDate).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {(transactionData.status === "cancelled" || transactionData.status === "expired" || transactionData.status === "failed") && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Transaction {formatStatus(transactionData.status)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transactionData.updatedAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
