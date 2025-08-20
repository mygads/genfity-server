"use client"

import { useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
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
import { SessionManager } from "@/lib/storage"

interface CreateVoucherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

const initialFormData: VoucherFormData = {
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
}

export default function CreateVoucherDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateVoucherDialogProps) {
  const [formData, setFormData] = useState<VoucherFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code: result }))
  }

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
      
      const response = await fetch("/api/admin/voucher", {
        method: "POST",
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
        setFormData(initialFormData)
        setErrors({})
      } else {
        const error = await response.json()
        if (error.errors) {
          setErrors(error.errors)
        } else {
          setErrors({ general: error.message || "Failed to create voucher" })
        }
      }
    } catch (error) {
      console.error("Error creating voucher:", error)
      setErrors({ general: "Failed to create voucher" })
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
          <DialogTitle>Create New Voucher</DialogTitle>
          <DialogDescription>
            Create a new discount voucher for your products and services.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Voucher Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                    placeholder="Enter voucher code"
                    className={errors.code ? "border-red-500" : ""}
                  />
                  <Button type="button" variant="outline" onClick={generateVoucherCode}>
                    Generate
                  </Button>
                </div>
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
                min=""
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
                min="1"
                className={errors.maxUses ? "border-red-500" : ""}
              />
              {errors.maxUses && <p className="text-sm text-red-500">{errors.maxUses}</p>}
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
          </div>{/* Validity Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Validity Period</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col">
                <Label>Start Date</Label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date: Date | null) => handleInputChange("startDate", date || new Date())}
                  dateFormat="PPP"
                  className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  placeholderText="Select start date"
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>End Date (Optional)</Label>
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date: Date | null) => handleInputChange("endDate", date)}
                  dateFormat="PPP"
                  className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  placeholderText="No expiry"
                  minDate={formData.startDate}
                  isClearable
                />
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
              {loading ? "Creating..." : "Create Voucher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
