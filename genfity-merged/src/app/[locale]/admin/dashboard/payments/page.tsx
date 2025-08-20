"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  CreditCard,
  Users,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from 'sonner'
import { SessionManager } from '@/lib/storage'
import { PaymentStatusBadge, TransactionStatusBadge } from "@/components/payments/PaymentStatusBadge"
import { ExpirationTimer as ExpirationTimerComponent, ExpirationInfo } from "@/components/payments/ExpirationTimer"

interface Payment {
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
    amount: number
    finalAmount: number
    expiresAt: string | null
    user: {
      id: string
      name: string | null
      email: string
    } | null
    items: Array<{
      type: string
      name: string
      category: string
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
  canApprove: boolean
  needsManualApproval: boolean
}

interface PaymentStats {
  total: number
  pending: number
  paid: number
  failed: number
  totalAmount: number
  pendingAmount: number
  paidAmount: number
}

interface PaymentFilters {
  status: string
  method: string
  currency: string
  search: string
  dateFrom: string
  dateTo: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<PaymentFilters>({
    status: 'all',
    method: '',
    currency: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
  })
  // Fetch payments data
  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      // Get token for authentication
      const token = SessionManager.getToken()
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.method && { method: filters.method }),
        ...(filters.currency !== 'all' && { currency: filters.currency }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      })

      const response = await fetch(`/api/admin/payments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payments')
      }

      if (data.success) {
        setPayments(data.data.payments)
        setStats(data.data.statistics)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        throw new Error(data.error || 'Failed to fetch payments')
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters])

  // Handle payment approval/rejection
  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    setActionLoading(paymentId)
    try {
      // Get token for authentication
      const token = SessionManager.getToken()
      
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          adminNotes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} payment`)
      }

      if (data.success) {
        toast.success(`Payment ${action}d successfully`)
        // Refresh payments list
        await fetchPayments()
        setShowApprovalDialog(false)
        setAdminNotes('')
        setSelectedPayment(null)
        setApprovalAction(null)
      } else {
        throw new Error(data.error || `Failed to ${action} payment`)
      }
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${action} payment`)
    } finally {
      setActionLoading(null)
    }
  }  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    return <PaymentStatusBadge status={status} />
  }
  // Expiration timer component
  const ExpirationTimer = ({ payment }: { payment: Payment }) => {
    if (!payment.expirationInfo || payment.status !== 'pending') return null
    
    const { isPaymentExpired, isTransactionExpired } = payment.expirationInfo
    
    if (isPaymentExpired || isTransactionExpired) {
      return (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3" />
          <span>Expired</span>
        </div>
      )
    }
    
    return (
      <div className="flex flex-col gap-1 text-xs">
        {payment.expiresAt && (
          <ExpirationTimerComponent 
            expiresAt={payment.expiresAt} 
            status={payment.status}
            type="payment"
            variant="compact"
          />
        )}        {payment.transaction?.expiresAt && (
          <ExpirationTimerComponent 
            expiresAt={payment.transaction?.expiresAt} 
            status={payment.transaction?.status}
            type="transaction"
            variant="compact"
          />
        )}
      </div>
    )
  }// Method badge component
  const MethodBadge = ({ method }: { method: string }) => {
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
      // Legacy method names for backward compatibility
      'virtual_account': 'Virtual Account',
      'credit_card': 'Card Payment',
      'debit_card': 'Card Payment',
      'bank_transfer': 'Manual Bank Transfer',
      'e_wallet': 'Virtual Account',
      'gopay': 'Virtual Account',
      'ovo': 'Virtual Account',
      'dana': 'Virtual Account',
      'shopeepay': 'Virtual Account',
    }
    
    const displayName = methodLabels[method] || method.replace('_', ' ').toUpperCase()
    const needsApproval = method.includes('manual') || method.includes('bank_transfer')
    
    return (
      <Badge variant={needsApproval ? "destructive" : "secondary"}>
        <span className="flex items-center gap-1">
          <CreditCard className="h-3 w-3" />
          {displayName}
          {needsApproval && <AlertTriangle className="h-3 w-3" />}
        </span>
      </Badge>
    )
  }

  // Currency formatter
  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'idr' ? 'Rp' : '$'
    return `${symbol} ${amount.toLocaleString()}`
  }
  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Auto refresh every 30 seconds for pending payments
  useEffect(() => {
    const interval = setInterval(() => {
      if (filters.status === 'pending' || filters.status === 'all') {
        fetchPayments()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [filters.status, fetchPayments])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalAmount, 'idr')} total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.pendingAmount, 'idr')} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.paidAmount, 'idr')} received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Email, payment ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Select value={filters.currency} onValueChange={(value) => setFilters({ ...filters, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="idr">IDR</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <Input
                placeholder="e.g. bank_transfer"
                value={filters.method}
                onChange={(e) => setFilters({ ...filters, method: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            {payments.length} payments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading payments...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.id.slice(-8)}
                      </TableCell>                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.transaction?.user?.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{payment.transaction?.user?.email || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatCurrency(payment.amount, payment.transaction?.currency || 'idr')}
                          </div>
                          {payment.serviceFee > 0 && (
                            <div className="text-sm text-muted-foreground">
                              +{formatCurrency(payment.serviceFee, payment.transaction?.currency || 'idr')} fee
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <MethodBadge method={payment.method} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell>
                        <ExpirationTimer payment={payment} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(payment.createdAt), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/payments/${payment.id}`)}
                            title="View detailed payment information"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                            title="Quick payment overview"
                          >
                            Quick View
                          </Button>
                            {payment.needsManualApproval && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment)
                                  setApprovalAction('approve')
                                  setShowApprovalDialog(true)
                                }}
                                disabled={loading || actionLoading === payment.id || payment.expirationInfo?.isPaymentExpired || payment.expirationInfo?.isTransactionExpired}
                                className="text-green-600 border-green-200 hover:bg-green-50 disabled:opacity-50"
                                title={payment.expirationInfo?.isPaymentExpired || payment.expirationInfo?.isTransactionExpired ? "Payment or transaction expired" : "Approve payment"}
                              >
                                {actionLoading === payment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment)
                                  setApprovalAction('reject')
                                  setShowApprovalDialog(true)
                                }}
                                disabled={loading || actionLoading === payment.id}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                {actionLoading === payment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? 'Confirm that the payment has been received and approve this transaction.'
                : 'Reject this payment and mark the transaction as failed.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">                
                <div>
                  <div className="font-medium">Amount</div>
                  <div>{formatCurrency(selectedPayment.amount, selectedPayment.transaction?.currency || 'idr')}</div>
                </div>
                <div>
                  <div className="font-medium">Method</div>
                  <div>{(() => {
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
                      // Legacy method names for backward compatibility
                      'virtual_account': 'Virtual Account',
                      'credit_card': 'Card Payment',
                      'debit_card': 'Card Payment',
                      'bank_transfer': 'Manual Bank Transfer',
                      'e_wallet': 'Virtual Account',
                      'gopay': 'Virtual Account',
                      'ovo': 'Virtual Account',
                      'dana': 'Virtual Account',
                      'shopeepay': 'Virtual Account',
                    }
                    return methodLabels[selectedPayment.method] || selectedPayment.method.replace('_', ' ')
                  })()} </div>                
                  </div>
                <div>
                  <div className="font-medium">Email</div>
                  <div>{selectedPayment.transaction?.user?.email || 'N/A'}</div>
                </div>                <div>
                  <div className="font-medium">Transaction</div>
                  <div className="font-mono">{selectedPayment.transaction?.id?.slice(-8) || 'N/A'}</div>
                </div>
              </div>

              {/* Expiration Warning */}
              {selectedPayment?.expirationInfo && (selectedPayment.expirationInfo.isPaymentExpired || selectedPayment.expirationInfo.isTransactionExpired) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Payment Expired</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    This payment cannot be approved because it has expired. 
                    {selectedPayment.expirationInfo.isPaymentExpired && " Payment expired."}
                    {selectedPayment.expirationInfo.isTransactionExpired && " Transaction expired."}
                  </p>
                </div>
              )}

              {/* Expiration Warning for Soon-to-Expire */}
              {selectedPayment?.expirationInfo && !selectedPayment.expirationInfo.isPaymentExpired && !selectedPayment.expirationInfo.isTransactionExpired && (
                selectedPayment.expirationInfo.paymentTimeRemaining && parseInt(selectedPayment.expirationInfo.paymentTimeRemaining.split(' ')[0]) < 2
              ) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Payment Expiring Soon</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    This payment will expire in {selectedPayment.expirationInfo.paymentTimeRemaining}. Consider approving quickly if the payment is valid.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes (Optional)</label>
                <Textarea
                  placeholder="Add notes about this action..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalDialog(false)
                    setAdminNotes('')
                    setApprovalAction(null)
                  }}
                >
                  Cancel
                </Button>                
                <Button
                  variant={approvalAction === 'approve' ? 'default' : 'destructive'}
                  onClick={() => selectedPayment && approvalAction && handlePaymentAction(selectedPayment.id, approvalAction)}
                  disabled={
                    actionLoading === selectedPayment?.id || 
                    (approvalAction === 'approve' && (selectedPayment?.expirationInfo?.isPaymentExpired || selectedPayment?.expirationInfo?.isTransactionExpired))
                  }
                >
                  {actionLoading === selectedPayment?.id && (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {approvalAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment && !showApprovalDialog} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
            {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment ID</div>
                    <div className="font-mono text-sm">{selectedPayment.id}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
                    <MethodBadge method={selectedPayment.method} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <StatusBadge status={selectedPayment.status} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Customer</div>
                    <div className="text-sm">
                      <div className="font-medium">{selectedPayment.transaction?.user?.name || 'N/A'}</div>
                      <div className="text-muted-foreground">{selectedPayment.transaction?.user?.email || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Created</div>
                    <div className="text-sm">{format(new Date(selectedPayment.createdAt), 'PPP p')}</div>
                  </div>
                  {selectedPayment.paymentDate && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Paid</div>
                      <div className="text-sm">{format(new Date(selectedPayment.paymentDate), 'PPP p')}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span>Total Payment:</span>
                      <span className="text-green-600">
                        {formatCurrency(selectedPayment.amount, selectedPayment.transaction?.currency || 'idr')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation to Detail Page */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/payments/${selectedPayment.id}`)}
                >
                  View Full Payment Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPayment(null)}
                >
                  Close                
                  </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? 'Confirm that the payment has been received and approve this transaction.'
                : 'Reject this payment and mark the transaction as failed.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Amount</div>
                  <div>{formatCurrency(selectedPayment.amount, selectedPayment.transaction?.currency || 'idr')}</div>
                </div>
                <div>
                  <div className="font-medium">Method</div>
                  <div>{(() => {
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
                      'virtual_account': 'Virtual Account',
                      'credit_card': 'Card Payment',
                      'debit_card': 'Card Payment',
                      'bank_transfer': 'Manual Bank Transfer',
                      'e_wallet': 'Virtual Account',
                      'gopay': 'Virtual Account',
                      'ovo': 'Virtual Account',
                      'dana': 'Virtual Account',
                      'shopeepay': 'Virtual Account',
                    }
                    return methodLabels[selectedPayment.method] || selectedPayment.method.replace('_', ' ')
                  })()}</div>
                </div>
                <div>
                  <div className="font-medium">Customer</div>
                  <div>{selectedPayment.transaction?.user?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-medium">Transaction ID</div>
                  <div className="font-mono text-xs">{selectedPayment.transaction?.id}</div>
                </div>
              </div>
              
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium mb-2">
                  Admin Notes {approvalAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    approvalAction === 'approve' 
                      ? 'Optional notes about payment verification...'
                      : 'Reason for rejection (required)...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => selectedPayment && handlePaymentAction(selectedPayment.id, approvalAction!)}
                  disabled={actionLoading === selectedPayment.id || (approvalAction === 'reject' && !adminNotes.trim())}
                  className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {actionLoading === selectedPayment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {approvalAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowApprovalDialog(false)
                    setAdminNotes('')
                    setApprovalAction(null)
                  }}
                  disabled={actionLoading === selectedPayment.id}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
