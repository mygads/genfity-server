"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
  Check
} from "lucide-react";

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  status: string; // created, pending, in_progress, success, failed, cancelled, expired
  createdAt: string;
  updatedAt: string;
  notes?: string; // Transaction notes from checkout
  user?: { 
    id: string;
    name: string; 
    email: string;
  };
  whatsappTransaction?: {
    whatsappPackage: {
      id: string;
      name: string;
      description?: string;
      maxSession: number;
    };
    duration: string;
    status?: string; // pending, success, failed
  };
  payment?: {
    id: string;
    status: string; // pending, paid, failed, expired, cancelled
    method?: string;
    amount?: number;
    expiresAt?: string;
    createdAt?: string;
  };
}

export default function WhatsAppTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "user">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [autoRefresh, setAutoRefresh] = useState(false);
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    success: 0,
    failed: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/management/transaction");
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

  function calculateStats(transactions: Transaction[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Count based on different statuses
    const pending = transactions.filter(t => t.status === 'pending' || t.status === 'created' || t.status === 'in_progress').length;
    const paid = transactions.filter(t => t.payment?.status === 'paid').length;
    const success = transactions.filter(t => t.whatsappTransaction?.status === 'success').length;
    const failed = transactions.filter(t => t.status === 'failed' || t.status === 'cancelled' || t.status === 'expired' || t.payment?.status === 'failed' || t.payment?.status === 'expired' || t.payment?.status === 'cancelled').length;

    // Calculate total revenue from all paid transactions using the amount field
    const totalRevenue = transactions
      .filter(t => t.payment?.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate monthly revenue
    const monthlyRevenue = transactions
      .filter(t => {
        const trxDate = new Date(t.createdAt);
        return t.payment?.status === 'paid' && 
               trxDate.getMonth() === currentMonth && 
               trxDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const stats = {
      total: transactions.length,
      pending: pending,
      paid: paid,
      success: success,
      failed: failed,
      totalRevenue: totalRevenue,
      monthlyRevenue: monthlyRevenue
    };

    setStats(stats);
  }

  // Initial load and auto refresh effects
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Auto refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchTransactions, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchTransactions]);

  // Enhanced filter and sort functions
  const handleSort = (field: "date" | "amount" | "user") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Export function
  const exportTransactions = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Transaction ID,User ID,User Name,User Email,Package,Duration,Amount,Status,Created Date,Updated Date\n" +
      filteredTransactions.map(t => 
        `${t.id},${t.userId},"${t.user?.name || 'Unknown'}","${t.user?.email || 'Unknown'}","${t.whatsappTransaction?.whatsappPackage?.name || 'Unknown'}",${t.whatsappTransaction?.duration || 'N/A'},${t.amount},${t.status},${t.createdAt},${t.updatedAt}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `whatsapp_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions
    .filter(trx => {
      const matchesSearch = (trx.userId && trx.userId.toLowerCase().includes(search.toLowerCase())) || 
                           (trx.whatsappTransaction?.whatsappPackage?.name && trx.whatsappTransaction.whatsappPackage.name.toLowerCase().includes(search.toLowerCase())) ||
                           (trx.id && trx.id.toLowerCase().includes(search.toLowerCase())) ||
                           (trx.user?.name && trx.user.name.toLowerCase().includes(search.toLowerCase())) ||
                           (trx.user?.email && trx.user.email.toLowerCase().includes(search.toLowerCase()));
      
      // Filter by status (check both payment status and transaction status)
      let matchesStatus = true;
      if (statusFilter !== "all") {
        matchesStatus = trx.payment?.status === statusFilter || 
                       trx.status === statusFilter || 
                       trx.whatsappTransaction?.status === statusFilter;
      }
      
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
          case "year":
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            matchesDate = trxDate >= yearAgo;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "user":
          aValue = a.user?.name || a.userId;
          bValue = b.user?.name || b.userId;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'created':
        return (
          <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            Created
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'failed':
      case 'cancelled':
      case 'expired':
        return (
          <Badge className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700">
            <X className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'success':
        return (
          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600">
            {status}
          </Badge>
        );
    }
  };

  const getTransactionStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700">
            <X className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  // Manual activation function
  const handleManualActivation = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/transactions/whatsapp/${transactionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'delivered' }),
      });
      
      const data = await res.json();
      if (data.success) {
        if (data.alreadyProcessed) {
          alert("WhatsApp service is already activated!");
        } else {
          alert("WhatsApp service activated successfully!");
        }
        fetchTransactions(); // Refresh the data
      } else {
        alert("Failed to activate service: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error activating service:", error);
      alert("Error activating service");
    }
  };

  // Manual failure marking function
  const handleMarkAsFailed = async (transactionId: string) => {
    if (!confirm('Are you sure you want to mark this WhatsApp service as failed? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/transactions/whatsapp/${transactionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'failed' }),
      });
      
      const data = await res.json();
      if (data.success) {
        alert("WhatsApp transaction marked as failed!");
        fetchTransactions(); // Refresh the data
      } else {
        alert("Failed to update status: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error marking as failed:", error);
      alert("Error updating status");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
          WhatsApp Transaction History
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Track and manage all WhatsApp API package transactions and payments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.paid}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activated</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.success}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Transaction History Card */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-100">Transaction History</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  All WhatsApp API package transactions ({filteredTransactions.length} total)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-sm border">
                {sortBy} {sortOrder === "asc" ? "↑" : "↓"}
              </Badge>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="flex items-center gap-1"
              >
                <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportTransactions}
                className="flex items-center gap-1"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <Input
                type="search"
                placeholder="Search by transaction ID, user name, email, or package..."
                className="pl-10 border-gray-200 dark:border-gray-600 focus:border-green-400 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-200 dark:border-gray-600 focus:border-green-400 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="all" className="text-gray-900 dark:text-gray-100">All Status</SelectItem>
                  <SelectItem value="paid" className="text-gray-900 dark:text-gray-100">Paid</SelectItem>
                  <SelectItem value="pending" className="text-gray-900 dark:text-gray-100">Pending</SelectItem>
                  <SelectItem value="created" className="text-gray-900 dark:text-gray-100">Created</SelectItem>
                  <SelectItem value="in_progress" className="text-gray-900 dark:text-gray-100">In Progress</SelectItem>
                  <SelectItem value="success" className="text-gray-900 dark:text-gray-100">Success</SelectItem>
                  <SelectItem value="failed" className="text-gray-900 dark:text-gray-100">Failed</SelectItem>
                  <SelectItem value="cancelled" className="text-gray-900 dark:text-gray-100">Cancelled</SelectItem>
                  <SelectItem value="expired" className="text-gray-900 dark:text-gray-100">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-200 dark:border-gray-600 focus:border-green-400 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="all" className="text-gray-900 dark:text-gray-100">All Time</SelectItem>
                  <SelectItem value="today" className="text-gray-900 dark:text-gray-100">Today</SelectItem>
                  <SelectItem value="week" className="text-gray-900 dark:text-gray-100">This Week</SelectItem>
                  <SelectItem value="month" className="text-gray-900 dark:text-gray-100">This Month</SelectItem>
                  <SelectItem value="year" className="text-gray-900 dark:text-gray-100">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                className="shrink-0 border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 bg-white dark:bg-gray-700" 
                onClick={fetchTransactions}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort("date")}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Transaction
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort("user")}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Customer
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Package</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <button 
                        onClick={() => handleSort("amount")}
                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Amount
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                            {transaction.id}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            User ID: {transaction.userId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {transaction.user?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {transaction.user?.email || 'No email'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {transaction.whatsappTransaction?.whatsappPackage?.name || 'Unknown Package'}
                            </span>
                            {transaction.whatsappTransaction?.whatsappPackage?.maxSession && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Max {transaction.whatsappTransaction.whatsappPackage.maxSession} sessions
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">                        <Badge className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {transaction.whatsappTransaction?.duration === 'year' ? '1 Year' : '1 Month'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(Number(transaction.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.payment?.status || 'pending')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTransactionStatusBadge(transaction.whatsappTransaction?.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {transaction.payment?.status === 'paid' && 
                           (transaction.whatsappTransaction?.status === 'pending' || transaction.whatsappTransaction?.status === 'failed') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManualActivation(transaction.id)}
                                className="flex items-center gap-1 text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
                              >
                                <Check className="w-3 h-3" />
                                Activate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsFailed(transaction.id)}
                                className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                              >
                                <X className="w-3 h-3" />
                                Failed
                              </Button>
                            </>
                          )}
                          {transaction.whatsappTransaction?.status === 'success' && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {search || statusFilter !== 'all' || dateFilter !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'Transactions will appear here once customers make purchases'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-gray-600 dark:text-gray-400">
                This Month Revenue: <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.monthlyRevenue)}
                </span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Total Revenue: <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {formatCurrency(stats.totalRevenue)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
