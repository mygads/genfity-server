"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'
import { SessionManager } from '@/lib/storage'

interface EditServiceFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  serviceFee: ServiceFee
  existingFees: ServiceFee[]
}

interface ServiceFee {
  id: string
  name: string
  paymentMethod: string
  currency: 'idr' | 'usd'
  type: 'percentage' | 'fixed_amount'
  value: number
  minFee?: number
  maxFee?: number
  isActive: boolean
  requiresManualApproval?: boolean
  paymentInstructions?: string
  instructionType?: string
  instructionImageUrl?: string
  createdAt: string
  updatedAt: string
}

interface ServiceFeeFormData {
  name: string
  paymentMethod: string
  currency: 'idr' | 'usd'
  type: 'percentage' | 'fixed_amount'
  value: string
  minFee: string
  maxFee: string
  isActive: boolean
  requiresManualApproval: boolean
  paymentInstructions: string
  instructionType: 'text' | 'image'
  instructionImageUrl: string
}

const paymentMethods = [
  { value: 'manual_bank_transfer', label: 'Manual Bank Transfer' },
  { value: 'va_bca', label: 'Virtual Account - BCA' },
  { value: 'va_mandiri', label: 'Virtual Account - Mandiri' },
  { value: 'va_bni', label: 'Virtual Account - BNI' },
  { value: 'va_bri', label: 'Virtual Account - BRI' },
  { value: 'va_permata', label: 'Virtual Account - Permata' },
  { value: 'va_cimb', label: 'Virtual Account - CIMB Niaga' },
  { value: 'qris', label: 'QRIS' },
  { value: 'card_domestic', label: 'Card Payment (Domestic)' },
  { value: 'card_international', label: 'Card Payment (International)' },
]

export default function EditServiceFeeDialog({
  open,
  onOpenChange,
  onSuccess,
  serviceFee,
  existingFees
}: EditServiceFeeDialogProps) {  const [formData, setFormData] = useState<ServiceFeeFormData>({
    name: '',
    paymentMethod: '',
    currency: 'idr',
    type: 'percentage',
    value: '',
    minFee: '',
    maxFee: '',
    isActive: true,
    requiresManualApproval: false,
    paymentInstructions: '',
    instructionType: 'text',
    instructionImageUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [instructionType, setInstructionType] = useState<'text' | 'image'>('text')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  useEffect(() => {
    if (serviceFee) {
      const currentInstructionType = serviceFee.instructionType === 'image' ? 'image' : 'text'
      
      setFormData({
        name: serviceFee.name,
        paymentMethod: serviceFee.paymentMethod,
        currency: serviceFee.currency,
        type: serviceFee.type,
        value: serviceFee.value.toString(),
        minFee: serviceFee.minFee?.toString() || '',
        maxFee: serviceFee.maxFee?.toString() || '',
        isActive: serviceFee.isActive,
        requiresManualApproval: serviceFee.requiresManualApproval || false,
        paymentInstructions: serviceFee.paymentInstructions || '',
        instructionType: currentInstructionType,
        instructionImageUrl: serviceFee.instructionImageUrl || '',
      })
      
      setInstructionType(currentInstructionType)
      
      // Set image preview if there's an existing image
      if (serviceFee.instructionImageUrl) {
        setImagePreview(serviceFee.instructionImageUrl)
      } else {
        setImagePreview(null)
      }
      setImageFile(null)
    }
  }, [serviceFee])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = 'Fee name is required'
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required'
    }
    if (!formData.currency) {
      newErrors.currency = 'Currency is required'
    }
    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'Value must be a positive number'
    }

    // Percentage validation
    if (formData.type === 'percentage' && parseFloat(formData.value) > 100) {
      newErrors.value = 'Percentage cannot exceed 100%'
    }

    // Fixed amount validation based on currency
    if (formData.type === 'fixed_amount') {
      const value = parseFloat(formData.value)
      if (formData.currency === 'idr' && value > 1000000) {
        newErrors.value = 'IDR fixed amount cannot exceed 1,000,000'
      }
      if (formData.currency === 'usd' && value > 1000) {
        newErrors.value = 'USD fixed amount cannot exceed 1,000'
      }
    }

    // Min/Max fee validation
    if (formData.minFee && formData.maxFee) {
      const minFee = parseFloat(formData.minFee)
      const maxFee = parseFloat(formData.maxFee)
      if (minFee >= maxFee) {
        newErrors.maxFee = 'Maximum fee must be greater than minimum fee'
      }
    }    // Payment instructions validation for manual bank transfer with manual approval
    if (formData.paymentMethod === 'manual_bank_transfer' && formData.requiresManualApproval) {
      if (instructionType === 'text' && !formData.paymentInstructions.trim()) {
        newErrors.paymentInstructions = 'Payment instructions are required for manual bank transfer with manual approval'
      }
      if (instructionType === 'image' && !imageFile && !imagePreview) {
        newErrors.paymentInstructions = 'Payment instruction image is required for manual bank transfer with manual approval'
      }
    }

    // Duplicate combination check (excluding current service fee)
    const existingCombo = existingFees.find(fee => 
      fee.paymentMethod === formData.paymentMethod && 
      fee.currency === formData.currency &&
      fee.id !== serviceFee.id
    )
    if (existingCombo) {
      newErrors.paymentMethod = `Service fee for ${formData.paymentMethod} (${formData.currency.toUpperCase()}) already exists`
    }

    // Payment method limit check (max 2 fees per method: 1 IDR + 1 USD, excluding current)
    const methodFees = existingFees.filter(fee => 
      fee.paymentMethod === formData.paymentMethod &&
      fee.id !== serviceFee.id
    )
    if (methodFees.length >= 2) {
      newErrors.paymentMethod = `Payment method ${formData.paymentMethod} already has maximum number of fees (1 IDR + 1 USD)`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting')
      return
    }
    
    setLoading(true)
    
    try {
      let imageUrl = formData.instructionImageUrl || ''
      
      // Upload image if instruction type is image and we have a new file
      if (instructionType === 'image' && imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)
        
        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SessionManager.getToken()}`,
          },
          body: uploadFormData,
        })
        
        const uploadResult = await uploadResponse.json()
        
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Failed to upload image')
        }
        
        imageUrl = uploadResult.imageUrl
      }

      const payload = {
        name: formData.name,
        paymentMethod: formData.paymentMethod,
        currency: formData.currency || 'idr',
        type: formData.type,
        value: parseFloat(formData.value),
        minFee: formData.minFee ? parseFloat(formData.minFee) : null,
        maxFee: formData.maxFee ? parseFloat(formData.maxFee) : null,
        isActive: formData.isActive,
        requiresManualApproval: formData.requiresManualApproval,
        paymentInstructions: instructionType === 'text' ? formData.paymentInstructions : '',
        instructionType: instructionType,
        instructionImageUrl: imageUrl,
      }

      const response = await fetch(`/api/admin/service-fees/${serviceFee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SessionManager.getToken()}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      
      if (!response.ok) {
        if (result.error) {
          if (Array.isArray(result.error)) {
            const errorMsg = result.error.map((err: any) => err.message).join(', ')
            throw new Error(errorMsg)
          } else {
            throw new Error(result.error)
          }
        }
        throw new Error('Failed to update service fee')
      }

      if (result.success) {
        toast.success('Service fee updated successfully')
        onSuccess()
        onOpenChange(false) // Auto close dialog
        setErrors({})
      }
    } catch (error) {
      console.error('Error updating service fee:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update service fee')    } finally {
      setLoading(false)
    }
  }
  
  const handleInputChange = (field: keyof ServiceFeeFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-set manual approval based on payment method
      if (field === 'paymentMethod') {
        if (value !== 'manual_bank_transfer') {
          newData.requiresManualApproval = false
        }
      }
      
      return newData
    })
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size must be less than 5MB')
        return
      }

      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    handleInputChange('instructionImageUrl', '')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Fee</DialogTitle>
          <DialogDescription>
            Update the service fee configuration. Changes will apply to new transactions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fee Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Credit Card Fee"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                >
                  <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.paymentMethod && (
                  <p className="text-sm text-red-500">{errors.paymentMethod}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select 
                  value={formData.currency || 'idr'} 
                  onValueChange={(value: 'idr' | 'usd') => handleInputChange('currency', value)}
                >
                  <SelectTrigger className={errors.currency ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idr">IDR (Indonesian Rupiah)</SelectItem>
                    <SelectItem value="usd">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-red-500">{errors.currency}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Fee Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'percentage' | 'fixed_amount') => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Fee Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Fee Configuration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="value">
                {formData.type === 'percentage' ? 'Percentage (%)' : `Amount (${(formData.currency || 'idr').toUpperCase()})`} *
              </Label>
              <Input
                id="value"
                type="number"
                step={formData.type === 'percentage' ? '0.01' : (formData.currency === 'usd' ? '0.01' : '1')}
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder={formData.type === 'percentage' ? '2.5' : (formData.currency === 'usd' ? '5.00' : '5000')}
                className={errors.value ? 'border-red-500' : ''}
              />
              {errors.value && (
                <p className="text-sm text-red-500">{errors.value}</p>
              )}
            </div>

            {formData.type === 'percentage' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minFee">Minimum Fee ({(formData.currency || 'idr').toUpperCase()})</Label>
                  <Input
                    id="minFee"
                    type="number"
                    step={formData.currency === 'usd' ? '0.01' : '1'}
                    value={formData.minFee}
                    onChange={(e) => handleInputChange('minFee', e.target.value)}
                    placeholder={formData.currency === 'usd' ? '0.30' : '1000'}
                    className={errors.minFee ? 'border-red-500' : ''}
                  />
                  {errors.minFee && (
                    <p className="text-sm text-red-500">{errors.minFee}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFee">Maximum Fee ({(formData.currency || 'idr').toUpperCase()})</Label>
                  <Input
                    id="maxFee"
                    type="number"
                    step={formData.currency === 'usd' ? '0.01' : '1'}
                    value={formData.maxFee}
                    onChange={(e) => handleInputChange('maxFee', e.target.value)}
                    placeholder={formData.currency === 'usd' ? '5.00' : '50000'}
                    className={errors.maxFee ? 'border-red-500' : ''}
                  />
                  {errors.maxFee && (
                    <p className="text-sm text-red-500">{errors.maxFee}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active</Label>            </div>
            
            {/* Manual Approval - Only show for manual bank transfer */}
            {formData.paymentMethod === 'manual_bank_transfer' && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requiresManualApproval"
                    checked={formData.requiresManualApproval}
                    onCheckedChange={(checked) => handleInputChange('requiresManualApproval', checked)}
                  />
                  <Label htmlFor="requiresManualApproval" className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Requires Manual Approval</span>
                  </Label>
                </div>
                {formData.requiresManualApproval && (
                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> Payments using this method will require manual admin approval before processing.
                    </p>
                  </div>
                )}
              </>
            )}{/* Payment Instructions - Show when manual bank transfer with manual approval */}
            {formData.paymentMethod === 'manual_bank_transfer' && formData.requiresManualApproval && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Instructions *</Label>
                  
                  {/* Toggle buttons for text vs image */}
                  <div className="flex space-x-2 mb-3">
                    <Button
                      type="button"
                      variant={instructionType === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setInstructionType('text')
                        handleInputChange('instructionType', 'text')
                        // Clear image data when switching to text
                        setImageFile(null)
                        if (!formData.instructionImageUrl) {
                          setImagePreview(null)
                        }
                        handleInputChange('instructionImageUrl', '')
                      }}
                    >
                      Text Instructions
                    </Button>
                    <Button
                      type="button"
                      variant={instructionType === 'image' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setInstructionType('image')
                        handleInputChange('instructionType', 'image')
                        // Clear text when switching to image
                        handleInputChange('paymentInstructions', '')
                        // Restore existing image preview if available
                        if (formData.instructionImageUrl && !imagePreview) {
                          setImagePreview(formData.instructionImageUrl)
                        }
                      }}
                    >
                      Image Upload
                    </Button>
                  </div>

                  {/* Text instructions input */}
                  {instructionType === 'text' && (
                    <div className="space-y-2">
                      <Textarea
                        id="paymentInstructions"
                        value={formData.paymentInstructions}
                        onChange={(e) => handleInputChange('paymentInstructions', e.target.value)}
                        placeholder="Enter payment instructions for customers (e.g., bank transfer details, account information, etc.)"
                        rows={4}
                        className={`resize-none ${errors.paymentInstructions ? 'border-red-500' : ''}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        These instructions will be shown to customers when making manual bank transfer payments.
                      </p>
                    </div>
                  )}

                  {/* Image upload input */}
                  {instructionType === 'image' && (
                    <div className="space-y-2">
                      <Input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className={errors.paymentInstructions ? 'border-red-500' : ''}
                      />
                      
                      {imagePreview && (
                        <div className="relative w-full h-32 rounded-md overflow-hidden border">
                          <Image 
                            src={imagePreview} 
                            alt="Payment instructions preview" 
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={removeImage}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Upload an image with payment instructions. Recommended size: 800x600px. Max file size: 5MB.
                      </p>
                    </div>
                  )}

                  {errors.paymentInstructions && (
                    <p className="text-sm text-red-500">{errors.paymentInstructions}</p>
                  )}
                </div>
              </div>
            )}
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
              {loading ? "Updating..." : "Update Service Fee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
