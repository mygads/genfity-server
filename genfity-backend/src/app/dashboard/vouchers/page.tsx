"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Tag, Calendar, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CreateVoucherDialog from "./components/CreateVoucherDialog"
import EditVoucherDialog from "./components/EditVoucherDialog"
import VoucherDetailsDialog from "./components/VoucherDetailsDialog"

interface Voucher {
  id: string
  code: string
  name: string
  description: string
  type: "total" | "products" | "addons" | "whatsapp"
  discountType: "percentage" | "fixed_amount"
  value: number
  minAmount: number | null
  maxDiscount: number | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  allowMultipleUsePerUser: boolean
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
}

interface VoucherStats {
  totalVouchers: number
  activeVouchers: number
  totalUsages: number
  totalDiscountGiven: number
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [stats, setStats] = useState<VoucherStats>({
    totalVouchers: 0,
    activeVouchers: 0,
    totalUsages: 0,
    totalDiscountGiven: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  
  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
      })

      const response = await fetch(`/api/admin/vouchers?${params}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setVouchers(result.data.vouchers || [])
          setTotalPages(result.data.pagination?.totalPages || 1)
        } else {
          console.error("API response error:", result)
          setVouchers([])
          setTotalPages(1)
        }      } else {
        console.error("HTTP error:", response.status)
        setVouchers([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error)
      setVouchers([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter])
  
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/vouchers/stats")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const data = result.data
          
          // Also get total voucher counts from main vouchers API
          const vouchersResponse = await fetch("/api/admin/vouchers?limit=1000")
          let totalVouchersCount = 0
          let activeVouchersCount = 0
          
          if (vouchersResponse.ok) {
            const vouchersResult = await vouchersResponse.json()
            if (vouchersResult.success && vouchersResult.data) {
              const allVouchers = vouchersResult.data.vouchers || []
              totalVouchersCount = allVouchers.length
              activeVouchersCount = allVouchers.filter((v: any) => v.isActive).length
            }
          }
          
          setStats({
            totalVouchers: totalVouchersCount,
            activeVouchers: activeVouchersCount,
            totalUsages: data.totalUsage?.count || 0,
            totalDiscountGiven: data.totalUsage?.totalDiscount || 0
          })
        } else {
          console.error("Stats API response error:", result)
        }
      } else {
        console.error("Stats HTTP error:", response.status)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }
  useEffect(() => {
    fetchVouchers()
  }, [fetchVouchers])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleDelete = async (voucherId: string) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return

    try {
      const response = await fetch(`/api/admin/vouchers/${voucherId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchVouchers()
        fetchStats()
      } else {
        const error = await response.json()
        alert(error.message || "Failed to delete voucher")
      }
    } catch (error) {
      console.error("Error deleting voucher:", error)
      alert("Failed to delete voucher")
    }
  }

  const handleVoucherCreated = () => {
    fetchVouchers()
    fetchStats()
    setCreateDialogOpen(false)
  }

  const handleVoucherUpdated = () => {
    fetchVouchers()
    fetchStats()
    setEditDialogOpen(false)
    setSelectedVoucher(null)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "total": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "products": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "addons": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "whatsapp": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getDiscountText = (voucher: Voucher) => {
    if (voucher.discountType === "percentage") {
      return `${voucher.value}%`
    } else {
      return `Rp ${voucher.value.toLocaleString()}`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voucher Management</h1>
          <p className="text-muted-foreground">
            Create and manage discount vouchers for your products and services
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Voucher
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vouchers</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVouchers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vouchers</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVouchers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discount Given</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.totalDiscountGiven.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search vouchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="total">Total Discount</SelectItem>
            <SelectItem value="products">Product Discount</SelectItem>
            <SelectItem value="addons">Addon Discount</SelectItem>
            <SelectItem value="whatsapp">WhatsApp Service</SelectItem>
          </SelectContent>
        </Select>
      </div>      {/* Vouchers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading vouchers...
                </TableCell>
              </TableRow>
            ) : !vouchers || vouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No vouchers found
                </TableCell>
              </TableRow>
            ) : (
              vouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="font-mono font-medium">
                    {voucher.code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{voucher.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {voucher.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(voucher.type)}>
                      {voucher.type.charAt(0).toUpperCase() + voucher.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {getDiscountText(voucher)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {voucher.usedCount}
                      {voucher.maxUses ? ` / ${voucher.maxUses}` : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={voucher.isActive ? "default" : "secondary"}>
                      {voucher.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {voucher.endDate ? formatDate(voucher.endDate) : "No expiry"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedVoucher(voucher)
                            setDetailsDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedVoucher(voucher)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(voucher.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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

      {/* Dialogs */}
      <CreateVoucherDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleVoucherCreated}
      />

      {selectedVoucher && (
        <>
          <EditVoucherDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            voucher={selectedVoucher}
            onSuccess={handleVoucherUpdated}
          />
          <VoucherDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            voucher={selectedVoucher}
          />
        </>
      )}
    </div>
  )
}