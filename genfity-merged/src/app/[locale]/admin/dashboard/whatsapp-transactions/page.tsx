"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Check,
  Info,
  Copy
} from "lucide-react";
import { SessionManager } from '@/lib/storage';

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
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "user">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
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
    try {
      setLoading(true);
      const token = SessionManager.getToken();
      if (!token) {
        router.push('/signin');
        return;
      }

      const res = await fetch("/api/admin/whatsapp/transactions", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }
      
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
  }, [router]);

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

  // Auto refresh functionality - more frequent like sessions page
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchTransactions, 10000); // Refresh every 10 seconds for real-time monitoring
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
      const token = SessionManager.getToken();
      if (!token) {
        router.push('/signin');
        return;
      }

      const res = await fetch(`/api/admin/transactions/whatsapp/${transactionId}/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'delivered' }),
      });
      
      if (res.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }
      
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
      const token = SessionManager.getToken();
      if (!token) {
        router.push('/signin');
        return;
      }

      const res = await fetch(`/api/admin/transactions/whatsapp/${transactionId}/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'failed' }),
      });
      
      if (res.status === 401) {
        SessionManager.clearSession();
        router.push('/signin');
        return;
      }
      
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

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // View transaction details
  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Transactions</h1>
          <p className="text-muted-foreground">
            Track and manage all WhatsApp API package transactions and payments from your customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => fetchTransactions()} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            disabled={loading}
          >
            <Activity className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              Payment completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activated</CardTitle>
            <Activity className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.success}</div>
            <p className="text-xs text-muted-foreground">
              Services activated
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting action
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Transaction History Card */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Transaction History</CardTitle>
          <CardDescription>
            All WhatsApp API package transactions and payments from your customers ({filteredTransactions.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction ID, user name, email, or package..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchTransactions}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                onClick={exportTransactions}
                disabled={loading || filteredTransactions.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading transactions...</span>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">No transactions found matching your criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Transaction Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm font-mono">{transaction.id}</div>
                        <div className="text-xs text-muted-foreground">User: {transaction.userId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.user?.name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">{transaction.user?.email || 'No email'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.whatsappTransaction?.whatsappPackage?.name || 'Unknown Package'}</div>
                        {transaction.whatsappTransaction?.whatsappPackage?.maxSession && (
                          <div className="text-xs text-muted-foreground">
                            Max {transaction.whatsappTransaction.whatsappPackage.maxSession} sessions
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.whatsappTransaction?.duration === 'year' ? '1 Year' : '1 Month'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(Number(transaction.amount))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.payment?.status || 'pending')}
                    </TableCell>
                    <TableCell>
                      {getTransactionStatusBadge(transaction.whatsappTransaction?.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{new Date(transaction.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewTransactionDetails(transaction)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {transaction.payment?.status === 'paid' && 
                         (transaction.whatsappTransaction?.status === 'pending' || transaction.whatsappTransaction?.status === 'failed') && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManualActivation(transaction.id)}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Activate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsFailed(transaction.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Failed
                            </Button>
                          </>
                        )}
                        {transaction.whatsappTransaction?.status === 'success' && (
                          <span className="text-sm text-muted-foreground">Completed</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Footer Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-muted-foreground">
                This Month Revenue: <span className="font-semibold text-green-600">
                  {formatCurrency(stats.monthlyRevenue)}
                </span>
              </div>
              <div className="text-muted-foreground">
                Total Revenue: <span className="font-semibold text-purple-600">
                  {formatCurrency(stats.totalRevenue)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {selectedTransaction.id}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(selectedTransaction.id)}
                        className="p-1 h-6 w-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {selectedTransaction.userId}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(selectedTransaction.userId)}
                        className="p-1 h-6 w-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {formatCurrency(Number(selectedTransaction.amount))}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(selectedTransaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer</label>
                    <div className="mt-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedTransaction.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedTransaction.user?.email || 'No email'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedTransaction.payment?.status || 'pending')}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Status</label>
                    <div className="mt-1">
                      {getTransactionStatusBadge(selectedTransaction.whatsappTransaction?.status)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated Date</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(selectedTransaction.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Package Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">WhatsApp Package Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Package Name</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {selectedTransaction.whatsappTransaction?.whatsappPackage?.name || 'Unknown Package'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
                    <div className="mt-1">
                      <Badge className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                        {selectedTransaction.whatsappTransaction?.duration === 'year' ? '1 Year' : '1 Month'}
                      </Badge>
                    </div>
                  </div>

                  {selectedTransaction.whatsappTransaction?.whatsappPackage?.maxSession && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Max Sessions</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {selectedTransaction.whatsappTransaction.whatsappPackage.maxSession}
                      </p>
                    </div>
                  )}

                  {selectedTransaction.whatsappTransaction?.whatsappPackage?.description && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {selectedTransaction.whatsappTransaction.whatsappPackage.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              {selectedTransaction.payment && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment ID</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {selectedTransaction.payment.id}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedTransaction.payment!.id)}
                          className="p-1 h-6 w-6"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {selectedTransaction.payment.method && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {selectedTransaction.payment.method}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.payment.createdAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Created</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {new Date(selectedTransaction.payment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.payment.expiresAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Expires</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                          {new Date(selectedTransaction.payment.expiresAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Notes */}
              {selectedTransaction.notes && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Notes</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    {selectedTransaction.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex gap-2 justify-end">
                {selectedTransaction.payment?.status === 'paid' && 
                 (selectedTransaction.whatsappTransaction?.status === 'pending' || selectedTransaction.whatsappTransaction?.status === 'failed') && (
                  <>
                    <Button
                      onClick={() => {
                        handleManualActivation(selectedTransaction.id);
                        setShowDetailDialog(false);
                      }}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4" />
                      Activate Service
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleMarkAsFailed(selectedTransaction.id);
                        setShowDetailDialog(false);
                      }}
                      className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                      Mark as Failed
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailDialog(false)}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
