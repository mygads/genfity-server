"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { SessionManager } from "@/lib/storage"

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
  allowMultipleUsePerUser: boolean
  isActive: boolean
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
}

interface EditVoucherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucher: Voucher
  onSuccess: () => void
}

interface VoucherFormData {
  code: string
  name: string
  description: string
  type: "total" | "products" | "addons" | "whatsapp"
  discountType: "percentage" | "fixed_amount"
  value: number
  minAmount: number | null
  maxDiscount: number | null
  maxUses: number | null
  allowMultipleUsePerUser: boolean
  isActive: boolean
  startDate: Date
  endDate: Date | null
}

export default function EditVoucherDialog({
  open,
  onOpenChange,
  voucher,
  onSuccess
}: EditVoucherDialogProps) {  const [formData, setFormData] = useState<VoucherFormData>({
    code: "",
    name: "",
    description: "",
    type: "total",
    discountType: "percentage",
    value: 0,
    minAmount: null,
    maxDiscount: null,
    maxUses: null,
    allowMultipleUsePerUser: false,
    isActive: true,
    startDate: new Date(),
    endDate: null
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Initialize form data when voucher changes
  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code,
        name: voucher.name,
        description: voucher.description,
        type: voucher.type,
        discountType: voucher.discountType,
        value: voucher.value,
        minAmount: voucher.minAmount,
        maxDiscount: voucher.maxDiscount,
        maxUses: voucher.maxUses,
        allowMultipleUsePerUser: voucher.allowMultipleUsePerUser,
        isActive: voucher.isActive,
        startDate: new Date(voucher.startDate),
        endDate: voucher.endDate ? new Date(voucher.endDate) : null
      })
    }
  }, [voucher])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = "Voucher code is required"
    } else if (formData.code.length < 3) {
      newErrors.code = "Voucher code must be at least 3 characters"
    }

    if (!formData.name.trim()) {
      newErrors.name = "Voucher name is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (formData.value <= 0) {
      newErrors.value = "Value must be greater than 0"
    }

    if (formData.discountType === "percentage" && formData.value > 100) {
      newErrors.value = "Percentage cannot exceed 100%"
    }

    if (formData.minAmount !== null && formData.minAmount < 0) {
      newErrors.minAmount = "Minimum amount cannot be negative"
    }

    if (formData.maxDiscount !== null && formData.maxDiscount < 0) {
      newErrors.maxDiscount = "Maximum discount cannot be negative"
    }

    if (formData.maxUses !== null && formData.maxUses < 1) {
      newErrors.maxUses = "Maximum uses must be at least 1"
    }

    if (formData.maxUses !== null && formData.maxUses < voucher.usedCount) {
      newErrors.maxUses = `Maximum uses cannot be less than current usage (${voucher.usedCount})`
    }

    if (formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = "End date must be after start date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Get token for authentication
      const token = SessionManager.getToken()
      
      const response = await fetch(`/api/admin/voucher/${voucher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          minAmount: formData.minAmount || undefined,
          maxDiscount: formData.maxDiscount || undefined,
          maxUses: formData.maxUses || undefined,
          endDate: formData.endDate || undefined,
        }),
      })

      if (response.ok) {
        onSuccess()
        setErrors({})
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.message || "Failed to update voucher" })
        }
      }
    } catch (error) {
      console.error("Error updating voucher:", error)
      setErrors({ general: "Failed to update voucher" })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof VoucherFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Voucher</DialogTitle>
          <DialogDescription>
            Update the voucher details. Note that some changes may not apply to existing transactions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Voucher Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  className={errors.code ? "border-red-500" : ""}
                />
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Voucher Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter voucher name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter voucher description"
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Discount Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Voucher Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Total Discount</SelectItem>
                    <SelectItem value="products">Product Discount</SelectItem>
                    <SelectItem value="addons">Addon Discount</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={formData.discountType} onValueChange={(value: any) => handleInputChange("discountType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                Discount Value {formData.discountType === "percentage" ? "(%)" : "(Rp)"}
              </Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => handleInputChange("value", Number(e.target.value))}
                placeholder={formData.discountType === "percentage" ? "Enter percentage" : "Enter amount"}
                min="0"
                max={formData.discountType === "percentage" ? "100" : undefined}
                className={errors.value ? "border-red-500" : ""}
              />
              {errors.value && <p className="text-sm text-red-500">{errors.value}</p>}
            </div>
          </div>

          {/* Restrictions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Restrictions (Optional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum Order Amount (Rp)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={formData.minAmount || ""}
                  onChange={(e) => handleInputChange("minAmount", e.target.value ? Number(e.target.value) : null)}
                  placeholder="No minimum"
                  min="0"
                  className={errors.minAmount ? "border-red-500" : ""}
                />
                {errors.minAmount && <p className="text-sm text-red-500">{errors.minAmount}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Maximum Discount (Rp)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount || ""}
                  onChange={(e) => handleInputChange("maxDiscount", e.target.value ? Number(e.target.value) : null)}
                  placeholder="No maximum"
                  min="0"
                  className={errors.maxDiscount ? "border-red-500" : ""}
                />
                {errors.maxDiscount && <p className="text-sm text-red-500">{errors.maxDiscount}</p>}
              </div>
            </div>            <div className="space-y-2">
              <Label htmlFor="maxUses">Maximum Uses</Label>
              <Input
                id="maxUses"
                type="number"
                value={formData.maxUses || ""}
                onChange={(e) => handleInputChange("maxUses", e.target.value ? Number(e.target.value) : null)}
                placeholder="Unlimited uses"
                min={voucher.usedCount}
                className={errors.maxUses ? "border-red-500" : ""}
              />
              {errors.maxUses && <p className="text-sm text-red-500">{errors.maxUses}</p>}
              <p className="text-sm text-muted-foreground">
                Currently used: {voucher.usedCount} times
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allowMultipleUsePerUser"
                checked={formData.allowMultipleUsePerUser}
                onCheckedChange={(checked) => handleInputChange("allowMultipleUsePerUser", checked)}
              />
              <Label htmlFor="allowMultipleUsePerUser">Allow multiple use per user</Label>
              <p className="text-sm text-muted-foreground ml-2">
                When enabled, users can use this voucher multiple times
              </p>
            </div>
          </div>

          {/* Validity Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Validity Period</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => handleInputChange("startDate", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "No expiry"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate || undefined}
                      onSelect={(date) => handleInputChange("endDate", date)}
                      initialFocus
                      disabled={(date) => date <= formData.startDate}
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked)}
            />
            <Label htmlFor="isActive">Active voucher</Label>
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Voucher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
