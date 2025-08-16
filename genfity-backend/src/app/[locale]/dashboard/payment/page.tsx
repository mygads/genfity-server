"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  CreditCard, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  Package,
  Zap,
  MoreHorizontal,
  AlertTriangle,
  X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/Auth/AuthContext"
import { useRouter } from "next/navigation"
import type { 
  CustomerPaymentsResponse, 
  PaymentListItem,
} from "@/types/checkout"

export default function PaymentDashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  // Payment data state
  const [payments, setPayments] = useState<PaymentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  })
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  
  // Cancelling payment state
  const [cancellingPaymentId, setCancellingPaymentId] = useState<string | null>(null)

  // Load payments
  const loadPayments = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payment/customer?page=${page}&limit=${pagination.limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPayments(data.data.payments)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error("Failed to load payments:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payments. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  // Cancel payment
  const handleCancelPayment = async (paymentId: string) => {
    try {
      setCancellingPaymentId(paymentId)
      
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
        
        // Reload payments
        loadPayments(pagination.page)
      } else {
        throw new Error(data.message || "Failed to cancel payment")
      }
    } catch (error) {
      console.error("Failed to cancel payment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel payment. Please try again."
      })
    } finally {
      setCancellingPaymentId(null)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  // Filter and sort payments
  const filteredPayments = payments
    .filter(payment => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          payment.id.toLowerCase().includes(searchLower) ||
          payment.transactionId.toLowerCase().includes(searchLower) ||
          payment.method.toLowerCase().includes(searchLower) ||
          payment.transaction.items.some(item => 
            item.name.toLowerCase().includes(searchLower)
          )
        )
      }
      return true
    })
    .filter(payment => {
      // Status filter
      if (statusFilter === "all") return true
      return payment.status === statusFilter
    })
    .sort((a, b) => {
      // Sort by date
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
    })

  // Status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return {
          icon: CheckCircle,
          label: "Paid",
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900/20",
          variant: "default" as const
        }
      case "pending":
        return {
          icon: Clock,
          label: "Pending",
          color: "text-yellow-600",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
          variant: "secondary" as const
        }
      case "failed":
        return {
          icon: XCircle,
          label: "Failed",
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-900/20",
          variant: "destructive" as const
        }
      case "expired":
        return {
          icon: AlertTriangle,
          label: "Expired",
          color: "text-orange-600",
          bgColor: "bg-orange-100 dark:bg-orange-900/20",
          variant: "secondary" as const
        }
      case "cancelled":
        return {
          icon: XCircle,
          label: "Cancelled",
          color: "text-gray-600",
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
          variant: "outline" as const
        }
      default:
        return {
          icon: Clock,
          label: status,
          color: "text-gray-600",
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
          variant: "outline" as const
        }
    }
  }

  // Statistics
  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.status === "paid").length,
    pending: payments.filter(p => p.status === "pending").length,
    failed: payments.filter(p => p.status === "failed").length,
    totalAmount: payments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const viewPaymentDetails = (paymentId: string) => {
    router.push(`/dashboard/payment/${paymentId}`)
  }

  const handlePageChange = (newPage: number) => {
    loadPayments(newPage)
  }

  if (loading && payments.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment History</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your payment transactions
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All payment transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">Successfully paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.totalAmount.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">Successfully paid amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>View and manage your payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search payments, transactions, or items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment List */}
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No payments found</h3>
                <p className="text-sm text-muted-foreground/70">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filters"
                    : "You haven't made any payments yet"}
                </p>
              </div>
            ) : (
              filteredPayments.map((payment) => {
                const statusConfig = getStatusConfig(payment.status)
                const StatusIcon = statusConfig.icon
                
                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      {/* Payment Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
                            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">Payment #{payment.id.slice(-8)}</h4>
                              <Badge variant={statusConfig.variant}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Transaction: {payment.transactionId.slice(-8)}
                            </p>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="ml-12">
                          <div className="flex flex-wrap gap-1">
                            {payment.transaction.items.slice(0, 3).map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item.name}
                              </Badge>
                            ))}
                            {payment.transaction.items.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{payment.transaction.items.length - 3} more
                              </Badge>
                            )}
                          </div>
                          
                          {/* Voucher */}
                          {payment.voucher && (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-xs">
                                Voucher: {payment.voucher.code}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Amount and Date */}
                        <div className="ml-12 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-medium">Rp {payment.amount.toLocaleString('id-ID')}</span>
                          <span>•</span>
                          <span>{payment.method.replace(/_/g, ' ').toUpperCase()}</span>
                          <span>•</span>
                          <span>
                            {new Date(payment.createdAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {payment.paymentDate && (
                            <>
                              <span>•</span>
                              <span className="text-green-600">
                                Paid: {new Date(payment.paymentDate).toLocaleDateString('id-ID', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewPaymentDetails(payment.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {payment.status === "pending" && (
                              <DropdownMenuItem onClick={() => viewPaymentDetails(payment.id)}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Continue Payment
                              </DropdownMenuItem>
                            )}
                            {payment.status === "paid" && (
                              <DropdownMenuItem onClick={() => viewPaymentDetails(payment.id)}>
                                <Receipt className="h-4 w-4 mr-2" />
                                View Invoice
                              </DropdownMenuItem>
                            )}
                            {payment.status === "pending" && (
                              <DropdownMenuItem 
                                onClick={() => handleCancelPayment(payment.id)}
                                disabled={cancellingPaymentId === payment.id}
                                className="text-red-600"
                              >
                                {cancellingPaymentId === payment.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 mr-2" />
                                )}
                                Cancel Payment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount} payments
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i
                    if (pageNum > pagination.totalPages) return null
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
