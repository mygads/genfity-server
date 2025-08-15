"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Truck, 
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Download,
  Filter,
  Calendar,
  ArrowUpDown,
  User,
  Activity,
  Eye,
  Edit,
  Save,
  X,
  Globe,
  FolderOpen,
  FileText,
  Calendar as CalendarIcon,
  Plus,
  Play
} from "lucide-react";

interface PackageCustomer {
  id: string;
  transactionId: string;
  customerId: string;
  packageId?: string;
  addonId?: string;
  quantity: number;
  websiteUrl?: string;
  driveUrl?: string;
  textDescription?: string;
  domainName?: string;
  domainExpiredAt?: string;
  status: string; // Delivery status: pending, in_progress, delivered
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
    amount: number;
    currency: string;
    status: string; // Transaction status: created, pending, in_progress, success, cancelled
    productTransactions?: Array<{
      id: string;
      status: string; // TransactionProduct status: created, pending, in_progress, success, cancelled
      packageId?: string;
    }>;
  };  
  package?: {
    id: string;
    name_en: string;
    name_id: string;
    price_idr: number;
    price_usd: number;
  };  
  addon?: {
    id: string;
    name_en: string;
    name_id: string;
    price_idr: number;
    price_usd: number;
  };
}

interface EditFormData {
  quantity: number;
  websiteUrl: string;
  driveUrl: string;
  textDescription: string;
  domainName: string;
  domainExpiredAt: string;
  status: string;
  notes: string;
}

export default function PackageCustomersPage() {
    const [customers, setCustomers] = useState<PackageCustomer[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState<"date" | "customer" | "status">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selectedCustomer, setSelectedCustomer] = useState<PackageCustomer | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);    const [editForm, setEditForm] = useState<EditFormData>({
        quantity: 1,
        websiteUrl: "",
        driveUrl: "",
        textDescription: "",
        domainName: "",
        domainExpiredAt: "",
        status: "pending",
        notes: ""
    });
    const [saveLoading, setSaveLoading] = useState(false);
    const [deliveryActionLoading, setDeliveryActionLoading] = useState<string | null>(null);

    // Handle delivery status actions
    const handleMarkInProgress = async (customer: PackageCustomer) => {
        setDeliveryActionLoading(customer.id);
        try {
            const response = await fetch(`/api/package-customers/${customer.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'in_progress' })
            });

            const data = await response.json();

            if (data.success) {
                await fetchCustomers();
            } else {
                console.error("Error updating delivery status:", data.error);
            }
        } catch (error) {
            console.error("Error updating delivery status:", error);
        } finally {
            setDeliveryActionLoading(null);
        }
    };

    const handleMarkDelivered = async (customer: PackageCustomer) => {
        setDeliveryActionLoading(customer.id);
        try {
            const response = await fetch(`/api/package-customers/${customer.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'delivered' })
            });

            const data = await response.json();

            if (data.success) {
                await fetchCustomers();
            } else {
                console.error("Error updating delivery status:", data.error);
            }
        } catch (error) {
            console.error("Error updating delivery status:", error);
        } finally {
            setDeliveryActionLoading(null);
        }
    };

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        delivered: 0,
        domainsExpiringSoon: 0
    });

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
        const res = await fetch("/api/package-customers");
        const data = await res.json();
        
        if (data.success) {
            setCustomers(data.data || []);
            calculateStats(data.data || []);
        } else {
            console.error("Error fetching customers:", data.error);
        }
        } catch (error) {
        console.error("Error fetching customers:", error);
        } finally {
        setLoading(false);
        }
    }, []);

    function calculateStats(customers: PackageCustomer[]) {
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const stats = {
        total: customers.length,
        pending: customers.filter(c => c.status === 'pending').length,
        inProgress: customers.filter(c => c.status === 'in_progress').length,
        delivered: customers.filter(c => c.status === 'delivered').length,
        domainsExpiringSoon: customers.filter(c => {
            if (!c.domainExpiredAt) return false;
            const expireDate = new Date(c.domainExpiredAt);
            return expireDate <= nextMonth && expireDate > now;
        }).length
        };

        setStats(stats);
    }

    const handleEdit = (customer: PackageCustomer) => {
        setSelectedCustomer(customer);    setEditForm({
        quantity: customer.quantity || 1,
        websiteUrl: customer.websiteUrl || "",
        driveUrl: customer.driveUrl || "",
        textDescription: customer.textDescription || "",
        domainName: customer.domainName || "",
        domainExpiredAt: customer.domainExpiredAt ? customer.domainExpiredAt.split('T')[0] : "",
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
        const res = await fetch(`/api/package-customers/${selectedCustomer.id}`, {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            ...editForm,
            domainExpiredAt: editForm.domainExpiredAt ? new Date(editForm.domainExpiredAt).toISOString() : null
            }),
        });

        const data = await res.json();
        
        if (data.success) {
            await fetchCustomers();
            setIsDetailOpen(false);
            setIsEditMode(false);
            setSelectedCustomer(null);
        } else {
            console.error("Error updating customer:", data.error);
        }
        } catch (error) {
        console.error("Error updating customer:", error);
        } finally {
        setSaveLoading(false);
        }
    };

    const viewDetail = (customer: PackageCustomer) => {
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

    const getStatusBadge = (status: string) => {
        const statusConfig = {
        // Delivery statuses
        pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", label: "Pending" },
        in_progress: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "In Progress" },
        delivered: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Delivered" }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge className={config.color}>{config.label}</Badge>;
    };

    const getTransactionStatusBadge = (status: string) => {
        const statusConfig = {
        created: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300", label: "Created" },
        pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", label: "Pending Payment" },
        in_progress: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "Paid" },
        success: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Completed" },
        cancelled: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", label: "Cancelled" },
        expired: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", label: "Expired" }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.created;
        return <Badge className={config.color}>{config.label}</Badge>;
    };

    const getDomainExpiryBadge = (expiredAt?: string) => {
        if (!expiredAt) return null;
        
        const now = new Date();
        const expireDate = new Date(expiredAt);
        const daysUntilExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</Badge>;
        } else if (daysUntilExpiry <= 30) {
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
            Expires in {daysUntilExpiry} days
        </Badge>;
        } else if (daysUntilExpiry <= 90) {
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            Expires in {daysUntilExpiry} days
        </Badge>;
        }
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
    };

    // Initial load
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const filteredCustomers = customers
        .filter(customer => {
        const matchesSearch = customer.id.toLowerCase().includes(search.toLowerCase()) ||
                            customer.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
                            customer.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
                            customer.package?.name_en?.toLowerCase().includes(search.toLowerCase()) ||
                            customer.addon?.name_en?.toLowerCase().includes(search.toLowerCase()) ||
                            customer.domainName?.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || customer.status === statusFilter || 
                         statusFilter === "pending" && customer.status === "pending";
        
        // Date filtering
        let matchesDate = true;
        if (dateFilter !== "all") {
            const customerDate = new Date(customer.createdAt);
            const now = new Date();
            switch (dateFilter) {
            case "today":
                matchesDate = customerDate.toDateString() === now.toDateString();
                break;
            case "week":
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchesDate = customerDate >= weekAgo;
                break;
            case "month":
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                matchesDate = customerDate >= monthAgo;
                break;
            }
        }
        
        return matchesSearch && matchesStatus && matchesDate;
        })
        .sort((a, b) => {
        let aValue, bValue;
        switch (sortBy) {
            case "customer":
            aValue = a.customer?.name || a.customer?.email || "";
            bValue = b.customer?.name || b.customer?.email || "";
            break;
            case "status":
            aValue = a.status;
            bValue = b.status;
            break;
            default:
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        }
        
        if (sortOrder === "asc") {
            return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
        });

    return (
        <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Customers</h1>
            <p className="text-muted-foreground">
                Manage delivered products and customer deliverables
            </p>
            </div>
            <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={fetchCustomers}
                disabled={loading}
            >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Product</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
                </div>
            </CardContent>
            </Card>
            
            <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
                </div>
            </CardContent>
            </Card>
            
            <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
            </CardContent>
            </Card>
            
            <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Domains Expiring</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.domainsExpiringSoon}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
            </CardContent>
            </Card>
        </div>

        {/* Filters and Search */}
        <Card>
            <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                    placeholder="Search customers, domains, or products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    />
                </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending Delivery</SelectItem>
                    <SelectItem value="awaiting_delivery">Awaiting Delivery (Legacy)</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
                </Select>
                
                <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
                </Select>
            </div>
            </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
            <CardHeader>
            <CardTitle>Package Deliveries</CardTitle>
            <CardDescription>
                Found {filteredCustomers.length} deliveries
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                    <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort("date")}
                    >
                        <div className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="h-4 w-4" />
                        </div>
                    </th>
                    <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort("customer")}
                    >
                        <div className="flex items-center gap-1">
                        Customer
                        <ArrowUpDown className="h-4 w-4" />
                        </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Domain & Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Website URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Drive URL
                    </th>
                    <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSort("status")}
                    >
                        <div className="flex items-center gap-1">
                        Delivery Status
                        <ArrowUpDown className="h-4 w-4" />
                        </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                    </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                    <tr>
                        <td colSpan={9} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            Loading customers...
                        </div>
                        </td>
                    </tr>
                    ) : filteredCustomers.length === 0 ? (
                    <tr>
                        <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No customers found
                        </td>
                    </tr>
                    ) : (
                    filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(customer.createdAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                            })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {customer.customer?.name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                {customer.customer?.email}
                                </div>
                            </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-400" />
                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                {customer.package?.name_en || customer.addon?.name_en || 'Unknown Product'}
                            </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {customer.quantity || 1}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                            {customer.domainName && (
                                <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {customer.domainName}
                                </div>
                            )}
                            {customer.domainExpiredAt && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                Expires: {new Date(customer.domainExpiredAt).toLocaleDateString('id-ID')}
                                </div>
                            )}
                            {customer.domainExpiredAt && (
                                <div className="mt-1">
                                {getDomainExpiryBadge(customer.domainExpiredAt)}
                                </div>
                            )}
                            {!customer.domainName && (
                                <span className="text-gray-400">-</span>
                            )}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {customer.websiteUrl ? (
                            <div className="space-y-1">
                                <a 
                                    href={customer.websiteUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium block hover:underline"
                                    title={customer.websiteUrl}
                                >
                                <Globe className="inline h-4 w-4 mr-1" />
                                {customer.websiteUrl.length > 30 ? 
                                    `${customer.websiteUrl.substring(0, 30)}...` : 
                                    customer.websiteUrl
                                }
                                </a>
                            </div>
                            ) : (
                            <span className="text-gray-400">-</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            {customer.driveUrl ? (
                            <div className="space-y-1">
                                <a 
                                href={customer.driveUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium block hover:underline"
                                title={customer.driveUrl}
                                >
                                <FolderOpen className="inline h-4 w-4 mr-1" />
                                {customer.driveUrl.length > 30 ? 
                                    `${customer.driveUrl.substring(0, 30)}...` : 
                                    customer.driveUrl
                                }
                                </a>
                            </div>
                            ) : (
                            <span className="text-gray-400">-</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                            {/* Check if delivery record exists (transaction is in_progress) */}
                            {customer.transaction?.status === 'in_progress' || customer.transaction?.status === 'success' ? 
                                getStatusBadge(customer.status) :
                                <span className="text-gray-400">-</span>
                            }
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                            {/* Standard view/edit buttons */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewDetail(customer)}
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(customer)}
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                            </div>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
            </CardContent>
        </Card>
        {/* Detail/Edit Modal */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-2 border-gray-200 dark:border-gray-700 shadow-lg">
            <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <DialogTitle className="text-xl font-semibold">
                {isEditMode ? 'Edit Package Customer' : 'Package Customer Details'}
                </DialogTitle>
            </DialogHeader>
            
            {selectedCustomer && (
                <div className="space-y-6 pt-4">
                {/* Customer Info */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h3 className="text-lg font-medium mb-3 text-blue-800 dark:text-blue-300">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p>{selectedCustomer.customer?.name || 'Unknown'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p>{selectedCustomer.customer?.email || 'Unknown'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Product</label>
                        <p>{selectedCustomer.package?.name_en || selectedCustomer.addon?.name_en || 'Unknown Product'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Quantity</label>
                        {isEditMode ? (
                        <Input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 1})}
                            className="mt-1"
                        />
                        ) : (
                        <p>{selectedCustomer.quantity || 1}</p>
                        )}
                    </div>                    <div>
                        <label className="text-sm font-medium text-gray-500">Product Price</label>
                        <p>
                        {selectedCustomer.transaction?.currency === 'usd' 
                            ? `$${Number(
                                selectedCustomer.package?.price_usd || 
                                selectedCustomer.addon?.price_usd || 
                                0
                              ).toLocaleString()}` 
                            : `Rp ${Number(
                                selectedCustomer.package?.price_idr || 
                                selectedCustomer.addon?.price_idr || 
                                0
                              ).toLocaleString()}`
                        }
                        </p>
                    </div>
                    </div>
                </div>

                {/* Delivery Information */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <h3 className="text-lg font-medium mb-3 text-green-800 dark:text-green-300">Delivery Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                    <div>
                        <Label htmlFor="websiteUrl">Website URL</Label>
                        {isEditMode ? (
                        <Input
                            id="websiteUrl"
                            value={editForm.websiteUrl}
                            onChange={(e) => setEditForm({...editForm, websiteUrl: e.target.value})}
                            placeholder="https://example.com"
                        />
                        ) : (
                        <div className="mt-1">
                            {selectedCustomer.websiteUrl ? (
                            <a 
                                href={selectedCustomer.websiteUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                                <Globe className="h-4 w-4" />
                                {selectedCustomer.websiteUrl}
                            </a>
                            ) : (
                            <span className="text-gray-400">Not provided</span>
                            )}
                        </div>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="driveUrl">Drive URL (Design Files)</Label>
                        {isEditMode ? (
                        <Input
                            id="driveUrl"
                            value={editForm.driveUrl}
                            onChange={(e) => setEditForm({...editForm, driveUrl: e.target.value})}
                            placeholder="https://drive.google.com/..."
                        />
                        ) : (
                        <div className="mt-1">
                            {selectedCustomer.driveUrl ? (
                            <a 
                                href={selectedCustomer.driveUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                                <FolderOpen className="h-4 w-4" />
                                View Files
                            </a>
                            ) : (
                            <span className="text-gray-400">Not provided</span>
                            )}
                        </div>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="textDescription">Description</Label>
                        {isEditMode ? (
                        <Textarea
                            id="textDescription"
                            value={editForm.textDescription}
                            onChange={(e) => setEditForm({...editForm, textDescription: e.target.value})}
                            placeholder="Describe the deliverables..."
                            rows={4}
                        />
                        ) : (
                        <div className="mt-1">
                            {selectedCustomer.textDescription ? (
                            <p className="text-sm whitespace-pre-wrap">{selectedCustomer.textDescription}</p>
                            ) : (
                            <span className="text-gray-400">No description provided</span>
                            )}
                        </div>
                        )}
                    </div>
                    </div>
                </div>

                {/* Domain Management */}
                <div>
                    <h3 className="text-lg font-medium mb-3">Domain Management</h3>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="domainName">Domain Name</Label>
                        {isEditMode ? (
                        <Input
                            id="domainName"
                            value={editForm.domainName}
                            onChange={(e) => setEditForm({...editForm, domainName: e.target.value})}
                            placeholder="example.com"
                        />
                        ) : (
                        <p className="mt-1">{selectedCustomer.domainName || 'Not provided'}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="domainExpiredAt">Domain Expiration Date</Label>
                        {isEditMode ? (
                        <Input
                            id="domainExpiredAt"
                            type="date"
                            value={editForm.domainExpiredAt}
                            onChange={(e) => setEditForm({...editForm, domainExpiredAt: e.target.value})}
                        />
                        ) : (
                        <div className="mt-1">
                            {selectedCustomer.domainExpiredAt ? (
                            <div>
                                <p>{new Date(selectedCustomer.domainExpiredAt).toLocaleDateString('id-ID')}</p>
                                <div className="mt-1">
                                {getDomainExpiryBadge(selectedCustomer.domainExpiredAt)}
                                </div>
                            </div>
                            ) : (
                            <span className="text-gray-400">Not set</span>
                            )}
                        </div>
                        )}
                    </div>
                    </div>
                </div>              
                {/* Status */}
                <div>
                    <Label htmlFor="status">Delivery Status</Label>
                    {isEditMode ? (
                    <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                        <SelectTrigger>
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="pending">Pending Delivery</SelectItem>
                        <SelectItem value="awaiting_delivery">Awaiting Delivery (Legacy)</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                    </Select>
                    ) : (
                    <div className="mt-1 space-y-2">
                        <div>
                        <span className="text-sm font-medium text-gray-500 mr-2">Delivery:</span>
                        {getStatusBadge(selectedCustomer.status)}
                        </div>
                        {selectedCustomer.transaction && (
                        <div>
                            <span className="text-sm font-medium text-gray-500 mr-2">Transaction:</span>
                            {getTransactionStatusBadge(selectedCustomer.transaction.status)}
                        </div>
                        )}
                        {selectedCustomer.transaction?.productTransactions && selectedCustomer.transaction.productTransactions.length > 0 && (
                        <div>
                            <span className="text-sm font-medium text-gray-500 mr-2">Product Status:</span>
                            {getTransactionStatusBadge(selectedCustomer.transaction.productTransactions.find(pt => pt.packageId === selectedCustomer.packageId)?.status || 'created')}
                        </div>
                        )}
                    </div>
                    )}
                </div>

                {/* Notes */}
                <div>
                    <Label htmlFor="notes">Notes</Label>
                    {isEditMode ? (
                    <Textarea
                        id="notes"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        placeholder="Additional notes..."
                        rows={3}
                    />
                    ) : (
                    <div className="mt-1">
                        {selectedCustomer.notes ? (
                        <p className="text-sm whitespace-pre-wrap">{selectedCustomer.notes}</p>
                        ) : (
                        <span className="text-gray-400">No notes</span>
                        )}
                    </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                    {isEditMode ? (
                    <>
                        <Button
                        onClick={handleSave}
                        disabled={saveLoading}
                        >
                        <Save className="h-4 w-4 mr-2" />
                        {saveLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                        variant="outline"
                        onClick={() => setIsEditMode(false)}
                        >
                        Cancel
                        </Button>
                    </>
                    ) : (
                    <Button
                        variant="outline"
                        onClick={() => setIsEditMode(true)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    )}
                </div>
                </div>
            )}
            </DialogContent>
        </Dialog>
        </div>
    );
}
