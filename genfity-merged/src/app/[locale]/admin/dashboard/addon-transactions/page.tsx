"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, 
  Search,
  RefreshCw,
  ShoppingCart,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  FileSpreadsheet,
  ArrowUpDown,
  User,
  Eye,
  X,
  XCircle,
  Check,
  MoreHorizontal,
  Edit,
  ExternalLink,
  FileText,
  DollarSign,
  Play,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SessionManager } from "@/lib/storage";
import { useRouter } from "next/navigation";

interface AddonTransaction {
  id: string;
  transactionId: string;
  userId: string;
  amount: number;
  status: string;
  currency: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  mainTransactionStatus: string;
  payment?: {
    id: string;
    status: string;
    method: string;
    amount: number;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  addonInfo: {
    id: string;
    addonDetails?: any;
    driveUrl?: string;
    fileAssets?: string;
    addons: Array<{
      id: string;
      name_en: string;
      name_id: string;
      description_en?: string;
      description_id?: string;
      price_idr: number;
      price_usd: number;
      category: any;
      quantity: number;
    }>;
  };
  deliveryNotes?: string;
}

interface AddonTransactionStats {
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export default function AddonTransactionsPage() {
  const [transactions, setTransactions] = useState<AddonTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [selectedTransaction, setSelectedTransaction] = useState<AddonTransaction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deliveryActionLoading, setDeliveryActionLoading] = useState<string | null>(null);
  
  const router = useRouter();

  // Handle delivery status actions
  const handleDeliveryAction = async (serviceId: string, status: string, formData?: any) => {
    setDeliveryActionLoading(serviceId);
    try {
      const session = SessionManager.getSession();
      if (!session?.token) {
        toast.error('Authentication required');
        router.push('/signin');
        return;
      }

      const body: any = { status };
      if (formData) {
        if (formData.driveUrl) body.driveUrl = formData.driveUrl;
        if (formData.fileAssets) body.fileAssets = formData.fileAssets;
        if (formData.notes) body.notes = formData.notes;
      }

      const response = await fetch(`/api/admin/products/addon-transactions/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied');
          router.push('/signin');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(`Delivery status updated to ${status}`);
        await fetchTransactions();
      } else {
        toast.error(data.error || 'Failed to update delivery status');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update delivery status');
    } finally {
      setDeliveryActionLoading(null);
    }
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const session = SessionManager.getSession();
      if (!session?.token) {
        toast.error('Authentication required');
        router.push('/signin');
        return;
      }

      const url = new URL('/api/admin/products/addon-transactions', window.location.origin);
      
      // Add filters to URL params
      if (statusFilter !== 'all') {
        url.searchParams.append('status', statusFilter);
      }
      if (searchQuery) {
        url.searchParams.append('search', searchQuery);
      }
      
      // Add pagination
      url.searchParams.append('page', currentPage.toString());
      url.searchParams.append('limit', '10');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied');
          router.push('/signin');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.data || []);
        setPagination(result.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1
        });
      } else {
        throw new Error(result.error || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching addon transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch addon transactions');
      toast.error('Failed to fetch addon transactions');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, router]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleViewDetail = (transaction: AddonTransaction) => {
    setSelectedTransaction(transaction);
    setDetailModalOpen(true);
  };

  const getStatusBadge = (status: string, isPayment: boolean = false) => {
    if (isPayment) {
      switch (status) {
        case 'pending':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
        case 'paid':
          return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paid</Badge>;
        case 'failed':
          return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>;
        case 'cancelled':
          return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Cancelled</Badge>;
        case 'expired':
          return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Expired</Badge>;
        default:
          return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Unknown</Badge>;
      }
    } else {
      // Addon Transaction Status
      switch (status) {
        case 'created':
          return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Created</Badge>;
        case 'pending':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
        case 'in_progress':
          return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">In Progress</Badge>;
        case 'success':
          return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Success</Badge>;
        case 'cancelled':
          return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Cancelled</Badge>;
        default:
          return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Unknown</Badge>;
      }
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending Delivery</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Awaiting Delivery</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Delivered</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Addon Transactions</h1>
          <p className="text-muted-foreground">
            View and manage all addon transactions and their status
          </p>
        </div>
        <Button onClick={fetchTransactions} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by customer name, email, or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Addon Transactions</CardTitle>
          <CardDescription>
            List of all addon transactions and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Addons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Addon Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Delivery Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {transaction.user.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {transaction.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {transaction.addonInfo.addons.length} addon(s)
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.addonInfo.addons.slice(0, 2).map(addon => addon.name_en).join(', ')}
                          {transaction.addonInfo.addons.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {transaction.addonInfo.addons.reduce((total: number, addon: any) => total + addon.quantity, 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.payment?.status || 'pending', true)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status, false)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Delivery status based on service delivery status */}
                        {transaction.status === 'delivered' ? 
                          getDeliveryStatusBadge('delivered') :
                          transaction.status === 'in_progress' ? 
                            getDeliveryStatusBadge('in_progress') :
                            getDeliveryStatusBadge('pending')
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Delivery Action Buttons - show based on service status */}
                          {transaction.payment?.status === 'paid' && transaction.status !== 'delivered' && (
                            <>
                            {transaction.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeliveryAction(transaction.id, 'in_progress')}
                                disabled={deliveryActionLoading === transaction.id}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                              >
                                {deliveryActionLoading === transaction.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <Play className="w-3 h-3 mr-1" />
                                )}
                                Start Progress
                              </Button>
                            )}
                            
                            {/* Mark as Delivered: Show when delivery is pending or in_progress */}
                            {['pending', 'in_progress'].includes(transaction.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeliveryAction(transaction.id, 'delivered')}
                                disabled={deliveryActionLoading === transaction.id}
                                className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                              >
                                {deliveryActionLoading === transaction.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                Mark as Delivered
                              </Button>
                            )}
                            </>
                          )}

                          {/* More Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetail(transaction)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {transaction.addonInfo.driveUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={transaction.addonInfo.driveUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View Delivery
                                  </a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Addon Transaction Details</DialogTitle>
            <DialogDescription>
              Detailed information about this addon transaction and its delivery status.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="grid gap-6 py-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase">Transaction ID</h4>
                  <p className="font-medium">{selectedTransaction.id}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase">Date</h4>
                  <p className="font-medium">{formatDate(selectedTransaction.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase">Amount</h4>
                  <p className="font-medium text-lg">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 uppercase">Status</h4>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status, false)}</div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="font-semibold mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedTransaction.user.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedTransaction.user.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Addons Purchased */}
              <div>
                <h4 className="font-semibold mb-3">Addons Purchased</h4>
                <div className="space-y-3">
                  {selectedTransaction.addonInfo.addons.map((addon: any) => (
                    <div key={addon.id} className="flex justify-between items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <div className="flex-1">
                        <h5 className="font-medium">{addon.name_en}</h5>
                        <p className="text-sm text-gray-500 mt-1">{addon.description_en}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Qty: {addon.quantity}</span>
                          <span>Unit Price: {formatCurrency(addon.price_idr, 'IDR')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(addon.price_idr * addon.quantity, 'IDR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="font-semibold mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">{selectedTransaction.payment?.method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <div className="mt-1">{getStatusBadge(selectedTransaction.payment?.status || 'pending', true)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {selectedTransaction.status === 'delivered' && (
                <div>
                  <h4 className="font-semibold mb-3">Delivery Information</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Delivery Status</p>
                        <p className="font-medium">{selectedTransaction.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Updated At</p>
                        <p className="font-medium">{formatDate(selectedTransaction.updatedAt)}</p>
                      </div>
                    </div>
                    {selectedTransaction.deliveryNotes && (
                      <div>
                        <p className="text-sm text-gray-500">Delivery Notes</p>
                        <p className="text-sm bg-white dark:bg-gray-700 p-3 rounded border">{selectedTransaction.deliveryNotes}</p>
                      </div>
                    )}
                    {selectedTransaction.addonInfo.driveUrl && (
                      <div>
                        <p className="text-sm text-gray-500">Files & Assets</p>
                        <a
                          href={selectedTransaction.addonInfo.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Delivery Files
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Notes Section */}
              {selectedTransaction.notes && (
                <div>
                  <h4 className="font-semibold mb-3">Customer Notes</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm whitespace-pre-wrap">{selectedTransaction.notes}</p>
                  </div>
                </div>
              )}

              {/* No action buttons needed in detail modal - actions are in main table */}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
