"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Trash2, CreditCard, DollarSign, Percent, Shield } from 'lucide-react'
import { toast } from 'sonner'
import CreateServiceFeeDialog from './components/CreateServiceFeeDialog'
import EditServiceFeeDialog from './components/EditServiceFeeDialog'

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
  createdAt: string
  updatedAt: string
}

export default function ServiceFeesPage() {
  const [serviceFees, setServiceFees] = useState<ServiceFee[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<ServiceFee | null>(null)

  // Fetch service fees
  const fetchServiceFees = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/service-fees')
      if (!response.ok) throw new Error('Failed to fetch service fees')
      
      const data = await response.json()
      if (data.success) {
        setServiceFees(data.data)
      }
    } catch (error) {
      console.error('Error fetching service fees:', error)
      toast.error('Failed to load service fees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServiceFees()
  }, [fetchServiceFees])

  // Handle edit
  const handleEdit = useCallback((fee: ServiceFee) => {
    setEditingFee(fee)
    setIsEditOpen(true)
  }, [])

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this service fee?')) return

    try {
      const response = await fetch(`/api/admin/service-fees/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete service fee')

      const result = await response.json()
      if (result.success) {
        toast.success('Service fee deleted successfully')
        fetchServiceFees()
      }
    } catch (error) {
      console.error('Error deleting service fee:', error)
      toast.error('Failed to delete service fee')
    }
  }, [fetchServiceFees])

  // Handle successful create/edit
  const handleSuccess = useCallback(() => {
    fetchServiceFees()
  }, [fetchServiceFees])
  const formatCurrency = (amount: number, currency: 'idr' | 'usd' = 'idr') => {
    if (currency === 'usd') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(amount)
    } else {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading service fees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Fees</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage payment method service fees and charges
          </p>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service Fee
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Service Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceFees.length}</div>
            <p className="text-xs text-muted-foreground">
              {serviceFees.filter(fee => fee.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Percentage Fees</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceFees.filter(fee => fee.type === 'percentage').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Variable rate fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fixed Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceFees.filter(fee => fee.type === 'fixed_amount').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Fixed amount fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Fee Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceFees.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No service fees configured
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first service fee configuration.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service Fee
              </Button>
            </div>
          ) : (            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fee Structure</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Manual Approval</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <div className="font-medium">{fee.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {fee.paymentMethod.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={fee.type === 'percentage' ? 'default' : 'secondary'}>
                        {fee.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {fee.type === 'percentage' ? (
                          <div>
                            <div>{fee.value}%</div>
                            {(fee.minFee || fee.maxFee) && (
                              <div className="text-xs text-gray-500">
                                {fee.minFee && `Min: ${formatCurrency(fee.minFee, fee.currency)}`}
                                {fee.minFee && fee.maxFee && ' | '}
                                {fee.maxFee && `Max: ${formatCurrency(fee.maxFee, fee.currency)}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          formatCurrency(fee.value, fee.currency)
                        )}
                      </div>                    
                    </TableCell>
                    <TableCell>
                      <Badge variant={fee.isActive ? 'default' : 'secondary'}>
                        {fee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {fee.requiresManualApproval ? (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                          <Shield className="h-3 w-3" />
                          <span>Required</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Not Required
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(fee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(fee.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateServiceFeeDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleSuccess}
        existingFees={serviceFees}
      />

      {/* Edit Dialog */}
      {editingFee && (
        <EditServiceFeeDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={handleSuccess}
          serviceFee={editingFee}
          existingFees={serviceFees}
        />
      )}
    </div>
  )
}
