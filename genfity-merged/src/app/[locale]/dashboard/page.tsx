"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Activity, 
  CreditCard, 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Eye,
  MessageSquare,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
  Send,
  MessageCircle,
  Calendar,
  Loader2,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SimpleBarChart, SimpleDonutChart } from "@/components/ui/simple-charts"
import Link from "next/link"

// Dashboard data types
interface DashboardData {
  transactionSummary: {
    totalOverall: number;
    success: {
      total: number;
      product: number;
      whatsapp: number;
    };
    pending: {
      awaitingPayment: number;
      awaitingVerification: number;
    };
    failed: number;
  };
  whatsappSummary: {
    sessionQuota: {
      used: number;
      remaining: number;
      total: number;
    };
    messageStats: {
      sent: number;
      failed: number;
    };
    activeSessions: number;
    expiration: string | null;
  };
  recentHistory: {
    products: any[];
    whatsapp: any[];
  };
  productDeliveryLog: any[];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data && data.success && data.data) {
        setDashboardData(data.data)
        setLastRefresh(new Date())
        // Clear any previous errors
        setError(null)
      } else {
        setError(data?.error?.message || "Failed to fetch dashboard data")
      }
    } catch (err) {
      setError("Error loading dashboard data")
      console.error("Dashboard fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchData()
  }

  if (loading && !dashboardData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 bg-background">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here&#39;s what&#39;s happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>        
          </div>
      </div>

      {/* Development Mode Indicator */}
      {error && error.includes("development data") && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <AlertCircle className="h-4 w-4" />
            <span>Development Mode: Using mock data (backend API not available)</span>
          </div>
        </div>
      )}

      {/* Transaction Summary Stats Cards */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Transactions */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dashboardData?.transactionSummary.totalOverall || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time transactions
            </p>
          </CardContent>
        </Card>

        {/* Successful Transactions */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dashboardData?.transactionSummary.success.total || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{dashboardData?.transactionSummary.success.product || 0} Products</span>
              </div>
              <span className="mx-2">•</span>
              <div className="flex items-center gap-1">
                <FaWhatsapp className="h-3 w-3" />
                <span>{dashboardData?.transactionSummary.success.whatsapp || 0} WhatsApp</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {(dashboardData?.transactionSummary.pending.awaitingPayment || 0) + 
               (dashboardData?.transactionSummary.pending.awaitingVerification || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{dashboardData?.transactionSummary.pending.awaitingPayment || 0} Payment</span>
              <span className="mx-2">•</span>
              <span>{dashboardData?.transactionSummary.pending.awaitingVerification || 0} Verification</span>
            </div>
          </CardContent>
        </Card>

        {/* Failed Transactions */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {dashboardData?.transactionSummary.failed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Failed transactions
            </p>
          </CardContent>        </Card>
      </div>

      {/* Transaction Overview Charts */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">

        {/* Transaction Type Breakdown */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Transaction Types</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Product vs WhatsApp transactions
                </CardDescription>
              </div>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">              {dashboardData && (
                <SimpleBarChart
                  data={[
                    { 
                      label: 'Product', 
                      value: dashboardData.transactionSummary.success.product,
                      color: '#3b82f6' 
                    },
                    { 
                      label: 'WhatsApp', 
                      value: dashboardData.transactionSummary.success.whatsapp,
                      color: '#10b981' 
                    }
                  ]}
                />
              )}
              
              {/* Detailed Breakdown */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Product Transactions</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {dashboardData?.transactionSummary.success.product || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <FaWhatsapp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">WhatsApp Transactions</span>
                  </div>
                  <span className="text-lg font-bold text-green-900 dark:text-green-100">
                    {dashboardData?.transactionSummary.success.whatsapp || 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Summary and Recent Activity */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7">
        {/* WhatsApp Summary */}
        <Card className="col-span-1 lg:col-span-4 border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FaWhatsapp className="h-5 w-5 text-green-500" />
                  WhatsApp Services Overview
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Your WhatsApp API usage and statistics
                </CardDescription>
              </div>
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">              {/* Session Quota */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-foreground">Session Quota</h4>
                  <Zap className="h-4 w-4 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-medium">{dashboardData?.whatsappSummary.sessionQuota.used || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-green-600">{dashboardData?.whatsappSummary.sessionQuota.remaining || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{dashboardData?.whatsappSummary.sessionQuota.total || 0}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{
                        width: `${dashboardData?.whatsappSummary.sessionQuota.total 
                          ? (dashboardData.whatsappSummary.sessionQuota.used / dashboardData.whatsappSummary.sessionQuota.total) * 100 
                          : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground mt-1">
                    {dashboardData?.whatsappSummary.sessionQuota.total 
                      ? Math.round((dashboardData.whatsappSummary.sessionQuota.used / dashboardData.whatsappSummary.sessionQuota.total) * 100) 
                      : 0}% used
                  </div>
                </div>
              </div>

              {/* Message Statistics */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-foreground">Messages</h4>
                  <Send className="h-4 w-4 text-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sent</span>
                    <span className="font-medium text-green-600">{dashboardData?.whatsappSummary.messageStats.sent || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="font-medium text-red-600">{dashboardData?.whatsappSummary.messageStats.failed || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">
                      {dashboardData?.whatsappSummary.messageStats.sent && 
                       (dashboardData.whatsappSummary.messageStats.sent + dashboardData.whatsappSummary.messageStats.failed) > 0
                        ? `${Math.round((dashboardData.whatsappSummary.messageStats.sent / 
                           (dashboardData.whatsappSummary.messageStats.sent + dashboardData.whatsappSummary.messageStats.failed)) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sessions and Expiration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">Active Sessions</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    {dashboardData?.whatsappSummary.activeSessions || 0}
                  </p>
                </div>
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Plan Expiration</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {dashboardData?.whatsappSummary.expiration 
                      ? new Date(dashboardData.whatsappSummary.expiration).toLocaleDateString()
                      : 'No expiration'}
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent History */}
        <Card className="col-span-1 lg:col-span-3 border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Latest transactions and activities
                </CardDescription>
              </div>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>            <div className="space-y-4">
              {/* Products History */}
              {dashboardData?.recentHistory.products.map((item, index) => (
                <div key={`product-${item.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{item.packageName}</p>
                      {item.addonName && (
                        <p className="text-xs text-muted-foreground">Add-on: {item.addonName}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          Product
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.currency.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {item.currency.toUpperCase()} {parseInt(item.amount).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              {/* WhatsApp History */}
              {dashboardData?.recentHistory.whatsapp.map((item, index) => (
                <div key={`whatsapp-${item.id}`} className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <FaWhatsapp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{item.packageName}</p>
                      <p className="text-xs text-muted-foreground">Duration: {item.duration}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs bg-green-500">
                          WhatsApp
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.currency.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {item.currency.toUpperCase()} {parseInt(item.amount).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {(!dashboardData?.recentHistory.products.length && !dashboardData?.recentHistory.whatsapp.length) && (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground/70">Recent transactions will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>      {/* Product Delivery Log and Quick Actions */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Product Delivery Log */}
        <Card className="col-span-1 lg:col-span-4 border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Product Delivery Log</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Track your product deliveries and status
                </CardDescription>
              </div>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>            {dashboardData?.productDeliveryLog.length ? (
              <div className="space-y-4">
                {dashboardData.productDeliveryLog.map((delivery) => (
                  <div key={delivery.transactionId} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{delivery.packageName}</h4>
                        {delivery.addonName && (
                          <p className="text-sm text-muted-foreground">Add-on: {delivery.addonName}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={delivery.isDelivered ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {delivery.isDelivered ? 'Delivered' : 'Pending'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {delivery.currency.toUpperCase()} {parseInt(delivery.amount).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(delivery.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Order Date</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No deliveries</p>
                <p className="text-xs text-muted-foreground/70">Product deliveries will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>        {/* Quick Actions */}
        <div className="col-span-1 lg:col-span-3 space-y-4">
          <Link href="/dashboard/products">
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Browse Products</h3>
                      <p className="text-sm text-muted-foreground">Explore our product catalog</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/whatsapp">
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                      <FaWhatsapp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">WhatsApp Services</h3>
                      <p className="text-sm text-muted-foreground">Manage your WhatsApp API</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/transactions">
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">View Transactions</h3>
                      <p className="text-sm text-muted-foreground">Check your transaction history</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/analytics">
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                      <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Analytics</h3>
                      <p className="text-sm text-muted-foreground">View detailed reports</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
