"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from 'sonner';
import { SessionManager } from '@/lib/storage';
import { 
  CreditCard, 
  Search,
  RefreshCw,
  DollarSign,
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
  Package,
  Activity,
  Eye,
  X,
  XCircle,
  Check,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProductTransactionDetail {
  id: string;
  packageId?: string;
  quantity?: number;
  startDate?: string;
  endDate?: string;
  referenceLink?: string;
  package?: {
    id: string;
    name_en: string;
    name_id: string;
    price_idr: number;
    price_usd: number;
    image?: string;
    category?: {
      name_en: string;
    };
    subcategory?: {
      name_en: string;
    };
  };
}

interface AddonTransactionDetail {
  id: string;
  addonId: string;
  quantity: number;
  startDate?: string;
  endDate?: string;
  addon: {
    id: string;
    name_en: string;
    name_id: string;
    price_idr: number;
    price_usd: number;
    image?: string;
    category?: {
      name_en: string;
    };
  };
}

interface WhatsappTransactionDetail {
  id: string;
  whatsappPackageId: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  whatsappPackage: {
    id: string;
    name: string;
    priceMonth: number;
    priceYear: number;
  };
}

interface PaymentDetail {
  id: string;
  amount: number;
  method: string;
  status: string;
  paymentDate?: string;
  serviceFee?: number;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  status: string; // Consolidated status (created, pending, in-progress, success, cancelled, expired)
  type: string;
  currency?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  notes?: string; // Transaction notes from checkout
  transactionStatusText?: string;
  paymentStatusText?: string;
  canConfirmTransaction?: boolean;
  discountAmount?: number;
  user?: { 
    id: string;
    name: string; 
    email: string;
  };
  productTransactions?: ProductTransactionDetail[];
  addonTransactions?: AddonTransactionDetail[];
  whatsappTransaction?: WhatsappTransactionDetail;
  payment?: PaymentDetail;
}

interface TransactionStats {
  total: number;
  // Consolidated status stats
  created: number;
  pending: number;
  inProgress: number;
  success: number;
  cancelled: number;
  expired: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageAmount: number;
}

export default function TransactionPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all"); // Payment status filter
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("all"); // Transaction status filter
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "user">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Pagination
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Stats
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    created: 0,
    pending: 0,
    inProgress: 0,
    success: 0,
    cancelled: 0,
    expired: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageAmount: 0
  });
  // Helper function to calculate total price with quantity
  const calculateItemTotal = (price: number, quantity: number) => {
    return price * quantity;
  };
  // Helper function to get currency symbol
  const getCurrencySymbol = (currency?: string) => {
    return currency === 'usd' ? '$' : 'Rp';
  };
  // Helper function to get transaction type badge based on included items
  const getTransactionTypeBadge = (transaction: Transaction) => {
    const hasProducts = transaction.productTransactions && transaction.productTransactions.length > 0;
    const hasAddons = transaction.addonTransactions && transaction.addonTransactions.length > 0;
    const hasWhatsApp = transaction.whatsappTransaction;

    if (hasProducts && hasAddons && hasWhatsApp) {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">ALL</Badge>;
    } else if (hasProducts && hasAddons) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Products + Addons</Badge>;
    } else if (hasProducts && hasWhatsApp) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Products + WhatsApp</Badge>;
    } else if (hasAddons && hasWhatsApp) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Addons + WhatsApp</Badge>;
    } else if (hasProducts) {
      return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Products</Badge>;
    } else if (hasAddons) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Addons</Badge>;
    } else if (hasWhatsApp) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">WhatsApp</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>;
    }
  };
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // Get token for authentication
      const token = SessionManager.getToken();
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (transactionStatusFilter !== "all") params.set("status", transactionStatusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/transactions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        setTransactions(data.data || []);
        setTotal(data.pagination?.total || 0);
        setHasMore(data.pagination?.hasMore || false);
        calculateStats(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [limit, offset, transactionStatusFilter, typeFilter]);  function calculateStats(transactions: Transaction[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // For revenue, filter by payment status being 'paid'
    const paidTransactions = transactions.filter(t => t.payment?.status === 'paid');
    const monthlyTransactions = paidTransactions.filter(t => {
      const transactionDate = new Date(t.transactionDate);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const totalRevenue = paidTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    setStats({
      total: transactions.length,
      // Transaction status stats (using underscore format from API)
      created: transactions.filter(t => t.status === 'created').length,
      pending: transactions.filter(t => t.status === 'pending').length,
      inProgress: transactions.filter(t => t.status === 'in_progress').length,
      success: transactions.filter(t => t.status === 'success').length,
      cancelled: transactions.filter(t => t.status === 'cancelled').length,
      expired: transactions.filter(t => t.status === 'expired').length,
      totalRevenue,
      monthlyRevenue,
      averageAmount: paidTransactions.length > 0 ? totalRevenue / paidTransactions.length : 0
    });
  }

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);  const filteredTransactions = transactions.filter(transaction => {
    const matchSearch = 
      transaction.id.toLowerCase().includes(search.toLowerCase()) ||
      transaction.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.user?.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchTransactionStatus = transactionStatusFilter === "all" || transaction.status === transactionStatusFilter;
    const matchPaymentStatus = paymentStatusFilter === "all" || transaction.payment?.status === paymentStatusFilter;
    
    return matchSearch && matchTransactionStatus && matchPaymentStatus;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case "amount":
        aValue = Number(a.amount);
        bValue = Number(b.amount);
        break;
      case "user":
        aValue = a.user?.name || "";
        bValue = b.user?.name || "";
        break;
      case "date":
      default:
        aValue = new Date(a.transactionDate).getTime();
        bValue = new Date(b.transactionDate).getTime();
        break;
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });    const getStatusBadge = (status: string, isPaymentStatus: boolean = true) => {
    // Normalize status: convert underscores to hyphens for consistency
    const normalizedStatus = status.replace(/_/g, '-');
    
    if (isPaymentStatus) {
      // Payment status badges
      const statusConfig = {
        pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, color: "text-yellow-600" },
        paid: { className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, color: "text-green-600" },
        failed: { className: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle, color: "text-red-600" },
        cancelled: { className: "bg-gray-100 text-gray-800 border-gray-200", icon: X, color: "text-gray-600" },
      };

      const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending;
      const IconComponent = config.icon;

      return (
        <Badge className={`flex items-center gap-1 ${config.className}`}>
          <IconComponent className="w-3 h-3" />
          {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
        </Badge>
      );
    } else {
      // Transaction status badges
      const transactionStatusConfig = {
        created: { className: "bg-blue-100 text-blue-800 border-blue-200", icon: Activity, color: "text-blue-600" },
        pending: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, color: "text-yellow-600" },
        'in-progress': { className: "bg-orange-100 text-orange-800 border-orange-200", icon: Clock, color: "text-orange-600" },
        success: { className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, color: "text-green-600" },
        cancelled: { className: "bg-gray-100 text-gray-800 border-gray-200", icon: X, color: "text-gray-600" },
        expired: { className: "bg-red-100 text-red-800 border-red-200", icon: XCircle, color: "text-red-600" },
      };

      const config = transactionStatusConfig[normalizedStatus as keyof typeof transactionStatusConfig] || transactionStatusConfig.created;
      const IconComponent = config.icon;

      return (
        <Badge className={`flex items-center gap-1 ${config.className}`}>
          <IconComponent className="w-3 h-3" />
          {normalizedStatus.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      );
    }
  };
  const getTypeBadge = (type: string) => {
    const typeColors = {
      product: "bg-blue-100 text-blue-800 border-blue-200",
      whatsapp_service: "bg-green-100 text-green-800 border-green-200",
      digital_service: "bg-purple-100 text-purple-800 border-purple-200",
    };

    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR"
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const handleViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleConfirmTransaction = async (transactionId: string) => {
    try {
      // Get token for authentication
      const token = SessionManager.getToken();
      
      const res = await fetch(`/api/transactions/${transactionId}/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        toast.success('Transaction confirmed successfully');
        fetchTransactions();
      } else {
        throw new Error(data.error || 'Failed to confirm transaction');
      }
    } catch (error) {
      console.error("Error confirming transaction:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to confirm transaction');
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ["ID", "User", "Type", "Amount", "Status", "Date"],
      ...sortedTransactions.map(t => [
        t.id,
        t.user?.name || "N/A",
        t.type,
        t.amount.toString(),
        t.status,
        formatDate(t.transactionDate)
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Transaction Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage all transaction activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportTransactions} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button 
            onClick={fetchTransactions} 
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalRevenue)} total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                Pending completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <p className="text-xs text-muted-foreground">
                Successfully processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Current month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by ID, user name, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>              
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>            
            <Select value={transactionStatusFilter} onValueChange={setTransactionStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Transaction Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transaction Status</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="whatsapp_service">WhatsApp Service</SelectItem>
                <SelectItem value="digital_service">Digital Service</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Transactions
          </CardTitle>
          <CardDescription>
            Showing {sortedTransactions.length} of {total} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading transactions...</span>
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">                  
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Transaction ID</th>
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Items & Qty</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Payment Status</th>
                    <th className="text-left p-4 font-medium">Transaction Status</th>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4">
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {transaction.id}
                        </code>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{transaction.user?.name || "N/A"}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {transaction.user?.email || "N/A"}
                          </div>
                        </div>
                      </td>                      
                      <td className="p-4">
                        {getTransactionTypeBadge(transaction)}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {/* Products */}
                          {transaction.productTransactions?.map((product, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">{product.package?.name_en}</span>
                              <span className="text-gray-500 ml-2">
                                x {product.quantity || 1}
                              </span>
                            </div>
                          ))}
                          
                          {/* Addons */}
                          {transaction.addonTransactions?.map((addon, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-orange-600">{addon.addon.name_en}</span>
                              <span className="text-gray-500 ml-2">
                                x {addon.quantity}
                              </span>
                            </div>
                          ))}
                          
                          {/* WhatsApp */}
                          {transaction.whatsappTransaction && (
                            <div className="text-sm">
                              <span className="font-medium text-green-600">{transaction.whatsappTransaction.whatsappPackage.name}</span>
                              <span className="text-gray-500 ml-2">
                                {transaction.whatsappTransaction.duration === 'year' ? '1 Year' : '1 Month'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium">
                        {formatCurrency(Number(transaction.amount))}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(transaction.payment?.status || 'pending', true)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(transaction.status, false)}
                      </td>
                      <td className="p-4 text-sm">
                        {formatDate(transaction.transactionDate)}
                      </td>
                      <td className="p-4">
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
                            
                            {/* Payment Detail Button - only show if payment exists */}
                            {transaction.payment && (
                              <DropdownMenuItem onClick={() => router.push(`/admin/dashboard/payments/${transaction.payment!.id}`)}>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Payment Details
                              </DropdownMenuItem>
                            )}

                            {/* Manual completion for package transactions that are in progress */}
                            {transaction.type === 'product' && 
                            transaction.productTransactions && transaction.productTransactions.length > 0 &&
                            transaction.status === 'in-progress' && (
                              <DropdownMenuItem onClick={() => handleConfirmTransaction(transaction.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Complete Transaction
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Transaction Details</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDetailModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Payment Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTransaction.payment?.status || 'pending', true)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Transaction Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTransaction.status, false)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Transaction Type
                  </label>
                  <div className="mt-1">
                    {getTransactionTypeBadge(selectedTransaction)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Amount
                  </label>
                  <p className="text-lg font-bold">
                    {formatCurrency(Number(selectedTransaction.amount))}
                  </p>
                </div>
              </div>

              {selectedTransaction.user && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Customer
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mt-1">
                    <p className="font-medium">{selectedTransaction.user.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTransaction.user.email}
                    </p>
                  </div>
                </div>
              )}              
              {selectedTransaction.productTransactions && selectedTransaction.productTransactions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Product Details
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mt-1">
                    {selectedTransaction.productTransactions.map((productTx, index) => (
                      <div key={productTx.id} className={index > 0 ? "mt-3 pt-3 border-t border-gray-200 dark:border-gray-700" : ""}>
                        {productTx.package && (
                          <>
                            <p className="font-medium">Package: {productTx.package.name_en}</p>
                            <p className="text-sm">Unit Price: {formatCurrency(productTx.package.price_idr)}</p>
                            <p className="text-sm">Quantity: {productTx.quantity || 1}</p>
                            <p className="text-sm font-medium">Total: {formatCurrency(calculateItemTotal(productTx.package.price_idr, productTx.quantity || 1))}</p>
                          </>
                        )}
                        {productTx.startDate && (
                          <p className="text-sm">
                            Start: {formatDate(productTx.startDate)}
                          </p>
                        )}
                        {productTx.endDate && (
                          <p className="text-sm">
                            End: {formatDate(productTx.endDate)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTransaction.addonTransactions && selectedTransaction.addonTransactions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Addon Details
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mt-1">
                    {selectedTransaction.addonTransactions.map((addonTx, index) => (
                      <div key={addonTx.id} className={index > 0 ? "mt-3 pt-3 border-t border-gray-200 dark:border-gray-700" : ""}>
                        <p className="font-medium">Addon: {addonTx.addon.name_en}</p>
                        <p className="text-sm">Unit Price: {formatCurrency(addonTx.addon.price_idr)}</p>
                        <p className="text-sm">Quantity: {addonTx.quantity}</p>
                        <p className="text-sm font-medium">Total: {formatCurrency(calculateItemTotal(addonTx.addon.price_idr, addonTx.quantity))}</p>
                        {addonTx.addon.category && (
                          <p className="text-sm">Category: {addonTx.addon.category.name_en}</p>
                        )}
                        {addonTx.startDate && (
                          <p className="text-sm">
                            Start: {formatDate(addonTx.startDate)}
                          </p>
                        )}
                        {addonTx.endDate && (
                          <p className="text-sm">
                            End: {formatDate(addonTx.endDate)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTransaction.whatsappTransaction && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    WhatsApp Service Details
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mt-1">
                    <p className="font-medium">{selectedTransaction.whatsappTransaction.whatsappPackage.name}</p>
                    <p className="text-sm">Duration: {selectedTransaction.whatsappTransaction.duration}</p>
                    <p className="text-sm">
                      Price: {formatCurrency(
                        selectedTransaction.whatsappTransaction.duration === 'year' 
                          ? selectedTransaction.whatsappTransaction.whatsappPackage.priceYear 
                          : selectedTransaction.whatsappTransaction.whatsappPackage.priceMonth
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction Notes Section */}
              {selectedTransaction.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Customer Notes
                  </label>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded mt-1 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm whitespace-pre-wrap">{selectedTransaction.notes}</p>
                  </div>
                </div>
              )}
              
              {selectedTransaction.payment && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Payment Summary
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded mt-1 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Payment Method:</span>
                      <span className="text-sm font-medium">{selectedTransaction.payment.method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Payment Status:</span>
                      <div>{getStatusBadge(selectedTransaction.payment.status, true)}</div>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Subtotal:</span>
                        <span className="text-sm">{formatCurrency(Number(selectedTransaction.amount))}</span>
                      </div>

                      {Number(selectedTransaction.discountAmount) && (
                        <div className="flex justify-between items-center text-green-600">
                          <span className="text-sm">Voucher Discount:</span>
                          <span className="text-sm">-{formatCurrency(Number(selectedTransaction.discountAmount))}</span>
                        </div>
                      )}
                      
                      {/* Service fee */}
                      <div className="flex justify-between items-center text-blue-600">
                        <span className="text-sm">Service Fee:</span>
                        <span className="text-sm">+{formatCurrency(Number(selectedTransaction.payment.serviceFee))}</span>
                      </div>
                      
                      {/* Unique code for manual payments */}
                      <div className="flex justify-between items-center text-orange-600">
                        <span className="text-sm">Unique Code:</span>
                        <span className="text-sm font-mono">+{formatCurrency(Number(selectedTransaction.payment.amount) - (Number(selectedTransaction.amount) - Number(selectedTransaction.discountAmount || 0) + Number(selectedTransaction.payment.serviceFee || 0)))}</span>
                      </div>
                      
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total Payment:</span>
                          <span className="text-green-600">{formatCurrency(Number(selectedTransaction.payment.amount))}</span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedTransaction.payment.paymentDate && (
                      <div className="border-t pt-3">
                        <p className="text-sm">
                          <span className="font-medium">Payment Date:</span> {formatDate(selectedTransaction.payment.paymentDate)}
                        </p>
                      </div>
                    )}
                    
                    {/* Navigation Button */}
                    <div className="border-t pt-3">
                      <Button
                        onClick={() => router.push(`/admin/dashboard/payments/${selectedTransaction.payment!.id}`)}
                        className="w-full"
                        size="sm"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        View Full Payment Details
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Created At
                  </label>
                  <p className="text-sm">{formatDate(selectedTransaction.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Updated At
                  </label>
                  <p className="text-sm">{formatDate(selectedTransaction.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
