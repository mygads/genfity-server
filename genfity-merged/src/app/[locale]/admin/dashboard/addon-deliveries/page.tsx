"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SessionManager } from "@/lib/storage";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { 
  Package, 
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Edit,
  FileText,
  Calendar as CalendarIcon,
  Plus,
  Play,
  Loader2,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AddonCustomer {
  id: string;
  transactionId: string;
  customerId: string;
  addonDetails?: any;
  driveUrl?: string;
  fileAssets?: string;
  status: string; 
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  transaction?: {
    id: string;
    finalAmount: number;
    currency: string;
    status: string;
    createdAt: string;
    addonTransactions?: Array<{
      id: string;
      status: string;
      addon: {
        id: string;
        name_en: string;
        name_id: string;
        description_en?: string;
        description_id?: string;
        price_idr: number;
        price_usd: number;
      };
    }>;
  };  
}

interface EditFormData {
  driveUrl: string;
  fileAssets: string;
  status: string;
  notes: string;
}

export default function AddonCustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<AddonCustomer[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState<"date" | "customer" | "status">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selectedCustomer, setSelectedCustomer] = useState<AddonCustomer | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editForm, setEditForm] = useState<EditFormData>({
        driveUrl: "",
        fileAssets: "",
        status: "pending",
        notes: ""
    });
    const [saveLoading, setSaveLoading] = useState(false);
    const [deliveryActionLoading, setDeliveryActionLoading] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState<{
        total: number;
        pending: number;
        inProgress: number;
        delivered: number;
    } | null>(null);

    // Handle delivery status actions
    const handleMarkInProgress = async (customer: AddonCustomer) => {
        setDeliveryActionLoading(customer.id);
        try {
            const token = SessionManager.getToken();
            
            const response = await fetch(`/api/admin/products/addon-deliveries/${customer.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'in_progress' })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Status updated to in progress");
                await fetchCustomers();
            } else {
                toast.error(data.error || "Failed to update status");
                console.error("Error updating delivery status:", data.error);
            }
        } catch (error) {
            toast.error("Failed to update status");
            console.error("Error updating delivery status:", error);
        } finally {
            setDeliveryActionLoading(null);
        }
    };

    const handleMarkDelivered = async (customer: AddonCustomer) => {
        setDeliveryActionLoading(customer.id);
        try {
            const token = SessionManager.getToken();
            
            const response = await fetch(`/api/admin/products/addon-deliveries/${customer.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'delivered' })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Addon marked as delivered");
                await fetchCustomers();
            } else {
                toast.error(data.error || "Failed to mark as delivered");
                console.error("Error updating delivery status:", data.error);
            }
        } catch (error) {
            toast.error("Failed to mark as delivered");
            console.error("Error updating delivery status:", error);
        } finally {
            setDeliveryActionLoading(null);
        }
    };

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            // Get token for authentication
            const token = SessionManager.getToken();
            
            const response = await fetch("/api/admin/products/addon-deliveries", {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
        
            if (data.success) {
                setCustomers(data.data || []);
                setStats(data.stats || { total: 0, pending: 0, inProgress: 0, delivered: 0 });
            } else {
                toast.error(data.error || "Failed to fetch addon deliveries");
                console.error("Error fetching customers:", data.error);
            }
        } catch (error) {
            toast.error("Failed to fetch addon deliveries");
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleEdit = (customer: AddonCustomer) => {
        setSelectedCustomer(customer);
        setEditForm({
            driveUrl: customer.driveUrl || "",
            fileAssets: customer.fileAssets || "",
            status: customer.status,
            notes: customer.notes || ""
        });
        setIsEditMode(true);
        setIsDetailOpen(true);
    };

    const handleSave = async () => {
        if (!selectedCustomer) return;

        setSaveLoading(true);
        try {
            const token = SessionManager.getToken();
            
            const response = await fetch(`/api/admin/products/addon-deliveries/${selectedCustomer.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editForm),
            });

            const data = await response.json();
        
            if (data.success) {
                toast.success("Addon delivery updated successfully");
                await fetchCustomers();
                setIsDetailOpen(false);
                setIsEditMode(false);
                setSelectedCustomer(null);
            } else {
                toast.error(data.error || "Failed to update addon delivery");
                console.error("Error updating customer:", data.error);
            }
        } catch (error) {
            toast.error("Failed to update addon delivery");
            console.error("Error updating customer:", error);
        } finally {
            setSaveLoading(false);
        }
    };

    const viewDetail = (customer: AddonCustomer) => {
        setSelectedCustomer(customer);
        setIsEditMode(false);
        setIsDetailOpen(true);
    };

    // Filter and sort functions
    const handleSort = (field: "date" | "customer" | "status") => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    // Initial load
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Filter and sort customers
    const filteredCustomers = useMemo(() => {
        const filtered = customers.filter(customer => {
            const searchLower = search.toLowerCase();
            const matchesSearch = !search || 
                customer.customer?.name?.toLowerCase().includes(searchLower) ||
                customer.customer?.email?.toLowerCase().includes(searchLower) ||
                customer.transactionId.toLowerCase().includes(searchLower);
            
            const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case "date":
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case "customer":
                    const nameA = a.customer?.name || "";
                    const nameB = b.customer?.name || "";
                    comparison = nameA.localeCompare(nameB);
                    break;
                case "status":
                    comparison = a.status.localeCompare(b.status);
                    break;
            }
            
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return filtered;
    }, [customers, search, statusFilter, sortBy, sortOrder]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Delivered</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Addon Deliveries</h1>
          <p className="text-muted-foreground">
            Manage addon deliveries and track delivery status
          </p>
        </div>
        <Button onClick={fetchCustomers} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by customer name, email, or transaction ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Addon Deliveries</CardTitle>
          <CardDescription>
            List of all addon deliveries and their current status
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
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No deliveries found</h3>
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
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Addon Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Assets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {customer.customer?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {customer.customer?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {customer.transactionId.slice(-8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="max-w-xs">
                          {(() => {
                            try {
                              const details = JSON.parse(customer.addonDetails);
                              return (
                                <div className="space-y-1">
                                  {details.map((addon: any, index: number) => (
                                    <div key={index} className="text-xs">
                                      <span className="font-medium">{addon.addon?.name_en || 'Unknown Addon'}</span>
                                      <span className="text-gray-500"> (Qty: {addon.quantity})</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            } catch {
                              return <span className="text-gray-500">Invalid addon data</span>;
                            }
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="space-y-1">
                          {customer.driveUrl && (
                            <div>
                              <a
                                href={customer.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Drive URL
                              </a>
                            </div>
                          )}
                          {customer.fileAssets && (
                            <div className="text-xs text-gray-600">
                              <FileText className="w-3 h-3 inline mr-1" />
                              Assets Available
                            </div>
                          )}
                          {!customer.driveUrl && !customer.fileAssets && (
                            <span className="text-gray-400 text-xs">No assets</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(customer.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(customer)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Update Delivery
                            </DropdownMenuItem>
                            {customer.status !== 'delivered' && (
                              <DropdownMenuItem onClick={() => handleMarkDelivered(customer)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Delivered
                              </DropdownMenuItem>
                            )}
                            {customer.driveUrl && (
                              <DropdownMenuItem asChild>
                                <a href={customer.driveUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Drive
                                </a>
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

      {/* Customer Detail/Edit Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Addon Delivery" : "Addon Delivery Details"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="mt-1">{selectedCustomer.customer?.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1">{selectedCustomer.customer?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                  <p className="mt-1 font-mono text-sm">{selectedCustomer.transactionId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1">{getStatusBadge(selectedCustomer.status)}</p>
                </div>
              </div>

              {/* Addon Details */}
              {selectedCustomer.addonDetails && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">Addon Details</label>
                  <div className="mt-2">
                    {(() => {
                      try {
                        const details = JSON.parse(selectedCustomer.addonDetails);
                        return (
                          <div className="space-y-2">
                            {Array.isArray(details) ? details.map((addon: any, index: number) => (
                              <div key={index} className="text-sm">
                                <strong>{addon.name_en || addon.name}</strong>
                                {addon.description_en && <p className="text-gray-600">{addon.description_en}</p>}
                              </div>
                            )) : (
                              <pre className="text-sm text-gray-600">{JSON.stringify(details, null, 2)}</pre>
                            )}
                          </div>
                        );
                      } catch {
                        return <span className="text-gray-500">Invalid addon data</span>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Editable Fields */}
              {isEditMode ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="driveUrl">Drive URL</Label>
                    <Input
                      id="driveUrl"
                      value={editForm.driveUrl}
                      onChange={(e) => setEditForm({ ...editForm, driveUrl: e.target.value })}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fileAssets">File Assets (JSON)</Label>
                    <Textarea
                      id="fileAssets"
                      value={editForm.fileAssets}
                      onChange={(e) => setEditForm({ ...editForm, fileAssets: e.target.value })}
                      placeholder='{"files": [{"name": "addon.zip", "size": "1.2MB"}]}'
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Add delivery notes..."
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Drive URL</label>
                    <p className="mt-1">
                      {selectedCustomer.driveUrl ? (
                        <a 
                          href={selectedCustomer.driveUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          {selectedCustomer.driveUrl}
                        </a>
                      ) : (
                        <span className="text-gray-400">Not provided</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">File Assets</label>
                    <p className="mt-1">
                      {selectedCustomer.fileAssets ? (
                        <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                          {selectedCustomer.fileAssets}
                        </pre>
                      ) : (
                        <span className="text-gray-400">No file assets</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1">
                      {selectedCustomer.notes || <span className="text-gray-400">No notes</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            {isEditMode ? (
              <Button onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? "Saving..." : "Save Changes"}
              </Button>
            ) : (
              <Button onClick={() => setIsEditMode(true)}>
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
