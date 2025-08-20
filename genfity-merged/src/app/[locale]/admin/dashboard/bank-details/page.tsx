'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';

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

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await fetch('/api/admin/bank-details');
      
      const result = await response.json();
      if (result.success) {
        setBankDetails(result.data);
      } else {
        toast.error('Failed to fetch bank details');
      }
    } catch (error) {
      toast.error('Error fetching bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingBank 
        ? `/api/admin/bank-details/${editingBank.id}`
        : '/api/admin/bank-details';
      
      const method = editingBank ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        fetchBankDetails();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || 'Failed to save bank detail');
      }
    } catch (error) {
      toast.error('Error saving bank detail');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank detail?')) return;
    
    try {
      const response = await fetch(`/api/admin/bank-details/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Bank detail deleted successfully');
        fetchBankDetails();
      } else {
        toast.error(result.error || 'Failed to delete bank detail');
      }
    } catch (error) {
      toast.error('Error deleting bank detail');
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
    <div className="container mx-auto py-6 space-y-6">
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBank ? 'Update' : 'Create'}
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
                    onClick={() => handleDelete(bank.id)}
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
    </div>
  );
}
