"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, 
  Search,
  RefreshCw,
  Truck,
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
  Eye,
  X,
  XCircle,
  Check,
  MoreHorizontal,
  Edit,
  ExternalLink,
  FileText,
  Upload
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddonDelivery {
  id: string;
  transactionId: string;
  customerId: string;
  addonDetails: string; // JSON string containing addon details
  driveUrl?: string;
  fileAssets?: string;
  status: string; // pending, in_progress, delivered
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name?: string;
    email?: string;
  };
  transaction: {
    id: string;
    finalAmount: number;
    currency: string;
    createdAt: string;
  };
}

interface AddonDeliveryStats {
  totalDeliveries: number;
  pendingDeliveries: number;
  inProgressDeliveries: number;
  completedDeliveries: number;
}

export default function AddonDeliveryPage() {
  const [deliveries, setDeliveries] = useState<AddonDelivery[]>([]);
  const [stats, setStats] = useState<AddonDeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState<AddonDelivery | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    driveUrl: "",
    fileAssets: "",
    notes: "",
    status: "pending"
  });

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchQuery,
        status: statusFilter
      });

      const response = await fetch(`/api/admin/addon-deliveries?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch addon deliveries');
      }

      const data = await response.json();
      setDeliveries(data.deliveries);
      setStats(data.stats);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (error) {
      console.error('Error fetching addon deliveries:', error);
      toast.error('Failed to load addon deliveries');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleUpdateDelivery = async () => {
    if (!selectedDelivery) return;

    try {
      const response = await fetch(`/api/admin/addon-deliveries/${selectedDelivery.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deliveryForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery');
      }

      toast.success('Delivery updated successfully');
      setDeliveryModalOpen(false);
      fetchDeliveries();
    } catch (error) {
      console.error('Error updating delivery:', error);
      toast.error('Failed to update delivery');
    }
  };

  const handleCompleteDelivery = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/complete-addons-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to complete delivery');
      }

      toast.success('Delivery completed successfully');
      fetchDeliveries();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error('Failed to complete delivery');
    }
  };

  const openDeliveryModal = (delivery: AddonDelivery) => {
    setSelectedDelivery(delivery);
    setDeliveryForm({
      driveUrl: delivery.driveUrl || "",
      fileAssets: delivery.fileAssets || "",
      notes: delivery.notes || "",
      status: delivery.status
    });
    setDeliveryModalOpen(true);
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Addon Delivery Management</h1>
          <p className="text-muted-foreground">
            Manage addon deliveries and track delivery status
          </p>
        </div>
        <Button onClick={fetchDeliveries} disabled={loading}>
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
              <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingDeliveries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgressDeliveries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedDeliveries}</div>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          ) : deliveries.length === 0 ? (
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
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {delivery.customer.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {delivery.customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {delivery.transactionId.slice(-8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="max-w-xs">
                          {(() => {
                            try {
                              const details = JSON.parse(delivery.addonDetails);
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
                          {delivery.driveUrl && (
                            <div>
                              <a
                                href={delivery.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Drive URL
                              </a>
                            </div>
                          )}
                          {delivery.fileAssets && (
                            <div className="text-xs text-gray-600">
                              <FileText className="w-3 h-3 inline mr-1" />
                              Assets Available
                            </div>
                          )}
                          {!delivery.driveUrl && !delivery.fileAssets && (
                            <span className="text-gray-400 text-xs">No assets</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(delivery.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(delivery.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDeliveryModal(delivery)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Update Delivery
                            </DropdownMenuItem>
                            {delivery.status !== 'delivered' && (
                              <DropdownMenuItem onClick={() => handleCompleteDelivery(delivery.transactionId)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Delivered
                              </DropdownMenuItem>
                            )}
                            {delivery.driveUrl && (
                              <DropdownMenuItem asChild>
                                <a href={delivery.driveUrl} target="_blank" rel="noopener noreferrer">
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

      {/* Update Delivery Modal */}
      <Dialog open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Addon Delivery</DialogTitle>
            <DialogDescription>
              Update delivery information and status for this addon order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="driveUrl">Drive URL</Label>
              <Input
                id="driveUrl"
                placeholder="Google Drive or file sharing URL"
                value={deliveryForm.driveUrl}
                onChange={(e) => setDeliveryForm(prev => ({ ...prev, driveUrl: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fileAssets">File Assets (JSON)</Label>
              <Textarea
                id="fileAssets"
                placeholder='{"files": [{"name": "addon.zip", "size": "1.2MB"}]}'
                value={deliveryForm.fileAssets}
                onChange={(e) => setDeliveryForm(prev => ({ ...prev, fileAssets: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Delivery Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any delivery notes or instructions..."
                value={deliveryForm.notes}
                onChange={(e) => setDeliveryForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={deliveryForm.status} onValueChange={(value) => setDeliveryForm(prev => ({ ...prev, status: value }))}>
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeliveryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateDelivery}>
              Update Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
