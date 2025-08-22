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
  Users, 
  CreditCard, 
  Search,
  RefreshCw,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Eye,
  Settings,
  Calendar
} from "lucide-react";
import { SessionManager } from '@/lib/storage';

interface Subscription {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  package: {
    id: string;
    name: string;
    description?: string;
    maxSession: number;
    priceMonth: number;
    priceYear: number;
  };
  expiredAt: string;
  createdAt: string;
  isActive: boolean;
  daysUntilExpiry: number;
  currentSessions: number;
  maxSessions: number;
  sessionUtilization: number;
}

interface Stats {
  active: number;
  expired: number;
  total: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    subscriptions: Subscription[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    statistics: Stats;
  };
  error?: string;
}

export default function WhatsAppSubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({ active: 0, expired: 0, total: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch subscriptions data using the correct API endpoint
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        router.push('/signin');
        return;
      }
      
      const res = await fetch("/api/admin/whatsapp/subscriptions", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const data: ApiResponse = await res.json();
      
      if (data.success) {
        setSubscriptions(data.data.subscriptions || []);
        setStats(data.data.statistics || { active: 0, expired: 0, total: 0 });
      } else {
        console.error("Error fetching subscriptions:", data.error);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load and auto refresh effects
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Auto refresh functionality - more frequent like sessions page
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchSubscriptions, 10000); // Refresh every 10 seconds for real-time monitoring
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchSubscriptions]);

  // View subscription details
  const viewSubscriptionDetails = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDetailDialog(true);
  };

  // Export function
  const exportSubscriptions = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Subscription ID,User ID,User Name,User Email,Package,Expired At,Days Until Expiry,Current Sessions,Max Sessions,Session Utilization\n" +
      filteredSubscriptions.map(s => 
        `${s.id},"${s.user?.name || 'Unknown'}","${s.user?.email || 'Unknown'}","${s.package?.name || 'Unknown'}",${s.expiredAt},${s.daysUntilExpiry},${s.currentSessions},${s.maxSessions},${s.sessionUtilization}%`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `whatsapp_subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = (subscription.user?.name && subscription.user.name.toLowerCase().includes(search.toLowerCase())) || 
                         (subscription.user?.email && subscription.user.email.toLowerCase().includes(search.toLowerCase())) ||
                         (subscription.package?.name && subscription.package.name.toLowerCase().includes(search.toLowerCase())) ||
                         (subscription.id && subscription.id.toLowerCase().includes(search.toLowerCase()));
    
    // Filter by status
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        matchesStatus = subscription.isActive;
      } else if (statusFilter === "expired") {
        matchesStatus = !subscription.isActive;
      } else if (statusFilter === "expiring") {
        matchesStatus = subscription.isActive && subscription.daysUntilExpiry <= 7;
      }
    }
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getStatusBadge = (subscription: Subscription) => {
    if (!subscription.isActive) {
      return (
        <Badge className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    } else if (subscription.daysUntilExpiry <= 7) {
      return (
        <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700">
          <Clock className="w-3 h-3 mr-1" />
          Expiring Soon
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
  };  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage customer WhatsApp API subscriptions and services
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Active Subscriptions</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Expired</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Subscriptions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Expiring Soon</p>
                <p className="text-2xl font-bold">
                  {filteredSubscriptions.filter(s => s.isActive && s.daysUntilExpiry <= 7).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Monitor and manage customer subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportSubscriptions}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Subscriptions Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading subscriptions...</span>
              </div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">No subscriptions found matching your criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{subscription.user?.name || 'Unknown User'}</div>
                        <div className="text-xs text-muted-foreground">{subscription.user?.email || 'No email'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{subscription.package?.name || 'Unknown Package'}</div>
                        <div className="text-xs text-muted-foreground">
                          Max {subscription.package?.maxSession || 0} sessions
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {subscription.currentSessions} / {subscription.maxSessions}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {subscription.sessionUtilization}% utilized
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{new Date(subscription.expiredAt).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {subscription.isActive 
                            ? `${subscription.daysUntilExpiry} days left` 
                            : 'Expired'
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(subscription.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewSubscriptionDetails(subscription)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Footer Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredSubscriptions.length}</strong> of <strong>{subscriptions.length}</strong> subscriptions
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-muted-foreground">
                Active: <span className="font-semibold text-green-600">
                  {stats.active}
                </span>
              </div>
              <div className="text-muted-foreground">
                Expired: <span className="font-semibold text-red-600">
                  {stats.expired}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Subscription Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">{selectedSubscription.user?.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      <span className="font-medium">{selectedSubscription.user?.email || 'No email'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="font-medium">{selectedSubscription.user?.phone || 'No phone'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Package Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Package: </span>
                      <span className="font-medium">{selectedSubscription.package?.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Sessions: </span>
                      <span className="font-medium">{selectedSubscription.package?.maxSession || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Description: </span>
                      <span className="font-medium">{selectedSubscription.package?.description || 'No description'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Status */}
              <div>
                <h3 className="font-semibold mb-2">Subscription Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    {getStatusBadge(selectedSubscription)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Session Usage: </span>
                    <span className="font-medium">
                      {selectedSubscription.currentSessions} / {selectedSubscription.maxSessions} 
                      ({selectedSubscription.sessionUtilization}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created: </span>
                    <span className="font-medium">{new Date(selectedSubscription.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expires: </span>
                    <span className="font-medium">{new Date(selectedSubscription.expiredAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
