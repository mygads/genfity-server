import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Addon, Category, AddonFormData } from '@/types/product-dashboard';
import AddonModal from '../modals/AddonModal';

const AddonsSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [addonFormData, setAddonFormData] = useState<AddonFormData>({
    name_en: '',
    name_id: '',
    description_en: '',
    description_id: '',
    price_idr: '',
    price_usd: '',
    categoryId: categories[0]?.id || '',
    image: undefined,
  });
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch categories and addons together
  const fetchCategoriesAndAddons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [catRes, addonRes] = await Promise.all([
        fetch('/api/product/categories'),
        fetch('/api/product/addons'),
      ]);
      if (!catRes.ok) {
        const errorData = await catRes.json();
        throw new Error(errorData.message || 'Failed to fetch categories');
      }
      if (!addonRes.ok) {
        const errorData = await addonRes.json();
        throw new Error(errorData.message || 'Failed to fetch addons');
      }
      const catData: Category[] = await catRes.json();
      const addonData: Addon[] = await addonRes.json();
      setCategories(catData);
      setAddons(addonData);
    } catch (err: any) {
      setError(err.message);
      setCategories([]);
      setAddons([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndAddons();
  }, []);

  const openCreateAddonModal = () => {
    setEditingAddon(null);
    setAddonFormData({ name_en: '', name_id: '', description_en: '', description_id: '', price_idr: '', price_usd: '', categoryId: categories[0]?.id || '', image: undefined });
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
    setAddonFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddonCategoryChange = (categoryId: string) => {
    setAddonFormData(prev => ({ ...prev, categoryId }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsLoading(true);
    setError(null);
    if (!addonFormData.categoryId) {
      setError('Category is required for an addon.');
      setIsLoading(false);
      return;
    }
    if (
      isNaN(parseFloat(addonFormData.price_idr)) || parseFloat(addonFormData.price_idr) < 0 ||
      isNaN(parseFloat(addonFormData.price_usd)) || parseFloat(addonFormData.price_usd) < 0
    ) {
      setError('Valid price (IDR & USD) is required for an addon.');
      setIsLoading(false);
      return;
    }
    
    // Enforce mandatory image for new addons
    if (!editingAddon && !selectedImageFile) {
      setError('Image is required for new addons.');
      setIsLoading(false);
      return;
    }
    
    // For existing addons, require image if not already present
    if (editingAddon && !editingAddon.image && !selectedImageFile) {
      setError('Image is required for this addon.');
      setIsLoading(false);
      return;
    }

    let imageUrl = editingAddon?.image;
    if (selectedImageFile) {
      try {
        const response = await fetch(`/api/product/addons/upload?filename=${selectedImageFile.name}`, {
          method: 'POST',
          body: selectedImageFile,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Image upload failed');
        }
        const result = await response.json();
        imageUrl = result.url;
      } catch (uploadError: any) {
        setError(`Image upload failed: ${uploadError.message}`);
        setIsLoading(false);
        return;
      }
    }

    const dataToSave: any = {
      name_en: addonFormData.name_en,
      name_id: addonFormData.name_id,
      description_en: addonFormData.description_en,
      description_id: addonFormData.description_id,
      price_idr: parseFloat(addonFormData.price_idr),
      price_usd: parseFloat(addonFormData.price_usd),
      categoryId: addonFormData.categoryId,
    };
    if (imageUrl) dataToSave.image = imageUrl;

    const apiUrl = editingAddon ? `/api/product/addons/${editingAddon.id}` : '/api/product/addons';
    try {
      const response = await fetch(apiUrl, {
        method: editingAddon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save addon');
        return;
      }
      fetchCategoriesAndAddons();
      setIsAddonModalOpen(false);
      setEditingAddon(null);
      setAddonFormData({ name_en: '', name_id: '', description_en: '', description_id: '', price_idr: '', price_usd: '', categoryId: categories[0]?.id || '', image: undefined });
      setSelectedImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddon = async (addonId: string) => {
    if (!confirm('Are you sure you want to delete this addon?')) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/product/addons/${addonId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete addon');
      }
      if (response.status === 204 || response.status === 200) {
        await fetchCategoriesAndAddons();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete addon');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add-ons</h2>
          <p className="text-muted-foreground">
            Manage additional products and services that can be added to packages
          </p>
        </div>
        <Button 
          onClick={openCreateAddonModal} 
          disabled={categories.length === 0}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {categories.length === 0 ? "Create Category First" : "Create Add-on"}
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>All Add-ons</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading add-ons...</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">Error: {error}</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Please create a category first before adding add-ons.
            </div>
          ) : addons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No add-ons found. Click &apos;Create Add-on&apos; to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price (IDR)</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addons.map(addon => {
                  const categoryName = categories.find((c: Category) => c.id === addon.categoryId)?.name_id || 'N/A';
                  let imageSrc = addon.image || '';
                  if (
                    imageSrc &&
                    !imageSrc.startsWith('http') &&
                    !imageSrc.startsWith('/') &&
                    !imageSrc.startsWith('data:image')
                  ) {
                    imageSrc = `/api/product/images/${imageSrc}`;
                  }
                  const isValidImage =
                    imageSrc &&
                    (imageSrc.startsWith('http') ||
                      imageSrc.startsWith('/') ||
                      imageSrc.startsWith('data:image'));
                  
                  return (
                    <TableRow key={addon.id}>
                      <TableCell>
                        {isValidImage ? (
                          <Image
                            src={imageSrc}
                            alt={addon.name_id}
                            width={48}
                            height={48}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{addon.name_id}</div>
                          <div className="text-sm text-muted-foreground">{addon.name_en}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{categoryName}</Badge>
                      </TableCell>
                      <TableCell>Rp {addon.price_idr.toLocaleString()}</TableCell>
                      <TableCell>${addon.price_usd.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditAddonModal(addon)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteAddon(addon.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddonModal
        open={isAddonModalOpen}
        onOpenChange={(isOpen) => {
          setIsAddonModalOpen(isOpen);
          if (!isOpen) {
            setError(null);
            setSelectedImageFile(null);
            setImagePreview(null);
          }
        }}
        formData={addonFormData}
        onFormChange={handleAddonFormChange}
        onCategoryChange={handleAddonCategoryChange}
        categories={categories}
        imagePreview={imagePreview}
        editingAddon={editingAddon}
        onImageFileChange={handleImageFileChange}
        onSave={handleSaveAddon}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default AddonsSection;
