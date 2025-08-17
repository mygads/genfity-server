"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  X,
  Package,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  Loader2,
  Plus,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import type { TransactionItem, TransactionListResponse } from "@/types/checkout"

interface TransactionStats {
  total: number
  created: number
  pending: number
  inProgress: number
  success: number
  cancelled: number
  expired: number
  failed: number
  totalAmount: number
}

export default function TransactionDashboardPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount">("newest")
  const [cancellingTransactionId, setCancellingTransactionId] = useState<string | null>(null)
  
  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  })

  // Load transactions
  const loadTransactions = useCallback(async (offset: number = 0) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/transaction?page=${Math.floor(offset / pagination.limit) + 1}&limit=${pagination.limit}`)
      const result: TransactionListResponse = await response.json()
      
      if (result.success) {
        setTransactions(result.data)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error("Failed to load transactions:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transactions. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, toast])

  // Cancel transaction
  const handleCancelTransaction = async (transactionId: string) => {
    try {
      setCancellingTransactionId(transactionId)
      const response = await fetch(`/api/transaction/${transactionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: "Cancelled by user" })
      })
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Transaction cancelled successfully"
        })
        
        // Reload transactions
        loadTransactions(pagination.offset)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error?.message || "Failed to cancel transaction. Please try again."
        })
      }
    } catch (error) {
      console.error("Failed to cancel transaction:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel transaction. Please try again."
      })
    } finally {
      setCancellingTransactionId(null)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          transaction.id.toLowerCase().includes(searchLower) ||
          transaction.notes?.toLowerCase().includes(searchLower) ||
          transaction.productTransaction?.package?.name_en.toLowerCase().includes(searchLower) ||
          transaction.productTransaction?.package?.name_id.toLowerCase().includes(searchLower) ||
          transaction.productTransaction?.addon?.name_en.toLowerCase().includes(searchLower) ||
          transaction.productTransaction?.addon?.name_id.toLowerCase().includes(searchLower) ||
          transaction.whatsappTransaction?.whatsappPackage?.name.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
    .filter(transaction => {
      // Status filter
      if (statusFilter === "all") return true
      return transaction.status === statusFilter
    })
    .sort((a, b) => {
      // Sort by date or amount
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === "amount") {
        return parseInt(b.amount) - parseInt(a.amount)
      }
      return 0
    })

  // Calculate stats
  const stats: TransactionStats = {
    total: transactions.length,
    created: transactions.filter(t => t.status === "created").length,
    pending: transactions.filter(t => t.status === "pending").length,
    inProgress: transactions.filter(t => t.status === "in-progress").length,
    success: transactions.filter(t => t.status === "success").length,
    cancelled: transactions.filter(t => t.status === "cancelled").length,
    expired: transactions.filter(t => t.status === "expired").length,
    failed: transactions.filter(t => t.status === "failed").length,
    totalAmount: transactions
      .filter(t => t.status === "success")
      .reduce((sum, t) => sum + parseInt(t.amount), 0)
  }

  const viewTransactionDetails = (transactionId: string) => {
    router.push(`/dashboard/transaction/${transactionId}`)
  }

  const handlePageChange = (newOffset: number) => {
    loadTransactions(newOffset)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "created":
        return {
          icon: Plus,
          label: "Created",
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          badgeVariant: "outline" as const
        }
      case "pending":
        return {
          icon: Clock,
          label: "Pending Payment",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          badgeVariant: "secondary" as const
        }
      case "in-progress":
        return {
          icon: Loader2,
          label: "In Progress",
          color: "text-orange-600",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          badgeVariant: "outline" as const
        }
      case "success":
        return {
          icon: CheckCircle,
          label: "Completed",
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          badgeVariant: "default" as const
        }
      case "cancelled":
        return {
          icon: Ban,
          label: "Cancelled",
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          badgeVariant: "outline" as const
        }
      case "expired":
        return {
          icon: XCircle,
          label: "Expired",
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          badgeVariant: "destructive" as const
        }
      case "failed":
        return {
          icon: AlertCircle,
          label: "Failed",
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          badgeVariant: "destructive" as const
        }
      default:
        return {
          icon: AlertCircle,
          label: status,
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          badgeVariant: "outline" as const
        }
    }
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium">Loading Transactions</h3>
            <p className="text-muted-foreground">Please wait while we fetch your transactions...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
          <p className="text-muted-foreground">
            View and manage all your transactions
          </p>
        </div>
        <Button onClick={() => loadTransactions(pagination.offset)} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Success: {stats.success}</span>
                <span>Pending: {stats.pending}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.success} of {stats.total} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              Rp {stats.totalAmount.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              From successful transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Actions</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.created + stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="created">Created</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="success">Success</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
                <option value="failed">Failed</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount">Highest Amount</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5" />
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground">No transactions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "You haven't made any transactions yet"
                }
              </p>
              {(!searchTerm && statusFilter === "all") && (
                <Link href="/products">
                  <Button>Browse Products</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const statusConfig = getStatusConfig(transaction.status)
                const StatusIcon = statusConfig.icon
                
                const getTransactionItems = () => {
                  const items = []
                  if (transaction.productTransaction?.package) {
                    items.push(transaction.productTransaction.package.name_en || transaction.productTransaction.package.name_id)
                  }
                  if (transaction.productTransaction?.addon) {
                    items.push(transaction.productTransaction.addon.name_en || transaction.productTransaction.addon.name_id)
                  }
                  if (transaction.whatsappTransaction?.whatsappPackage) {
                    items.push(`${transaction.whatsappTransaction.whatsappPackage.name} (${transaction.whatsappTransaction.duration})`)
                  }
                  return items
                }

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border/50 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-card hover:border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Transaction Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
                            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">Transaction #{transaction.id.slice(-8)}</h3>
                              <Badge variant={statusConfig.badgeVariant}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <span>•</span>
                              <span>{transaction.type.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Transaction Items */}
                        <div className="ml-12 mb-2">
                          <div className="flex flex-wrap gap-1">
                            {getTransactionItems().map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                          
                          {/* Notes */}
                          {transaction.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {transaction.notes}
                            </p>
                          )}
                        </div>

                        {/* Amount and Details */}
                        <div className="ml-12 flex items-center gap-4 text-sm">
                          <span className="font-medium">
                            Rp {parseInt(transaction.amount).toLocaleString('id-ID')}
                          </span>
                          {transaction.discountAmount && parseInt(transaction.discountAmount) > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-600">
                                Discount: Rp {parseInt(transaction.discountAmount).toLocaleString('id-ID')}
                              </span>
                            </>
                          )}
                          {transaction.payment && (
                            <>
                              <span>•</span>
                              <span className="text-muted-foreground">
                                Payment: {transaction.payment.method.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* View Details */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewTransactionDetails(transaction.id)}
                          className="gap-2"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>

                        {/* Cancel Transaction */}
                        {(transaction.status === "created" || transaction.status === "pending") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelTransaction(transaction.id)}
                            disabled={cancellingTransactionId === transaction.id}
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            {cancellingTransactionId === transaction.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} transactions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                  className="border-border/50"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={!pagination.hasMore}
                  className="border-border/50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
