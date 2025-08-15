"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Tag, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Percent,
  DollarSign
} from "lucide-react"

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
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
}

interface VoucherDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucher: Voucher
}

interface VoucherUsage {
  id: string
  userId: string
  discountAmount: number
  createdAt: string
  user: {
    name: string
    email: string
  }
  transaction: {
    id: string
    amount: number
    originalAmount: number
  }
}

export default function VoucherDetailsDialog({
  open,
  onOpenChange,
  voucher
}: VoucherDetailsDialogProps) {
  const [usageHistory, setUsageHistory] = useState<VoucherUsage[]>([])
  const [loading, setLoading] = useState(false)
  const fetchUsageHistory = useCallback(async () => {
    if (!voucher) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/vouchers/${voucher.id}/usage`)
      if (response.ok) {
        const data = await response.json()
        setUsageHistory(data.usage || [])
      }
    } catch (error) {
      console.error("Error fetching usage history:", error)
    } finally {
      setLoading(false)
    }
  }, [voucher])

  useEffect(() => {
    if (open && voucher) {
      fetchUsageHistory()
    }
  }, [open, voucher, fetchUsageHistory])

  const getTypeColor = (type: string) => {
    switch (type) {
      case "total": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "products": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "addons": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "whatsapp": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "total": return "Total Discount"
      case "products": return "Product Discount"
      case "addons": return "Addon Discount"
      case "whatsapp": return "WhatsApp Service"
      default: return type
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
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const totalDiscountGiven = usageHistory.reduce((total, usage) => total + usage.discountAmount, 0)
  const usagePercentage = voucher.maxUses ? (voucher.usedCount / voucher.maxUses) * 100 : 0

  const isExpired = voucher.endDate ? new Date(voucher.endDate) < new Date() : false
  const isNotStarted = new Date(voucher.startDate) > new Date()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Voucher Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about voucher {voucher.code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{voucher.name}</span>
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(voucher.type)}>
                    {getTypeLabel(voucher.type)}
                  </Badge>
                  <Badge variant={voucher.isActive ? "default" : "secondary"}>
                    {voucher.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {isExpired && (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                  {isNotStarted && (
                    <Badge variant="outline">Not Started</Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>{voucher.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Voucher Code</p>
                  <p className="font-mono font-bold text-lg">{voucher.code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Discount Value</p>
                  <div className="flex items-center gap-2">
                    {voucher.discountType === "percentage" ? (
                      <Percent className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="font-semibold text-lg">{getDiscountText(voucher)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Usage</p>
                  <p className="font-semibold text-lg">
                    {voucher.usedCount}
                    {voucher.maxUses ? ` / ${voucher.maxUses}` : ""}
                  </p>
                  {voucher.maxUses && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Discount Given</p>
                  <p className="font-semibold text-lg">Rp {totalDiscountGiven.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle>Restrictions & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Minimum Order Amount</p>
                  <p className="font-medium">
                    {voucher.minAmount ? `Rp ${voucher.minAmount.toLocaleString()}` : "No minimum"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Maximum Discount</p>
                  <p className="font-medium">
                    {voucher.maxDiscount ? `Rp ${voucher.maxDiscount.toLocaleString()}` : "No limit"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Maximum Uses</p>
                  <p className="font-medium">
                    {voucher.maxUses ? voucher.maxUses.toLocaleString() : "Unlimited"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validity Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDateOnly(voucher.startDate)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {voucher.endDate ? formatDateOnly(voucher.endDate) : "No expiry"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    {isExpired ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 font-medium">Expired</span>
                      </>
                    ) : isNotStarted ? (
                      <>
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-orange-600 font-medium">Not Started</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 font-medium">Valid</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="font-medium">{formatDate(voucher.createdAt)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(voucher.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usage History
              </CardTitle>
              <CardDescription>
                Recent transactions where this voucher was used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading usage history...</p>
                </div>
              ) : usageHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No usage history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usageHistory.slice(0, 10).map((usage, index) => (                <div key={usage.id}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{usage.user?.name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{usage.user?.email || 'No email'}</p>
                          <p className="text-xs text-muted-foreground">
                            Transaction: {usage.transaction?.id || 'N/A'}
                          </p>
                        </div>                        <div className="text-right space-y-1">
                          <p className="font-medium">Rp {usage.discountAmount?.toLocaleString() || '0'}</p>
                          <p className="text-sm text-muted-foreground">
                            Total: Rp {usage.transaction?.amount?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(usage.createdAt)}
                          </p>
                        </div>
                      </div>
                      {index < usageHistory.length - 1 && index < 9 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                  {usageHistory.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-4">
                      And {usageHistory.length - 10} more usage(s)...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
