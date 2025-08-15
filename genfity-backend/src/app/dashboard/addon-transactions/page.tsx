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
  Play
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

interface AddonTransaction {
  id: string;
  originalAmount: number;
  finalAmount: number;
  currency: string;
  status: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  notes?: string; // Transaction notes from checkout
  user: {
    id: string;
    name?: string;
    email?: string;
  };
  transactionAddons: Array<{
    id: string;
    addonId: string;
    quantity: number;
    status: string; // status independen untuk addon transaction
    unitPrice: number;
    totalPrice: number;
    addon: {
      id: string;
      name: string;
      description?: string;
      price: number;
      currency: string;
    };
  }>;
  addonCustomers: Array<{
    id: string;
    status: string; // delivery status: pending, in_progress, delivered
    deliveredAt?: string;
    notes?: string;
    driveUrl?: string;
  }>;
  payment?: {
    id: string;
    status: string;
    method: string;
    paymentDate?: string;
  };
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
  const [stats, setStats] = useState<AddonTransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "user">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<AddonTransaction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [completeFormData, setCompleteFormData] = useState({
    driveUrl: '',
    notes: '',
    textDescription: ''
  });
  const [deliveryActionLoading, setDeliveryActionLoading] = useState<string | null>(null);

  // Handle delivery status actions
  const handleDeliveryAction = async (addonCustomerId: string, status: string) => {
    setDeliveryActionLoading(addonCustomerId);
    try {
      const response = await fetch(`/api/addon-customers/${addonCustomerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

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
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchQuery,
        status: statusFilter,
        dateFilter: dateFilter,
        sortBy: sortBy,
        sortOrder: sortOrder,
        type: "addon" // Filter for addon transactions only
      });

      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch addon transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setStats(data.stats);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (error) {
      console.error('Error fetching addon transactions:', error);
      toast.error('Failed to load addon transactions');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, dateFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Client-side filtering and sorting
  const filteredTransactions = transactions
    .filter(trx => {
      const matchesSearch = trx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           trx.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           trx.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || trx.status === statusFilter;
      
      // Date filtering
      let matchesDate = true;
      if (dateFilter !== "all") {
        const trxDate = new Date(trx.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            matchesDate = trxDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = trxDate >= weekAgo;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = trxDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "amount":
          comparison = a.finalAmount - b.finalAmount;
          break;
        case "user":
          comparison = (a.user?.name || '').localeCompare(b.user?.name || '');
          break;
      }
      
      return sortOrder === "desc" ? -comparison : comparison;
    });

  const handleViewDetail = (transaction: AddonTransaction) => {
    setSelectedTransaction(transaction);
    setDetailModalOpen(true);
  };

  const handleTransactionAction = async (transactionId: string, action: 'start' | 'complete') => {
    try {
      setActionLoading(true);
      
      if (action === 'complete') {
        // Open the complete modal instead of directly completing
        setIsCompleteModalOpen(true);
        return;
      }

      const response = await fetch(`/api/transactions/addon/${transactionId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Transaction ${action === 'start' ? 'started' : 'completed'} successfully`);
        await fetchTransactions();
      } else {
        toast.error(data.error || 'Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      setActionLoading(true);

      const response = await fetch(`/api/transactions/addon/${selectedTransaction.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'complete',
          packageData: completeFormData
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Transaction completed successfully');
        setIsCompleteModalOpen(false);
        setCompleteFormData({ driveUrl: '', notes: '', textDescription: '' });
        await fetchTransactions();
      } else {
        toast.error(data.error || 'Failed to complete transaction');
      }
    } catch (error) {
      console.error('Error completing transaction:', error);
      toast.error('Failed to complete transaction');
    } finally {
      setActionLoading(false);
    }
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
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedTransactions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

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
                <SelectValue placeholder="Transaction Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field as "date" | "amount" | "user");
              setSortOrder(order as "asc" | "desc");
            }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                <SelectItem value="user-asc">Customer A-Z</SelectItem>
                <SelectItem value="user-desc">Customer Z-A</SelectItem>
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
                  {filteredTransactions.map((transaction) => (
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
                          {transaction.transactionAddons.length} addon(s)
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.transactionAddons.slice(0, 2).map(ta => ta.addon.name).join(', ')}
                          {transaction.transactionAddons.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {transaction.transactionAddons.reduce((total, ta) => total + ta.quantity, 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(
                          transaction.transactionAddons.reduce((total, ta) => total + ta.totalPrice, 0), 
                          transaction.currency
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.payment?.status || 'pending', true)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.transactionAddons.length > 0 ? 
                          getStatusBadge(transaction.transactionAddons[0].status || 'created', false) :
                          getStatusBadge('unknown', false)
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Check if delivery record exists (transaction is in_progress) */}
                        {transaction.status === 'in_progress' || transaction.status === 'success' ? (
                          transaction.addonCustomers.length > 0 ? 
                            getDeliveryStatusBadge(transaction.addonCustomers[0].status || 'pending') :
                            <span className="text-gray-400">-</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.transactionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Delivery Action Buttons - only show if delivery record exists */}
                          {transaction.status === 'in_progress' || transaction.status === 'success' ? (
                            <>
                            {transaction.addonCustomers.length > 0 && transaction.addonCustomers[0].status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeliveryAction(transaction.addonCustomers[0].id, 'in_progress')}
                                disabled={deliveryActionLoading === transaction.addonCustomers[0].id}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                              >
                                {deliveryActionLoading === transaction.addonCustomers[0].id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <Play className="w-3 h-3 mr-1" />
                                )}
                                Start Progress
                              </Button>
                            )}
                            
                            {/* Mark as Delivered: Show when delivery is pending or in_progress */}
                            {transaction.addonCustomers.length > 0 && ['pending', 'in_progress'].includes(transaction.addonCustomers[0].status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeliveryAction(transaction.addonCustomers[0].id, 'delivered')}
                                disabled={deliveryActionLoading === transaction.addonCustomers[0].id}
                                className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                              >
                                {deliveryActionLoading === transaction.addonCustomers[0].id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                Mark as Delivered
                              </Button>
                            )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Awaiting payment confirmation</span>
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
                              {transaction.addonCustomers?.[0]?.driveUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={transaction.addonCustomers[0].driveUrl} target="_blank" rel="noopener noreferrer">
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
      {totalPages > 1 && (
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
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
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
                  <p className="font-medium text-lg">{formatCurrency(selectedTransaction.finalAmount, selectedTransaction.currency)}</p>
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
                  {selectedTransaction.transactionAddons.map((ta) => (
                    <div key={ta.id} className="flex justify-between items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <div className="flex-1">
                        <h5 className="font-medium">{ta.addon.name}</h5>
                        <p className="text-sm text-gray-500 mt-1">{ta.addon.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Qty: {ta.quantity}</span>
                          <span>Unit Price: {formatCurrency(ta.unitPrice, ta.addon.currency)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(ta.totalPrice, ta.addon.currency)}</p>
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
                    <p className="text-sm text-gray-500">Original Amount</p>
                    <p className="font-medium">{formatCurrency(selectedTransaction.originalAmount, selectedTransaction.currency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Final Amount</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedTransaction.finalAmount, selectedTransaction.currency)}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {selectedTransaction.addonCustomers?.[0] && (
                <div>
                  <h4 className="font-semibold mb-3">Delivery Information</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Delivery Status</p>
                        <p className="font-medium">{selectedTransaction.addonCustomers[0].status}</p>
                      </div>
                      {selectedTransaction.addonCustomers[0].deliveredAt && (
                        <div>
                          <p className="text-sm text-gray-500">Delivered At</p>
                          <p className="font-medium">{formatDate(selectedTransaction.addonCustomers[0].deliveredAt)}</p>
                        </div>
                      )}
                    </div>
                    {selectedTransaction.addonCustomers[0].notes && (
                      <div>
                        <p className="text-sm text-gray-500">Delivery Notes</p>
                        <p className="text-sm bg-white dark:bg-gray-700 p-3 rounded border">{selectedTransaction.addonCustomers[0].notes}</p>
                      </div>
                    )}
                    {selectedTransaction.addonCustomers[0].driveUrl && (
                      <div>
                        <p className="text-sm text-gray-500">Files & Assets</p>
                        <a
                          href={selectedTransaction.addonCustomers[0].driveUrl}
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

              {/* Action Buttons */}
              {selectedTransaction.payment?.status === 'paid' && (
                <div className="flex gap-2 pt-4 border-t">
                  {selectedTransaction.status === 'pending' && (
                    <Button
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleTransactionAction(selectedTransaction.id, 'start');
                      }}
                      disabled={actionLoading}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Progress
                    </Button>
                  )}
                  
                  {selectedTransaction.status === 'in_progress' && (
                    <Button
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleTransactionAction(selectedTransaction.id, 'complete');
                      }}
                      disabled={actionLoading}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Transaction Modal */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-2 border-green-200 dark:border-green-700 shadow-lg">
          <DialogHeader className="border-b border-green-200 dark:border-green-700 pb-4">
            <DialogTitle className="text-xl font-semibold text-green-800 dark:text-green-300">Complete Addon Transaction</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Fill in the addon delivery information to complete this transaction
            </p>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="driveUrl">Drive URL (Files/Assets)</Label>
                <Input
                  id="driveUrl"
                  placeholder="https://drive.google.com/..."
                  value={completeFormData.driveUrl}
                  onChange={(e) => setCompleteFormData({...completeFormData, driveUrl: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="textDescription">Delivery Description</Label>
                <Textarea
                  id="textDescription"
                  placeholder="Describe what was delivered, instructions, or other details..."
                  rows={4}
                  value={completeFormData.textDescription}
                  onChange={(e) => setCompleteFormData({...completeFormData, textDescription: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Internal notes for team (not visible to customer)..."
                  rows={3}
                  value={completeFormData.notes}
                  onChange={(e) => setCompleteFormData({...completeFormData, notes: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-green-200 dark:border-green-700">
              <Button
                onClick={handleCompleteTransaction}
                disabled={actionLoading}
                className="flex items-center gap-2"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Complete Transaction
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCompleteModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
