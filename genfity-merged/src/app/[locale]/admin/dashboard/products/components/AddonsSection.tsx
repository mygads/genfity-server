'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Package } from 'lucide-react';
import Image from 'next/image';
import AddonModal from '../modals/AddonModal';
import { SessionManager } from '@/lib/storage';
import type { Category, Addon, AddonFormData } from '@/types/product-dashboard';

export default function AddonsSection() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [addonFormData, setAddonFormData] = useState<AddonFormData>({
    name_en: '',
    name_id: '',
    description_en: '',
    description_id: '',
    price_idr: '',
    price_usd: '',
    categoryId: '',
    image: undefined,
  });
  useEffect(() => {
    fetchAddons();
    fetchCategories();
  }, []);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const token = SessionManager.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/products/product-management/addons', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch addons');
      }
      
      const data = await response.json();
      setAddons(data);
    } catch (err) {
      console.error('Error fetching addons:', err);
      setError('Failed to load addons');
    } finally {
      setLoading(false);
    }
  };
  const fetchCategories = async () => {
    try {
      const token = SessionManager.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/products/product-management/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const openCreateAddonModal = () => {
    setAddonFormData({
      name_en: '',
      name_id: '',
      description_en: '',
      description_id: '',
      price_idr: '',
      price_usd: '',
      categoryId: categories[0]?.id || '',
      image: undefined,
    });
    setSelectedImageFile(null);
    setImagePreview(null);
    setError(null);
    setIsAddonModalOpen(true);
  };

  const openEditAddonModal = (addon: Addon) => {
    setEditingAddon(addon);
    setAddonFormData({
      name_en: addon.name_en,
      name_id: addon.name_id,
      description_en: addon.description_en || '',
      description_id: addon.description_id || '',
      price_idr: addon.price_idr.toString(),
      price_usd: addon.price_usd.toString(),
      categoryId: addon.categoryId,
      image: addon.image || undefined,
    });
    setSelectedImageFile(null);
    setImagePreview(addon.image || null);
    setError(null);
    setIsAddonModalOpen(true);
  };

  const handleAddonFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddonFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddonCategoryChange = (categoryId: string) => {
    setAddonFormData(prev => ({ ...prev, categoryId }));
  };

  const handleAddonImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedImageFile(null);
      setImagePreview(editingAddon?.image || null);
    }
  };

  const handleSaveAddon = async () => {
    setLoading(true);
    setError(null);
    
    if (!addonFormData.categoryId) {
      setError('Category is required for an addon.');
      setLoading(false);
      return;
    }
    
    if (
      isNaN(parseFloat(addonFormData.price_idr)) || parseFloat(addonFormData.price_idr) <= 0 ||
      isNaN(parseFloat(addonFormData.price_usd)) || parseFloat(addonFormData.price_usd) <= 0
    ) {
      setError('Valid price (IDR & USD) is required for an addon.');
      setLoading(false);
      return;
    }

    let imageUrl = editingAddon?.image || undefined;
    if (selectedImageFile) {
      try {
        const token = SessionManager.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/admin/products/product-management/addons/upload?filename=${selectedImageFile.name}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: selectedImageFile,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }
        
        const result = await response.json();
        imageUrl = result.url;
      } catch (err: any) {
        setError(`Image upload failed: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    const method = editingAddon ? 'PUT' : 'POST';
    const url = editingAddon ? `/api/admin/products/product-management/addons/${editingAddon.id}` : '/api/admin/products/product-management/addons';
    const payload = {
      ...addonFormData,
      price_idr: parseFloat(addonFormData.price_idr),
      price_usd: parseFloat(addonFormData.price_usd),
      image: imageUrl,
    };

    const token = SessionManager.getToken();
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (editingAddon ? 'Failed to update addon' : 'Failed to create addon'));
      }
      
      await fetchAddons();
      setIsAddonModalOpen(false);
      setEditingAddon(null);
      setSelectedImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this addon?')) return;

    const token = SessionManager.getToken();
    if (!token) {
      alert('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/product-management/addons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete addon');
      }

      setAddons(addons.filter(addon => addon.id !== id));
    } catch (err) {
      console.error('Error deleting addon:', err);
      alert('Failed to delete addon');
    }
  };

  const formatPrice = (priceIdr: number, priceUsd: number) => {
    return `IDR ${priceIdr.toLocaleString()} / USD ${priceUsd}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Loading addons...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add-ons</h2>
          <p className="text-muted-foreground">
            Manage additional services and features for your packages
          </p>
        </div>        <Button className="w-full sm:w-auto" onClick={openCreateAddonModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Addon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Add-ons</CardTitle>
        </CardHeader>
        <CardContent>
          {addons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No addons found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell>
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                        {addon.image ? (
                          <Image
                            src={addon.image}
                            alt={addon.name_en}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{addon.name_en}</TableCell>
                    <TableCell>
                      {addon.category && (
                        <Badge variant="secondary">
                          {addon.category.name_en}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {addon.description_en}
                    </TableCell>
                    <TableCell>
                      {formatPrice(addon.price_idr, addon.price_usd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditAddonModal(addon)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(addon.id)}
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

      <AddonModal
        open={isAddonModalOpen}
        onOpenChange={setIsAddonModalOpen}
        formData={addonFormData}
        onFormChange={handleAddonFormChange}
        onCategoryChange={handleAddonCategoryChange}
        categories={categories}
        imagePreview={imagePreview}
        editingAddon={editingAddon}
        onImageFileChange={handleAddonImageFileChange}
        onSave={handleSaveAddon}
        isLoading={loading}
        error={error}
      />
    </div>
  );
}