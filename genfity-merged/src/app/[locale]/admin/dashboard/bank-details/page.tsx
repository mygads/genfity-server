'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Building2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SessionManager } from '@/lib/storage';

interface BankDetail {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode?: string;
  currency: 'idr' | 'usd';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BankDetailForm {
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode: string;
  currency: 'idr' | 'usd';
  isActive: boolean;
}

export default function BankDetailsPage() {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankDetail | null>(null);
  const [formData, setFormData] = useState<BankDetailForm>({
    bankName: '',
    accountNumber: '',
    accountName: '',
    swiftCode: '',
    currency: 'idr',
    isActive: true,
  });

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<{ id: string; bankName: string; accountNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      // Get token for authentication
      const token = SessionManager.getToken();
      
      const response = await fetch('/api/admin/bank-details', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setBankDetails(result.data);
      } else {
        toast.error(result.error || 'Failed to fetch bank details');
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
      toast.error('Error fetching bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      // Get token for authentication
      const token = SessionManager.getToken();
      
      const url = editingBank 
        ? `/api/admin/bank-details/${editingBank.id}`
        : '/api/admin/bank-details';
      
      const method = editingBank ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${editingBank ? 'update' : 'create'} bank detail`);
      }
      
      if (result.success) {
        toast.success(result.message || `Bank detail ${editingBank ? 'updated' : 'created'} successfully`);
        fetchBankDetails();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || `Failed to ${editingBank ? 'update' : 'save'} bank detail`);
      }
    } catch (error) {
      console.error('Error saving bank detail:', error);
      toast.error(error instanceof Error ? error.message : 'Error saving bank detail');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete - show confirmation dialog
  const handleDeleteClick = (bank: BankDetail) => {
    setBankToDelete({ 
      id: bank.id, 
      bankName: bank.bankName,
      accountNumber: bank.accountNumber 
    });
    setDeleteConfirmOpen(true);
  };

  // Actual delete operation
  const handleConfirmDelete = async () => {
    if (!bankToDelete) return;
    
    try {
      setIsDeleting(true);
      // Get token for authentication
      const token = SessionManager.getToken();
      
      const response = await fetch(`/api/admin/bank-details/${bankToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete bank detail');
      }
      
      if (result.success) {
        toast.success(`Bank detail "${bankToDelete.bankName}" deleted successfully`);
        fetchBankDetails();
        setDeleteConfirmOpen(false);
        setBankToDelete(null);
      } else {
        toast.error(result.error || 'Failed to delete bank detail');
      }
    } catch (error) {
      console.error('Error deleting bank detail:', error);
      toast.error(error instanceof Error ? error.message : 'Error deleting bank detail');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (bank: BankDetail) => {
    setEditingBank(bank);
    setFormData({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      swiftCode: bank.swiftCode || '',
      currency: bank.currency,
      isActive: bank.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBank(null);
    setFormData({
      bankName: '',
      accountNumber: '',
      accountName: '',
      swiftCode: '',
      currency: 'idr',
      isActive: true,
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-48">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bank Details</h1>
          <p className="text-muted-foreground">
            Manage bank account details for manual payments
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Bank Detail
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBank ? 'Edit Bank Detail' : 'Add New Bank Detail'}
              </DialogTitle>
              <DialogDescription>
                {editingBank 
                  ? 'Update the bank account information' 
                  : 'Add a new bank account for receiving payments'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., Bank Central Asia"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g., 1234567890"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., PT Genfity Indonesia"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
                <Input
                  id="swiftCode"
                  value={formData.swiftCode}
                  onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                  placeholder="e.g., CENAIDJA"
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value: 'idr' | 'usd') => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idr">IDR (Indonesian Rupiah)</SelectItem>
                    <SelectItem value="usd">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {editingBank ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingBank ? 'Update' : 'Create'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bankDetails.map((bank) => (
          <Card key={bank.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {bank.bankName}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant={bank.currency === 'idr' ? 'default' : 'secondary'}>
                    {bank.currency.toUpperCase()}
                  </Badge>
                  <Badge variant={bank.isActive ? 'default' : 'secondary'}>
                    {bank.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Account: {bank.accountNumber}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Account Name</p>
                  <p className="text-sm text-muted-foreground">{bank.accountName}</p>
                </div>
                {bank.swiftCode && (
                  <div>
                    <p className="text-sm font-medium">SWIFT Code</p>
                    <p className="text-sm text-muted-foreground">{bank.swiftCode}</p>
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(bank)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(bank)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bankDetails.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bank Details</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven&apos;t added any bank details yet. Add one to start receiving manual payments.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Bank Detail
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the bank detail for{' '}
              <span className="font-semibold text-foreground">
                {bankToDelete?.bankName}
              </span>
              {' '}({bankToDelete?.accountNumber})?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">This action cannot be undone.</p>
                <p className="mt-1">
                  The bank detail will be permanently removed and cannot be used for future payments.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setBankToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Bank Detail
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
