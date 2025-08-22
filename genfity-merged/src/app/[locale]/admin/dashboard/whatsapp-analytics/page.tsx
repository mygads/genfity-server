"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Search,
  RefreshCw,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  TrendingUp,
  BarChart3,
  Send,
  XCircle
} from "lucide-react";
import { SessionManager } from '@/lib/storage';

interface UserAnalytics {
  userId: string;
  totalSent: number;
  totalFailed: number;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
}

interface RecentActivity {
  userId: string;
  totalMessagesSent: number;
  totalMessagesFailed: number;
  lastMessageSentAt: string;
  user: {
    name: string;
    email: string;
  } | null;
}

interface AnalyticsData {
  totalUsers: number;
  totalSessions: number;
  totalMessageStats: number;
  totalMessagesSent: number;
  totalMessagesFailed: number;
  sessionStats: Record<string, number>;
  topUsers: UserAnalytics[];
  recentActivity: RecentActivity[];
}

interface ApiResponse {
  success: boolean;
  data: AnalyticsData;
  error?: string;
}

export default function WhatsAppAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalSessions: 0,
    totalMessageStats: 0,
    totalMessagesSent: 0,
    totalMessagesFailed: 0,
    sessionStats: {},
    topUsers: [],
    recentActivity: []
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAnalytics | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch analytics data using the correct API endpoint
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        router.push('/signin');
        return;
      }
      
      const res = await fetch("/api/admin/whatsapp/analytics", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const data: ApiResponse = await res.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        console.error("Error fetching analytics:", data.error);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load and auto refresh effects
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto refresh functionality - more frequent like sessions page
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchAnalytics, 10000); // Refresh every 10 seconds for real-time monitoring
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchAnalytics]);

  // View user details
  const viewUserDetails = (user: UserAnalytics) => {
    setSelectedUser(user);
    setShowDetailDialog(true);
  };

  // Export function
  const exportAnalytics = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "User ID,User Name,User Email,Messages Sent,Messages Failed,Success Rate\n" +
      filteredTopUsers.map(u => {
        const successRate = u.totalSent > 0 ? ((u.totalSent / (u.totalSent + u.totalFailed)) * 100).toFixed(2) : '0';
        return `${u.userId},"${u.user?.name || 'Unknown'}","${u.user?.email || 'Unknown'}",${u.totalSent},${u.totalFailed},${successRate}%`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `whatsapp_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTopUsers = analytics.topUsers.filter(user => {
    const matchesSearch = (user.user?.name && user.user.name.toLowerCase().includes(search.toLowerCase())) || 
                         (user.user?.email && user.user.email.toLowerCase().includes(search.toLowerCase())) ||
                         (user.userId && user.userId.toLowerCase().includes(search.toLowerCase()));
    
    return matchesSearch;
  });

  const getSuccessRate = (sent: number, failed: number) => {
    const total = sent + failed;
    if (total === 0) return "0";
    return ((sent / total) * 100).toFixed(2);
  };

  const getSuccessRateBadge = (sent: number, failed: number) => {
    const rate = parseFloat(getSuccessRate(sent, failed));
    
    if (rate >= 90) {
      return (
        <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Excellent ({rate}%)
        </Badge>
      );
    } else if (rate >= 70) {
      return (
        <Badge className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700">
          <Clock className="w-3 h-3 mr-1" />
          Good ({rate}%)
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          Poor ({rate}%)
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Analytics</h1>
        <p className="text-muted-foreground">
          Monitor WhatsApp usage statistics and user activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{analytics.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Messages Sent</p>
                <p className="text-2xl font-bold text-green-600">{analytics.totalMessagesSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Messages Failed</p>
                <p className="text-2xl font-bold text-red-600">{analytics.totalMessagesFailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getSuccessRate(analytics.totalMessagesSent, analytics.totalMessagesFailed)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Status Overview */}
      {Object.keys(analytics.sessionStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Session Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.sessionStats).map(([status, count]) => (
                <div key={status} className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Users Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Users by Message Activity
              </CardTitle>
              <CardDescription>
                Users with highest WhatsApp message activity
              </CardDescription>
            </div>
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-64"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAnalytics}
                  disabled={loading}
                  className="whitespace-nowrap"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="whitespace-nowrap"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Auto Refresh
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAnalytics}
                  className="whitespace-nowrap"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Messages Sent</TableHead>
                <TableHead>Messages Failed</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTopUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {loading ? "Loading analytics..." : "No user activity found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTopUsers.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.user?.name || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">{user.user?.email || 'No email'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">{user.totalSent}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-600">{user.totalFailed}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSuccessRateBadge(user.totalSent, user.totalFailed)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewUserDetails(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity (Last 30 Days)
          </CardTitle>
          <CardDescription>
            Latest WhatsApp messaging activity from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Messages Sent</TableHead>
                <TableHead>Messages Failed</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No recent activity found
                  </TableCell>
                </TableRow>
              ) : (
                analytics.recentActivity.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{activity.user?.name || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">{activity.user?.email || 'No email'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{activity.totalMessagesSent}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{activity.totalMessagesFailed}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(activity.lastMessageSentAt).toLocaleDateString()} {new Date(activity.lastMessageSentAt).toLocaleTimeString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Analytics Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">User Name</p>
                    <p className="text-lg font-semibold">{selectedUser.user?.name || 'Unknown'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg font-semibold">{selectedUser.user?.email || 'No email'}</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Messages Sent</p>
                    <p className="text-2xl font-bold text-green-600">{selectedUser.totalSent}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Messages Failed</p>
                    <p className="text-2xl font-bold text-red-600">{selectedUser.totalFailed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {getSuccessRate(selectedUser.totalSent, selectedUser.totalFailed)}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
