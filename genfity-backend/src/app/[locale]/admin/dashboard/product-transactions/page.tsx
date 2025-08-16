"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  PackageCheck, 
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowUpDown,
  User,
  Package,
  Eye,
  Play
} from "lucide-react";
import { toast } from "sonner";

interface ProductTransaction {
  id: string; // TransactionProduct ID
  transactionId: string; // Original Transaction ID
  userId: string;
  amount: number;
  status: string; // Child transaction status (created, pending, in_progress, success)
  currency: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  notes?: string; // Transaction notes from checkout
  mainTransactionStatus?: string; // Main transaction status for reference
  payment?: {
    id: string;
    status: string;
    method: string;
    amount: number;
  };
  user?: { 
    id: string;
    name: string; 
    email: string;
    phone?: string;
  };  
  productInfo?: {
    id: string;
    packageId?: string;
    quantity: number;
    startDate?: string;
    endDate?: string;
    referenceLink?: string;
    package?: {
      id: string;
      name_en: string;
      name_id: string;
      description_en?: string;
      description_id?: string;
      price_idr: number;
      price_usd: number;
      category?: {
        id: string;
        name_en: string;
        name_id: string;
        icon: string;
      };
      subcategory?: {
        id: string;
        name_en: string;
        name_id: string;
      };
      features?: Array<{
        id: string;
        name_en: string;
        name_id: string;
        included: boolean;
      }>;
    };
    unitPrice?: {
      idr: number;
      usd: number;
    };
    totalPrice?: {
      idr: number;
      usd: number;
    };
  };
  // Delivery information
  deliveryStatus?: string; // pending, in_progress, delivered
}

interface TransactionDetail {
  transaction: ProductTransaction;
  canStartProgress: boolean;
  canComplete: boolean;
}

export default function ProductTransactionsPage() {
  const [transactions, setTransactions] = useState<ProductTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "user">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeFormData, setCompleteFormData] = useState({
    websiteUrl: '',
    driveUrl: '',
    textDescription: '',
    domainName: '',
    domainExpiredAt: '',
    notes: ''
  });
  const [deliveryActionLoading, setDeliveryActionLoading] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    inProgress: 0,
    completed: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/product");
      const data = await res.json();
      
      if (data.success) {
        setTransactions(data.data || []);
        calculateStats(data.data || []);
      } else {
        console.error("Error fetching transactions:", data.error);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  function calculateStats(transactions: ProductTransaction[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats = {
      total: transactions.length,
      pending: transactions.filter(t => t.payment?.status === 'pending').length,
      paid: transactions.filter(t => t.payment?.status === 'paid').length,
      inProgress: transactions.filter(t => t.status === 'in_progress').length,
      completed: transactions.filter(t => t.status === 'success').length,
      totalRevenue: transactions
        .filter(t => t.payment?.status === 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      monthlyRevenue: transactions
        .filter(t => {
          const trxDate = new Date(t.createdAt);
          return t.payment?.status === 'paid' && 
                 trxDate.getMonth() === currentMonth && 
                 trxDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + Number(t.amount), 0)
    };

    setStats(stats);
  }
  const handleTransactionAction = async (transactionId: string, action: 'start' | 'complete') => {
    setActionLoading(true);
    try {
      if (action === 'complete') {
        // Open the complete modal instead of directly completing
        setIsCompleteModalOpen(true);
        return;
      }

      const res = await fetch(`/api/transactions/product/${transactionId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      
      if (data.success) {
        await fetchTransactions();
        setIsDetailOpen(false);
        setSelectedTransaction(null);
      } else {
        console.error("Error updating transaction:", data.error);
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTransaction = async () => {
    if (!selectedTransaction) return;
    
    setActionLoading(true);
    try {
      // Update delivery record with form data and set status to delivered
      const res = await fetch(`/api/transactions/product/${selectedTransaction.transaction.id}/delivery-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'delivered',
          websiteUrl: completeFormData.websiteUrl,
          driveUrl: completeFormData.driveUrl,
          textDescription: completeFormData.textDescription,
          domainName: completeFormData.domainName,
          domainExpiredAt: completeFormData.domainExpiredAt,
          notes: completeFormData.notes
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Product delivery completed successfully');
        await fetchTransactions();
        setIsDetailOpen(false);
        setIsCompleteModalOpen(false);
        setSelectedTransaction(null);
        setCompleteFormData({
          websiteUrl: '',
          driveUrl: '',
          textDescription: '',
          domainName: '',
          domainExpiredAt: '',
          notes: ''
        });
      } else {
        toast.error(data.error || 'Failed to complete transaction');
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
      toast.error('Failed to complete transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const viewTransactionDetail = async (transaction: ProductTransaction) => {
    try {
      const res = await fetch(`/api/transactions/product/${transaction.id}/detail`);
      const data = await res.json();
      
      if (data.success) {
        console.log('[FRONTEND] Transaction detail received:', {
          id: data.data.transaction.id,
          hasPackage: !!data.data.transaction.productInfo?.package,
          hasFeatures: !!data.data.transaction.productInfo?.package?.features,
          featuresLength: data.data.transaction.productInfo?.package?.features?.length || 0,
          features: data.data.transaction.productInfo?.package?.features,
          categoryIcon: data.data.transaction.productInfo?.package?.category?.icon
        });
        setSelectedTransaction(data.data);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error("Error fetching transaction detail:", error);
    }
  };

  // Handle delivery status actions
  const handleDeliveryAction = async (transactionId: string, status: string) => {
    setDeliveryActionLoading(transactionId);
    try {
      const response = await fetch(`/api/transactions/product/${transactionId}/delivery-status`, {
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

  // Filter and sort functions
  const handleSort = (field: "date" | "amount" | "user") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", label: "Pending" },
      paid: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Paid" },
      failed: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", label: "Failed" },
      cancelled: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300", label: "Cancelled" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTransactionStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", label: "Pending" },
      delivered: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Delivered" },
      // Keep legacy status mappings for backward compatibility
      created: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300", label: "Created" },
      in_progress: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "In Progress" },
      success: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Success" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getDeliveryStatusBadge = (status: string | null | undefined) => {
    if (!status) return <span className="text-gray-400">-</span>;
    
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", label: "Pending" },
      in_progress: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "In Progress" },
      delivered: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Delivered" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'usd') {
      return `$${amount.toLocaleString()}`;
    }
    return `Rp ${amount.toLocaleString()}`;
  };

  // Initial load
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);  const filteredTransactions = transactions
    .filter(trx => {
      const matchesSearch = trx.id.toLowerCase().includes(search.toLowerCase()) ||
                           trx.transactionId.toLowerCase().includes(search.toLowerCase()) ||
                           trx.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                           trx.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
                           trx.productInfo?.package?.name_en?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || trx.payment?.status === statusFilter;
      const matchesTransactionStatus = transactionStatusFilter === "all" || trx.status === transactionStatusFilter;
      
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
      
      return matchesSearch && matchesStatus && matchesTransactionStatus && matchesDate;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "amount":
          aValue = Number(a.amount);
          bValue = Number(b.amount);
          break;
        case "user":
          aValue = a.user?.name || a.user?.email || "";
          bValue = b.user?.name || b.user?.email || "";
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Transactions</h1>
          <p className="text-muted-foreground">
            Manage and track product transaction status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <PackageCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue, 'idr')}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={transactionStatusFilter} onValueChange={setTransactionStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Transaction Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                {/* Keep legacy statuses for backward compatibility */}
                <SelectItem value="created">Created (Legacy)</SelectItem>
                <SelectItem value="in_progress">In Progress (Legacy)</SelectItem>
                <SelectItem value="success">Completed (Legacy)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Found {filteredTransactions.length} transaction(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("user")}
                  >
                    <div className="flex items-center gap-1">
                      Customer
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center gap-1">
                      Total Amount
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Delivery Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Loading transactions...
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(transaction.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {transaction.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {transaction.user?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-gray-400" />
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            <div>{transaction.productInfo?.package?.name_en || 'Unknown Product'}</div>
                            <div className="text-xs text-gray-500">Qty: {transaction.productInfo?.quantity || 1}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div className="space-y-1">
                          {transaction.currency === 'idr' ? (
                            <div>Rp {(transaction.productInfo?.unitPrice?.idr || 0).toLocaleString()}</div>
                          ) : (
                            <div>${(transaction.productInfo?.unitPrice?.usd || 0).toLocaleString()}</div>
                          )}
                          <div className="text-xs text-gray-500">per unit</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="space-y-1">
                          {transaction.currency === 'idr' ? (
                            <div>Rp {(transaction.productInfo?.totalPrice?.idr || 0).toLocaleString()}</div>
                          ) : (
                            <div>${(transaction.productInfo?.totalPrice?.usd || 0).toLocaleString()}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {transaction.productInfo?.quantity || 1} × unit price
                          </div>
                        </div>
                      </td>                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.payment?.status || 'pending')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTransactionStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getDeliveryStatusBadge(transaction.deliveryStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Delivery Action Buttons */}
                          {transaction.payment?.status === 'paid' && (
                            <>
                            {/* Start Progress: Show when delivery status is pending and payment is paid */}
                            {transaction.deliveryStatus === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeliveryAction(transaction.id, 'in_progress')}
                                disabled={deliveryActionLoading === transaction.id}
                                className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                              >
                                <Play className="w-3 h-3" />
                                Start Progress
                              </Button>
                            )}
                            {/* Mark as Delivered: Show when delivery is pending or in_progress */}
                            {transaction.deliveryStatus && ['pending', 'in_progress'].includes(transaction.deliveryStatus) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTransaction({ transaction, canStartProgress: false, canComplete: true });
                                  setIsCompleteModalOpen(true);
                                }}
                                disabled={deliveryActionLoading === transaction.id}
                                className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Mark as Delivered
                              </Button>
                            )}
                            </>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewTransactionDetail(transaction)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Transaction Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <DialogTitle className="text-xl font-semibold">Transaction Details</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6 pt-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                  <p className="font-medium">{selectedTransaction.transaction.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="font-medium">
                    {selectedTransaction.transaction.productInfo?.totalPrice ? (
                      selectedTransaction.transaction.currency === 'idr' ? (
                        `Rp ${(selectedTransaction.transaction.productInfo.totalPrice.idr || 0).toLocaleString()}`
                      ) : (
                        `$${(selectedTransaction.transaction.productInfo.totalPrice.usd || 0).toLocaleString()}`
                      )
                    ) : (
                      formatCurrency(Number(selectedTransaction.transaction.amount), selectedTransaction.transaction.currency)
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTransaction.transaction.payment?.status || 'pending')}
                  </div>
                </div>                
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction Status</label>
                  <div className="mt-1">
                    {getTransactionStatusBadge(selectedTransaction.transaction.status)}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-medium mb-3 text-blue-800 dark:text-blue-300">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p>{selectedTransaction.transaction.user?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p>{selectedTransaction.transaction.user?.email || 'Unknown'}</p>
                  </div>
                  {selectedTransaction.transaction.user?.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p>{selectedTransaction.transaction.user.phone}</p>
                    </div>
                  )}
                </div>
              </div>              
              {/* Product Info */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <h3 className="text-lg font-medium mb-3 text-green-800 dark:text-green-300">Product Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product</label>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-lg">{selectedTransaction.transaction.productInfo?.package?.name_en || 'Unknown Product'}</span>
                          <span className="text-sm text-gray-500">Qty: {selectedTransaction.transaction.productInfo?.quantity || 1}</span>
                        </div>
                        {selectedTransaction.transaction.productInfo?.package?.name_id && (
                          <div className="text-sm text-gray-500 italic">{selectedTransaction.transaction.productInfo.package.name_id}</div>
                        )}
                        {selectedTransaction.transaction.productInfo?.package?.description_en && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <strong>Description:</strong> {selectedTransaction.transaction.productInfo.package.description_en}
                          </div>
                        )}
                        
                        {/* Category and Subcategory */}
                        {(selectedTransaction.transaction.productInfo?.package?.category || selectedTransaction.transaction.productInfo?.package?.subcategory) && (
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            {selectedTransaction.transaction.productInfo?.package?.category && (
                              <div>
                                <label className="text-xs font-medium text-gray-500">Category</label>
                                <div className="text-sm flex items-center gap-2">
                                  {selectedTransaction.transaction.productInfo.package.category.icon && (
                                    <>
                                      {selectedTransaction.transaction.productInfo.package.category.icon.startsWith('http') ? (
                                        <Image 
                                          src={selectedTransaction.transaction.productInfo.package.category.icon} 
                                          alt="Category icon" 
                                          width={20}
                                          height={20}
                                          className="object-contain rounded"
                                        />
                                      ) : (
                                        <span className="text-lg">{selectedTransaction.transaction.productInfo.package.category.icon}</span>
                                      )}
                                    </>
                                  )}
                                  <span>{selectedTransaction.transaction.productInfo.package.category.name_en}</span>
                                </div>
                              </div>
                            )}
                            {selectedTransaction.transaction.productInfo?.package?.subcategory && (
                              <div>
                                <label className="text-xs font-medium text-gray-500">Subcategory</label>
                                <div className="text-sm">{selectedTransaction.transaction.productInfo.package.subcategory.name_en}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Features */}
                        {selectedTransaction.transaction.productInfo?.package?.features && selectedTransaction.transaction.productInfo.package.features.length > 0 ? (
                          <div className="pt-3 border-t">
                            <label className="text-xs font-medium text-gray-500">Features</label>
                            <div className="mt-2 space-y-1">
                              {selectedTransaction.transaction.productInfo.package.features.map((feature, index) => (
                                <div key={feature.id || index} className="flex items-center gap-2 text-sm">
                                  <div className={`w-2 h-2 rounded-full ${feature.included ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className={feature.included ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                    {feature.name_en}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-3 border-t">
                            <label className="text-xs font-medium text-gray-500">Features</label>
                            <div className="mt-2 text-sm text-gray-500">
                              No features available for this package
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-2">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Unit Price</label>
                            <div className="text-sm">
                              {selectedTransaction.transaction.productInfo?.unitPrice ? (
                                selectedTransaction.transaction.currency === 'idr' ? (
                                  <span>Rp {(selectedTransaction.transaction.productInfo.unitPrice.idr || 0).toLocaleString()}</span>
                                ) : (
                                  <span>${(selectedTransaction.transaction.productInfo.unitPrice.usd || 0).toLocaleString()}</span>
                                )
                              ) : (
                                <span className="text-gray-400">Not available</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">Total Amount</label>
                            <div className="text-sm font-medium">
                              {selectedTransaction.transaction.productInfo?.totalPrice ? (
                                selectedTransaction.transaction.currency === 'idr' ? (
                                  <span>Rp {(selectedTransaction.transaction.productInfo.totalPrice.idr || 0).toLocaleString()}</span>
                                ) : (
                                  <span>${(selectedTransaction.transaction.productInfo.totalPrice.usd || 0).toLocaleString()}</span>
                                )
                              ) : (
                                <span>
                                  {formatCurrency(Number(selectedTransaction.transaction.amount), selectedTransaction.transaction.currency)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedTransaction.transaction.productInfo?.referenceLink && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reference Link</label>
                      <p className="break-all text-blue-600 dark:text-blue-400 hover:underline">
                        <a href={selectedTransaction.transaction.productInfo.referenceLink} target="_blank" rel="noopener noreferrer">
                          {selectedTransaction.transaction.productInfo.referenceLink}
                        </a>
                      </p>
                    </div>
                  )}
                  {/* Transaction Notes Section */}
                  {selectedTransaction.transaction.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer Notes</label>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-1 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm whitespace-pre-wrap">{selectedTransaction.transaction.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Action Buttons */}
              {selectedTransaction.transaction.payment?.status === 'paid' && (
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {selectedTransaction.transaction.deliveryStatus === 'pending' && (
                    <Button
                      onClick={() => handleDeliveryAction(selectedTransaction.transaction.id, 'in_progress')}
                      disabled={deliveryActionLoading === selectedTransaction.transaction.id}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Progress
                    </Button>
                  )}
                  
                  {selectedTransaction.transaction.deliveryStatus && ['pending', 'in_progress'].includes(selectedTransaction.transaction.deliveryStatus) && (
                    <Button
                      onClick={() => {
                        setIsDetailOpen(false);
                        setIsCompleteModalOpen(true);
                      }}
                      disabled={deliveryActionLoading === selectedTransaction.transaction.id}
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
        </DialogContent>
      </Dialog>

      {/* Complete Transaction Modal */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-2 border-green-200 dark:border-green-700 shadow-lg">
          <DialogHeader className="border-b border-green-200 dark:border-green-700 pb-4">
            <DialogTitle className="text-xl font-semibold text-green-800 dark:text-green-300">Complete Transaction</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Fill in the package delivery information to complete this transaction
            </p>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  placeholder="https://example.com"
                  value={completeFormData.websiteUrl}
                  onChange={(e) => setCompleteFormData({...completeFormData, websiteUrl: e.target.value})}
                />
              </div>
              
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
                <Label htmlFor="domainName">Domain Name</Label>
                <Input
                  id="domainName"
                  placeholder="example.com"
                  value={completeFormData.domainName}
                  onChange={(e) => setCompleteFormData({...completeFormData, domainName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="domainExpiredAt">Domain Expiration Date</Label>
                <Input
                  id="domainExpiredAt"
                  type="date"
                  value={completeFormData.domainExpiredAt}
                  onChange={(e) => setCompleteFormData({...completeFormData, domainExpiredAt: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="textDescription">Description</Label>
                <Textarea
                  id="textDescription"
                  placeholder="Additional information about the delivery..."
                  rows={4}
                  value={completeFormData.textDescription}
                  onChange={(e) => setCompleteFormData({...completeFormData, textDescription: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Internal notes for team..."
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
