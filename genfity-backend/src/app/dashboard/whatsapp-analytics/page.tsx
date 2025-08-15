"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  DollarSign,
  Activity,
  Clock,
  Zap,
  RefreshCw,
  Calendar,
  Filter,
  Target,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Crown,
  Award,
  Wifi,
  WifiOff,
  TrendingDown,
  AlertTriangle,
  Globe,
  MessageCircle,
  UserCheck
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TopUser {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  totalMessagesSent: number;
  totalMessagesFailed: number;
  totalMessages: number;
}

interface TopPackage {
  id: string;
  name: string;
  description: string | null;
  priceMonth: number;
  priceYear: number;
  maxSession: number;
  purchaseCount: number;
}

interface DailyStats {
  date: string;
  totalMessagesSent: number;
  totalMessagesFailed: number;
}

interface AnalyticsData {
  // Core messaging stats
  totalMessagesSent: number;
  totalMessagesFailed: number;
  totalMessages: number;
  topUsers: TopUser[];
  activeSessions: number;
  
  // Additional stats from dashboard
  totalSubscribers: number;
  totalWhatsAppUsers: number;
  totalUsers: number;
  totalRevenue: number;
  avgSessionDuration: number;
  overallSuccessRate: string;
  todayMessagesSent: number;
  todayMessagesFailed: number;
  todayTotalMessages: number;
  todaySuccessRate: string;
  topPackages: TopPackage[];
  metrics: {
    subscriberGrowthRate: string;
    messageVolumeGrowth: string;
    revenueGrowth: string;
  };
  
  // Daily stats for charts
  dailyStats: DailyStats[];
}

export default function WhatsAppAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch analytics data from the API
      const analyticsResponse = await fetch(`/api/admin/whatsapp/analytics?days=${timeRange}`);
      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const analyticsResult = await analyticsResponse.json();
      
      // Fetch dashboard data for additional metrics
      const dashboardResponse = await fetch('/api/admin/whatsapp/dashboard');
      if (!dashboardResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const dashboardResult = await dashboardResponse.json();
      
      // Combine the data
      setAnalytics({
        ...analyticsResult.data,
        ...dashboardResult.data,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const calculateSuccessRate = (sent: number, failed: number) => {
    const total = sent + failed;
    return total > 0 ? ((sent / total) * 100).toFixed(1) : '0.0';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600 dark:text-gray-300">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchAnalytics} className="bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            WhatsApp Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive insights into WhatsApp API service performance and messaging analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchAnalytics}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Messages */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(analytics.totalMessages)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {analytics.overallSuccessRate}% success
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatNumber(analytics.activeSessions)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Subscribers */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Subscribers</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(analytics.totalSubscribers)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    {analytics.metrics.subscriberGrowthRate}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(analytics.totalRevenue)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {analytics.metrics.revenueGrowth}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Performance */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
        <CardHeader className="border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-100">Today&apos;s Performance</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Real-time messaging statistics for today</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-3">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{formatNumber(analytics.todayMessagesSent)}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages Sent</p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-3">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatNumber(analytics.todayMessagesFailed)}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages Failed</p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-3">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.todaySuccessRate}%</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Message Trends */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-100">Daily Message Trends</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Message volume over time</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {analytics.dailyStats && analytics.dailyStats.length > 0 ? (
              <div className="space-y-4">
                {analytics.dailyStats.slice(0, 7).map((day, index) => {
                  const total = day.totalMessagesSent + day.totalMessagesFailed;
                  const maxTotal = Math.max(...analytics.dailyStats.map(d => d.totalMessagesSent + d.totalMessagesFailed));
                  return (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                        {new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex items-center gap-3 flex-1 mx-4">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${maxTotal > 0 ? (total / maxTotal) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="text-right min-w-0">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatNumber(total)}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {calculateSuccessRate(day.totalMessagesSent, day.totalMessagesFailed)}% success
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No daily data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
          <CardHeader className="border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-100">Top Active Users</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Users with highest message volume</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {analytics.topUsers && analytics.topUsers.length > 0 ? (
              <div className="space-y-4">
                {analytics.topUsers.slice(0, 5).map((userStat, index) => (
                  <div key={userStat.user.id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {userStat.user.name || userStat.user.email || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {calculateSuccessRate(userStat.totalMessagesSent, userStat.totalMessagesFailed)}% success rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(userStat.totalMessages)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">messages</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No user data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Packages */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
        <CardHeader className="border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-800 dark:text-gray-100">Top Performing Packages</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Most popular WhatsApp API packages</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {analytics.topPackages && analytics.topPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.topPackages.map((pkg, index) => (
                <div key={pkg.id} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{pkg.name}</h4>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{pkg.description}</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Purchases:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatNumber(pkg.purchaseCount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Price/Month:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(pkg.priceMonth)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max Sessions:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{pkg.maxSession}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No package data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit mx-auto mb-4">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{formatNumber(analytics.totalWhatsAppUsers)}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">WhatsApp Users</p>
            <Badge variant="outline" className="mt-2">
              {((analytics.totalWhatsAppUsers / analytics.totalUsers) * 100).toFixed(1)}% of total
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit mx-auto mb-4">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{analytics.avgSessionDuration}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Session Duration (min)</p>
            <Badge variant="outline" className="mt-2">
              Active tracking
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg dark:shadow-gray-900/20">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{analytics.metrics.messageVolumeGrowth}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Message Volume Growth</p>
            <Badge variant="outline" className="mt-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
              Monthly trend
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
