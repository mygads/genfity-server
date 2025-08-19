"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, TrendingUp, Users, DollarSign, ShoppingCart, CreditCard, Calendar, BarChart3, Activity, TrendingDown, Zap, Target, RefreshCw, Tag, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/Auth/AuthContext";
import { useRouter } from "next/navigation";

// Simple loading skeleton component
function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
  );
}

interface DashboardData {
  period: string;
  currency: string;
  overview: {
    totalTransactions: number;
    completedTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    conversionRate: number;
    newUsers: number;
    totalActiveUsers: number;
    avgProcessingTime: number;
    revenueGrowthRate: number;
    transactionGrowthRate: number;
    peakHour: number;
    totalServiceFeeRevenue: number;
  };
  addonDeliveries?: {
    totalDeliveries: number;
    awaitingDelivery: number;
    inProgress: number;
    delivered: number;
    deliveryRate: number;
    avgDeliveryTime: number;
  };
  revenue: {
    totalRevenue: number;
    grossRevenue: number;
    serviceFeeRevenue: number;
    totalDiscountGiven: number;
    avgOrderValue: number;
    formattedRevenue: string;
    prevMonthRevenue: number;
    revenueGrowth: number;
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  trends: {
    daily: Array<{
      date: string;
      transactions: number;
      revenue: number;
    }>;
    hourly: Array<{
      hour: number;
      count: number;
      percentage: number;
    }>;
  };
  vouchers: {
    totalUsages: number;
    totalDiscount: number;
    formattedDiscount: string;
  };
  categoryStats: Array<{
    type: string;
    _count: { id: number };
    _sum: { finalAmount: number };
  }>;
  topProducts: Array<{
    id: string;
    productName: string;
    productType: string;
    amount: number;
    currency: string;
    date: string;
  }>;
  recentTransactions: Array<{
    id: string;
    customer: string;
    item: string;
    amount: number;
    status: string;
    paymentMethod: string;
    currency: string;
    date: string;
  }>;
  topUsers: Array<{
    userId: string;
    name: string;
    transactionCount: number;
    totalRevenue: number;
  }>;
  conversionFunnel: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  analytics: {
    totalServiceFeeRevenue: number;
    peakTransactionHour: number;
    conversionRate: number;
    avgProcessingTime: number;
    hourlyDistribution: Array<{
      hour: number;
      count: number;
      percentage: number;
    }>;
    statusDistribution: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  };
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'idr') {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  } else {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
}

function formatPaymentMethod(method: string): string {
  const methods: { [key: string]: string } = {
    'manual_bank_transfer': 'Bank Transfer',
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'e_wallet': 'E-Wallet',
    'virtual_account': 'Virtual Account',
    'qris': 'QRIS',
    'gopay': 'GoPay',
    'ovo': 'OVO',
    'dana': 'DANA',
    'shopeepay': 'ShopeePay',
    'linkaja': 'LinkAja'
  };
  return methods[method] || method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// function formatPaymentMethod(method: string): string {
//   return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
// }

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [currency, setCurrency] = useState('idr');
  
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user || !token) {
        router.push('/admin/signin');
        return;
      }
      
      // Check if user has admin role
      if ((user as any).role !== 'admin' && (user as any).role !== 'super_admin') {
        router.push('/admin/signin');
        return;
      }
    }
  }, [user, token, isAuthLoading, router]);  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data:', { period, currency });
      
      // Use token from AuthContext
      if (!token) {
        console.error('No auth token found');
        router.push('/admin/signin');
        return;
      }
      
      const response = await fetch(`/api/admin/dashboard/analytics?period=${period}&currency=${currency}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.success) {
          setData(result.data);
        } else {
          console.error('API returned error:', result.error);
        }
      } else {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        
        // If 401/403, redirect to admin signin
        if (response.status === 401 || response.status === 403) {
          router.push('/admin/signin');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [period, currency, token, router]);
  useEffect(() => {
    // Only fetch data if user is authenticated and has admin role
    if (!isAuthLoading && user && token && 
        ((user as any).role === 'admin' || (user as any).role === 'super_admin')) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, isAuthLoading, user, token]);
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      default: return 'Today';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-500';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'failed': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };
  if (isAuthLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex flex-col gap-2">
          <LoadingSkeleton className="h-8 w-64" />
          <LoadingSkeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return null; // Will redirect in useEffect
  }

  if (loading && !data) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex flex-col gap-2">
          <LoadingSkeleton className="h-8 w-64" />
          <LoadingSkeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Complete transaction and revenue analysis for {getPeriodLabel(period).toLowerCase()}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="idr">IDR</SelectItem>
              <SelectItem value="usd">USD</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold">
                  {data ? data.revenue.formattedRevenue : formatCurrency(0, currency)}
                </h3>
                <span className="text-xs font-medium text-green-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {data ? `${data.overview.conversionRate}%` : '0%'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Service Fee: {data ? formatCurrency(data.revenue.serviceFeeRevenue, currency) : formatCurrency(0, currency)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-brand-blue" />
            </div>
          </div>
          <div className="h-2 w-full bg-blue-red-gradient"></div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold">{data ? data.overview.totalTransactions : 0}</h3>
                <span className="text-xs font-medium text-green-500 flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  {data ? data.overview.completedTransactions : 0} completed
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {data ? data.overview.pendingTransactions : 0} pending, {data ? data.overview.failedTransactions : 0} failed
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-brand-red/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-brand-red" />
            </div>
          </div>
          <div className="h-2 w-full bg-blue-red-gradient"></div>
        </div>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold">{data ? data.overview.totalActiveUsers : 0}</h3>
                <span className="text-xs font-medium text-green-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{data ? data.overview.newUsers : 0} new
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Active users {getPeriodLabel(period).toLowerCase()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-brand-blue" />
            </div>
          </div>
          <div className="h-2 w-full bg-blue-red-gradient"></div>
        </div>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold">
                  {data ? formatCurrency(data.revenue.avgOrderValue, currency) : formatCurrency(0, currency)}
                </h3>
                <span className={`text-xs font-medium flex items-center ${
                  data && data.revenue.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {data && data.revenue.revenueGrowth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {data ? `${data.revenue.revenueGrowth > 0 ? '+' : ''}${data.revenue.revenueGrowth}%` : '0%'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Conversion Rate: {data ? `${data.overview.conversionRate.toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-brand-red/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-brand-red" />
            </div>
          </div>
          <div className="h-2 w-full bg-blue-red-gradient"></div>
        </div>
      </div>

      {/* Enhanced Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Average Processing Time</h3>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {data ? `${data.overview.avgProcessingTime} minutes` : '0 minutes'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average transaction processing time
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Peak Hour</h3>
            <Calendar className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {data ? `${data.overview.peakHour}:00` : '00:00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Busiest hour for transactions
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Service Fee Revenue</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {data ? formatCurrency(data.overview.totalServiceFeeRevenue, currency) : formatCurrency(0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total service fees earned
            </p>
          </div>
        </div>        
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Revenue Growth</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${
              data && data.overview.revenueGrowthRate >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {data ? `${data.overview.revenueGrowthRate > 0 ? '+' : ''}${data.overview.revenueGrowthRate}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Compared to previous period
            </p>        </div>
        </div></div>

      {/* Addon Delivery Metrics */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Addon Delivery Overview</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getPeriodLabel(period)}
            </Badge>
            <Layers className="h-6 w-6 text-indigo-500" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-4 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-indigo-500">
              {data?.addonDeliveries?.totalDeliveries || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Total Deliveries</p>
          </div>
          
          <div className="text-center p-4 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-yellow-500">
              {data?.addonDeliveries?.awaitingDelivery || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Awaiting Delivery</p>
          </div>
          
          <div className="text-center p-4 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">
              {data?.addonDeliveries?.inProgress || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">In Progress</p>
          </div>
          
          <div className="text-center p-4 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-green-500">
              {data?.addonDeliveries?.delivered || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Delivered</p>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Delivery Rate: </span>
              <span className={`font-medium ${
                data && data.addonDeliveries && data.addonDeliveries.deliveryRate >= 80 
                  ? 'text-green-500' 
                  : data && data.addonDeliveries && data.addonDeliveries.deliveryRate >= 60 
                    ? 'text-yellow-500' 
                    : 'text-red-500'
              }`}>
                {data?.addonDeliveries?.deliveryRate || 0}%
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Avg. Delivery Time: </span>
              <span className="font-medium">
                {data?.addonDeliveries?.avgDeliveryTime || 0} hours
              </span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/dashboard/addon-delivery'}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950"
          >
            <Layers className="h-4 w-4 mr-2" />
            Manage Deliveries
          </Button>
        </div>
      </div>

      {/* Enhanced Analytics Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Category Performance */}
        <div className="glass-card rounded-xl p-6">          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Category Performance</h3>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {data?.categoryStats && data.categoryStats.length > 0 ? (
              data.categoryStats.map((category, index) => (
                <div key={category.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 
                      index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                    }`} />
                    <span className="text-sm font-medium capitalize">{category.type}</span>
                  </div>                  <div className="text-right">
                    <p className="text-sm font-medium">{category._count.id} transactions</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(category._sum.finalAmount || 0), currency)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
            <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No category data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue vs Cost Analysis */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Revenue vs Cost Analysis</h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gross Revenue</span>
                <span className="text-sm font-medium">
                  {data ? formatCurrency(data.revenue.grossRevenue, currency) : formatCurrency(0, currency)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ 
                  width: data && data.revenue.grossRevenue > 0 ? '100%' : '0%' 
                }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service Fees</span>
                <span className="text-sm font-medium">
                  {data ? formatCurrency(data.revenue.serviceFeeRevenue, currency) : formatCurrency(0, currency)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ 
                  width: data && data.revenue.grossRevenue > 0 
                    ? `${(data.revenue.serviceFeeRevenue / data.revenue.grossRevenue) * 100}%` 
                    : '0%' 
                }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Discounts</span>
                <span className="text-sm font-medium text-red-500">
                  -{data ? formatCurrency(data.revenue.totalDiscountGiven, currency) : formatCurrency(0, currency)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ 
                  width: data && data.revenue.grossRevenue > 0 
                    ? `${(data.revenue.totalDiscountGiven / data.revenue.grossRevenue) * 100}%` 
                    : '0%' 
                }}></div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Net Revenue</span>
                <span className="text-sm font-bold text-green-500">
                  {data ? formatCurrency(data.revenue.totalRevenue, currency) : formatCurrency(0, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Status Distribution */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transaction Status</h3>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Successful</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{data?.overview.completedTransactions || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {data && data.overview.totalTransactions > 0 
                    ? `${((data.overview.completedTransactions / data.overview.totalTransactions) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{data?.overview.pendingTransactions || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {data && data.overview.totalTransactions > 0 
                    ? `${((data.overview.pendingTransactions / data.overview.totalTransactions) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{data?.overview.failedTransactions || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {data && data.overview.totalTransactions > 0 
                    ? `${((data.overview.failedTransactions / data.overview.totalTransactions) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Success Rate</span>
                <span className={`text-sm font-bold ${
                  data && data.overview.conversionRate >= 70 ? 'text-green-500' : 
                  data && data.overview.conversionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {data ? `${data.overview.conversionRate.toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Performance Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Growth */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Customer Growth</h3>
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border border-white/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {data?.overview.totalActiveUsers || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Active Users</div>
            </div>
            <div className="text-center p-4 border border-white/10 rounded-lg">
              <div className="text-2xl font-bold text-green-500 mb-1">
                +{data?.overview.newUsers || 0}
              </div>
              <div className="text-sm text-muted-foreground">New Users {getPeriodLabel(period)}</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Customer Retention</span>
              <span className="text-sm font-bold">
                {data && data.overview.totalActiveUsers > 0 && data.overview.newUsers > 0
                  ? `${(((data.overview.totalActiveUsers - data.overview.newUsers) / data.overview.totalActiveUsers) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="glass-card rounded-xl p-6">          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Performance Metrics</h3>
            <Target className="h-6 w-6 text-purple-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Avg Processing Time</span>
              </div>
              <span className="text-sm font-bold">
                {data ? `${data.overview.avgProcessingTime} min` : '0 min'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Revenue Growth</span>
              </div>
              <span className={`text-sm font-bold ${
                data && data.overview.revenueGrowthRate >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data ? `${data.overview.revenueGrowthRate > 0 ? '+' : ''}${data.overview.revenueGrowthRate}%` : '0%'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Transaction Growth</span>
              </div>
              <span className={`text-sm font-bold ${
                data && data.overview.transactionGrowthRate >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {data ? `${data.overview.transactionGrowthRate > 0 ? '+' : ''}${data.overview.transactionGrowthRate}%` : '0%'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Avg Order Value</span>
              </div>
              <span className="text-sm font-bold">
                {data ? formatCurrency(data.revenue.avgOrderValue, currency) : formatCurrency(0, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">        {/* Payment Methods Breakdown */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Payment Methods</h3>
          <div className="space-y-4">
            {data?.paymentMethods && data.paymentMethods.length > 0 ? (
              data.paymentMethods.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${
                      index === 0 ? 'bg-brand-blue' : 
                      index === 1 ? 'bg-brand-red' : 
                      index === 2 ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm font-medium">{formatPaymentMethod(method.method)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(method.revenue, currency)}</p>
                    <p className="text-xs text-muted-foreground">{method.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No payment method data available</p>
                <p className="text-xs mt-2">All transactions use manual bank transfer</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Trends Chart */}
        <div className="glass-card rounded-xl p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Daily Revenue Trends</h3>
            <Badge variant="outline">{getPeriodLabel(period)}</Badge>
          </div>
          <div className="h-64 w-full">
            {data?.trends.daily && data.trends.daily.length > 0 ? (
              <div className="h-full flex items-end justify-between gap-2 px-4">
                {data.trends.daily.map((day, index) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-brand-blue to-brand-red rounded-t-sm"
                      style={{ 
                        height: `${Math.max((day.revenue / Math.max(...data.trends.daily.map(d => d.revenue))) * 100, 5)}%` 
                      }}
                    />
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium">{formatCurrency(day.revenue, currency)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(day.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full bg-gradient-to-r from-brand-blue/5 to-brand-red/5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Tidak ada data tren revenue</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products & Voucher Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-semibold">Top Products</h3>
          </div>
          <div className="p-0 max-h-96 overflow-y-auto">
            {data?.topProducts && data.topProducts.length > 0 ? (
              <div className="divide-y divide-white/10">
                {data.topProducts.map((product, index) => (
                  <div key={product.id} className="p-4 flex items-center justify-between hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-muted-foreground capitalize">{product.productType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.amount, product.currency)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(product.date).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data produk</p>
              </div>
            )}
          </div>
        </div>

        {/* Voucher Analytics */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Voucher Analytics</h3>
          <div className="space-y-6">
            <div className="text-center p-6 border border-white/10 rounded-lg">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full bg-brand-red/10">
                <Tag className="h-8 w-8 text-brand-red" />
              </div>
              <h4 className="text-2xl font-bold">{data?.vouchers.totalUsages || 0}</h4>
              <p className="text-sm text-muted-foreground">Total Penggunaan Voucher</p>
            </div>
            
            <div className="text-center p-6 border border-white/10 rounded-lg">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full bg-brand-blue/10">
                <DollarSign className="h-8 w-8 text-brand-blue" />
              </div>
              <h4 className="text-2xl font-bold">{data?.vouchers.formattedDiscount || formatCurrency(0, currency)}</h4>
              <p className="text-sm text-muted-foreground">Total Diskon Diberikan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-left">
                <th className="p-4 font-medium text-muted-foreground">ID</th>
                <th className="p-4 font-medium text-muted-foreground">Customer</th>
                <th className="p-4 font-medium text-muted-foreground">Item</th>
                <th className="p-4 font-medium text-muted-foreground">Amount</th>
                <th className="p-4 font-medium text-muted-foreground">Payment</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-white/5">
                    <td className="p-4 font-medium">#{transaction.id.slice(-8)}</td>
                    <td className="p-4">{transaction.customer || 'Anonymous'}</td>
                    <td className="p-4">{transaction.item}</td>
                    <td className="p-4 font-medium">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="p-4 capitalize">{formatPaymentMethod(transaction.paymentMethod)}</td>
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(transaction.status)}
                      >
                        {transaction.status === 'paid' ? 'Completed' : 
                        transaction.status === 'pending' ? 'Pending' : 'Failed'}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent transactions</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hourly Distribution Chart */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Hourly Transaction Distribution</h3>
          <BarChart3 className="h-6 w-6 text-blue-500" />
        </div>
        <div className="h-64 w-full">
          {data?.trends.hourly && data.trends.hourly.length > 0 ? (
            <div className="h-full flex items-end justify-between gap-1">
              {data.trends.hourly.map((hour) => (
                <div key={hour.hour} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-brand-blue to-brand-red rounded-t-sm min-h-[4px]"
                    style={{ 
                      height: `${Math.max((hour.count / Math.max(...data.trends.hourly.map(h => h.count))) * 100, 4)}%` 
                    }}
                  />
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium">{hour.count}</p>
                    <p className="text-xs text-muted-foreground">{hour.hour}:00</p>
                    <p className="text-xs text-muted-foreground">{hour.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full bg-gradient-to-r from-brand-blue/5 to-brand-red/5 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">Tidak ada data distribusi jam</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Users and Conversion Funnel */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Users */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Top Users</h3>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="p-0 max-h-96 overflow-y-auto">
            {data?.topUsers && data.topUsers.length > 0 ? (
              <div className="divide-y divide-white/10">
                {data.topUsers.map((user, index) => (
                  <div key={user.userId} className="p-4 flex items-center justify-between hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.name || 'Anonymous User'}</p>
                        <p className="text-sm text-muted-foreground">{user.transactionCount} transaksi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(user.totalRevenue, currency)}</p>
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data top users</p>
              </div>
            )}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Conversion Funnel</h3>
            <Target className="h-6 w-6 text-purple-500" />
          </div>
          <div className="space-y-4">
            {data?.conversionFunnel && data.conversionFunnel.length > 0 ? (
              data.conversionFunnel.map((stage, index) => (
                <div key={stage.status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${
                        stage.status === 'paid' ? 'bg-green-500' :
                        stage.status === 'pending' ? 'bg-yellow-500' :
                        stage.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm font-medium capitalize">
                        {stage.status === 'paid' ? 'Berhasil' :
                        stage.status === 'pending' ? 'Pending' :
                        stage.status === 'failed' ? 'Gagal' : stage.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{stage.count} transaksi</p>
                      <p className="text-xs text-muted-foreground">{stage.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stage.status === 'paid' ? 'bg-green-500' :
                        stage.status === 'pending' ? 'bg-yellow-500' :
                        stage.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data conversion funnel</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
