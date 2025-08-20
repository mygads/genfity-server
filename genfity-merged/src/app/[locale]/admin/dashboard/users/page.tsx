"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { 
  Users, 
  Search,
  RefreshCw,
  UserPlus,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  Download,
  Activity,
  UserCheck,
  UserX,
  X,
  Crown,
  Upload,
  Camera
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

interface UserStats {
  activeWhatsAppSessions: number;
  whatsappServices: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  emailVerified?: Date;
  phoneVerified?: Date;
  image?: string;
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'customer' | 'admin';
}

interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  verifiedUsers: number;
  recentRegistrations: number;
  activeUsers: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "email" | "createdAt" | "role">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Pagination
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  // Stats
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAdmins: 0,
    verifiedUsers: 0,
    recentRegistrations: 0,
    activeUsers: 0,
  });
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Upload states
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.data || []);
        setTotal(data.pagination?.total || 0);
        setHasMore(data.pagination?.hasMore || false);
        calculateStats(data.data || []);
      } else {
        toast.error("Failed to fetch users: " + data.error);
      }
    } catch (error) {
      toast.error("Error fetching users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, search, roleFilter]);
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users/stats');
      const data = await res.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        console.error("Failed to fetch stats:", data.error);
        if (data.error === "Admin access required") {
          toast.error("Please login as admin to view statistics");
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
    }
  }, []);

  function calculateStats(users: User[]) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count users with either email or phone verified
    const verifiedUsers = users.filter(u => u.emailVerified || u.phoneVerified).length;
    const recentRegistrations = users.filter(u => 
      new Date(u.createdAt) >= oneWeekAgo
    ).length;
    const activeUsers = users.filter(u => 
      u.stats.activeWhatsAppSessions > 0
    ).length;

    setStats({
      totalUsers: users.filter(u => u.role === 'customer').length,
      totalAdmins: users.filter(u => u.role === 'admin').length,
      verifiedUsers,
      recentRegistrations,
      activeUsers,
    });
  }
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleCreateUser = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();      if (data.success) {
        toast.success("User created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", email: "", phone: "", password: "", role: "customer" });
        fetchUsers();
        fetchStats(); // Refresh stats after creating user
      } else {
        toast.error("Failed to create user: " + (Array.isArray(data.error) ? data.error.map((e: any) => e.message).join(", ") : data.error));
      }
    } catch (error) {
      toast.error("Error creating user");
      console.error("Error creating user:", error);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;    try {
      const updateData: Partial<UserFormData> = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();      
      if (data.success) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({ name: "", email: "", phone: "", password: "", role: "customer" });
        fetchUsers();
        fetchStats(); // Refresh stats after updating user
      } else {
        toast.error("Failed to update user: " + (Array.isArray(data.error) ? data.error.map((e: any) => e.message).join(", ") : data.error));
      }
    } catch (error) {
      toast.error("Error updating user");
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();      if (data.success) {
        toast.success("User deleted successfully");
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
        fetchStats(); // Refresh stats after deleting user
      } else {
        toast.error("Failed to delete user: " + data.error);
      }
    } catch (error) {
      toast.error("Error deleting user");
      console.error("Error deleting user:", error);
    }
  };

  // Photo upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, and WebP are allowed");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File size too large. Maximum 5MB allowed");
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !selectedUser) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`/api/users/${selectedUser.id}/upload-profile`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success("Profile photo updated successfully");
        setShowUploadModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        fetchUsers();
        fetchStats();
      } else {
        toast.error("Failed to upload photo: " + data.error);
      }
    } catch (error) {
      toast.error("Error uploading photo");
      console.error("Error uploading photo:", error);
    } finally {
      setUploadLoading(false);
    }
  };

  const openUploadModal = (user: User) => {
    setSelectedUser(user);
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowUploadModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(search.toLowerCase()));
    
    return matchSearch;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "email":
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case "role":
        aValue = a.role;
        bValue = b.role;
        break;
      case "createdAt":
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
          <Crown className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
        <User className="w-3 h-3 mr-1" />
        Customer
      </Badge>
    );
  };  const getVerificationBadge = (emailVerified: boolean, phoneVerified: boolean) => {
    if (emailVerified && phoneVerified) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Fully Verified
        </Badge>
      );
    } else if (emailVerified) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
          <Mail className="w-3 h-3 mr-1" />
          Email Verified
        </Badge>
      );
    } else if (phoneVerified) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
          <Phone className="w-3 h-3 mr-1" />
          Phone Verified
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">
        <AlertCircle className="w-3 h-3 mr-1" />
        Unverified
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "", // Keep password empty for editing
      role: user.role,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openDetailModal = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };
  const exportUsers = () => {
    const csvContent = [
      ["ID", "Name", "Email", "Phone", "Role", "Email Verified", "Phone Verified", "Created", "WhatsApp Sessions", "Services"],
      ...sortedUsers.map(u => [
        u.id,
        u.name,
        u.email,
        u.phone || "",
        u.role,
        u.emailVerified ? "Yes" : "No",
        u.phoneVerified ? "Yes" : "No", 
        formatDate(u.createdAt),
        u.stats.activeWhatsAppSessions.toString(),
        u.stats.whatsappServices.toString(),
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportUsers} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button 
            onClick={fetchUsers} 
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalUsers}</p>
              </div>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Admins</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.totalAdmins}</p>
              </div>
              <Crown className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Verified</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.verifiedUsers}</p>
              </div>
              <UserCheck className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Recent (7d)</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.recentRegistrations}</p>
              </div>
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Active</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.activeUsers}</p>
              </div>
              <Activity className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy as any}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="role">Role</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users
          </CardTitle>
          <CardDescription>
            Showing {sortedUsers.length} of {total} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Activity</th>
                    <th className="text-left p-4 font-medium">Created</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <Image 
                              src={user.image} 
                              alt={user.name}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="p-4">
                        {getVerificationBadge(!!user.emailVerified, !!user.phoneVerified)}
                      </td>
                      <td className="p-4">
                        <div className="text-sm space-y-1">
                          <div>{user.stats.activeWhatsAppSessions} WA sessions</div>
                          <div>{user.stats.whatsappServices} services</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailModal(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openUploadModal(user)}>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Photo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive admin-created status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password (min 6 characters)"
              />
            </div>            
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password empty to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone (Optional)</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">New Password (Optional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave empty to keep current password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      {selectedUser && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Comprehensive information about the user
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Full Name
                  </Label>
                  <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {selectedUser.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    User ID
                  </Label>
                  <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {selectedUser.id}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Email
                  </Label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Phone
                  </Label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {selectedUser.phone || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Role
                  </Label>
                  <div className="mt-1">
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Verification Status
                  </Label>                  
                  <div className="mt-1 space-y-1">
                    {getVerificationBadge(!!selectedUser.emailVerified, !!selectedUser.phoneVerified)}
                  </div>
                </div>
              </div>
              {/* Activity Stats */}
              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Activity Statistics
                </Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{selectedUser.stats.activeWhatsAppSessions}</p>
                        <p className="text-xs text-gray-600">WA Sessions</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{selectedUser.stats.whatsappServices}</p>
                        <p className="text-xs text-gray-600">Services</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Created At
                  </Label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Last Updated
                  </Label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {formatDate(selectedUser.updatedAt)}
                  </p>
                </div>
              </div>

              {selectedUser.emailVerified && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Email Verified At
                  </Label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                    {formatDate(selectedUser.emailVerified.toString())}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowDetailModal(false);
                openEditModal(selectedUser);
              }}>
                Edit User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {selectedUser && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">                
                <div className="flex items-center gap-3">
                  {selectedUser.image ? (
                    <Image 
                      src={selectedUser.image} 
                      alt={selectedUser.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                    <div className="mt-1">
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Warning:</strong> This will permanently delete:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>User profile and account data</li>
                  <li>Associated transactions history</li>
                  <li>WhatsApp sessions and services</li>
                  <li>All related user data</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Photo Modal */}
      {selectedUser && (
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Profile Photo</DialogTitle>
              <DialogDescription>
                Update the profile photo for the user
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {previewUrl ? (
                <div className="mb-4">
                  <Image 
                    src={previewUrl} 
                    alt="Preview"
                    width={100}
                    height={100}
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-gray-500" />
                  </div>
                </div>
              )}
                <div className="grid gap-4">
                <div className="flex flex-col items-center">
                  <label htmlFor="file-upload" className="w-full">
                    <Button 
                      variant="outline" 
                      className="w-full cursor-pointer"
                      asChild
                    >
                      <span>Select Photo</span>
                    </Button>
                  </label>
                  <input 
                    id="file-upload"
                    type="file" 
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{selectedFile.name}</span>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadPhoto} 
                disabled={!selectedFile || uploadLoading}
                className="flex items-center gap-2"
              >
                {uploadLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {uploadLoading ? "Uploading..." : "Upload Photo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
