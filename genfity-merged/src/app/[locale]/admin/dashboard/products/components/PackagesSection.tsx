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
import { PlusCircle, Pencil, Trash2, Star } from 'lucide-react';
import Image from 'next/image';
import PackageModal from '../modals/PackageModal';
import { SessionManager } from '@/lib/storage';
import type { Package, Category, Subcategory, PackageFormData, PackageFeatureFormData } from '@/types/product-dashboard';

const PackagesSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);  const [packageFormData, setPackageFormData] = useState<PackageFormData>({
    name_en: '',
    name_id: '',
    description_en: '',
    description_id: '',
    price_idr: '',
    price_usd: '',
    categoryId: '',
    subcategoryId: '',
    popular: false,
    features: [],
    image: undefined,
    addonIds: [],
  });
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filteredSubcategoriesForPackageForm, setFilteredSubcategoriesForPackageForm] = useState<Subcategory[]>([]);

  // Fetch categories, subcategories, and packages together
  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = SessionManager.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [catRes, subcatRes, pkgRes] = await Promise.all([
        fetch('/api/admin/products/product-management/categories', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/products/product-management/subcategories', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/products/product-management/packages', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
      ]);
      
      if (!catRes.ok) throw new Error((await catRes.json()).message || 'Failed to fetch categories');
      if (!subcatRes.ok) throw new Error((await subcatRes.json()).message || 'Failed to fetch subcategories');
      if (!pkgRes.ok) throw new Error((await pkgRes.json()).message || 'Failed to fetch packages');
      
      setCategories(await catRes.json());
      setSubcategories(await subcatRes.json());
      setPackages(await pkgRes.json());
    } catch (err: any) {
      setError(err.message);
      setCategories([]);
      setSubcategories([]);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);
  const openCreatePackageModal = () => {
    setPackageFormData({
      name_en: '',
      name_id: '',
      description_en: '',
      description_id: '',
      price_idr: '',
      price_usd: '',
      categoryId: categories[0]?.id || '',
      subcategoryId: '',
      popular: false,
      features: [],
      image: undefined,
      addonIds: [],
    });
    setSelectedImageFile(null);
    setImagePreview(null);
    setError(null);    if (categories[0]?.id) {
      handlePackageCategoryChange(categories[0].id, true);
    } else {
      setFilteredSubcategoriesForPackageForm([]);
    }
    setIsPackageModalOpen(true);
  };
  const openEditPackageModal = async (pkg: Package) => {
    setEditingPackage(pkg);
    setPackageFormData({
      name_en: pkg.name_en,
      name_id: pkg.name_id,
      description_en: pkg.description_en,
      description_id: pkg.description_id,
      price_idr: pkg.price_idr.toString(),
      price_usd: pkg.price_usd.toString(),
      categoryId: pkg.categoryId,
      subcategoryId: pkg.subcategoryId,
      image: pkg.image || undefined,
      popular: pkg.popular || false,
      features: pkg.features.map(f => ({ id: f.id, name_en: f.name_en, name_id: f.name_id, included: f.included })),
      addonIds: pkg.addons ? pkg.addons.map(a => a.id) : [],
    });
    setSelectedImageFile(null);
    setImagePreview(pkg.image || null);
    setError(null);
    
    // Load subcategories for the selected category without clearing subcategoryId
    if (pkg.categoryId) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/products/product-management/subcategories?categoryId=${pkg.categoryId}`, {
          headers: {
            'Authorization': `Bearer ${SessionManager.getToken()}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch subcategories for the selected category');
        }
        const data: Subcategory[] = await response.json();
        setFilteredSubcategoriesForPackageForm(data);
      } catch (err: any) {
        setError(err.message);
        setFilteredSubcategoriesForPackageForm([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFilteredSubcategoriesForPackageForm([]);
    }
    
    setIsPackageModalOpen(true);
  };

  const handlePackageFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setPackageFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  const handlePackageCategoryChange = async (categoryId: string, clearSubcategory: boolean = true) => {
    setPackageFormData(prev => ({ 
      ...prev, 
      categoryId, 
      subcategoryId: clearSubcategory ? '' : prev.subcategoryId 
    }));
    if (categoryId) {
      setIsLoading(true);
      try {
        const token = SessionManager.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/admin/products/product-management/subcategories?categoryId=${categoryId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subcategories for the selected category');
        }
        
        const data: Subcategory[] = await response.json();
        setFilteredSubcategoriesForPackageForm(data);
      } catch (err: any) {
        setError(err.message);
        setFilteredSubcategoriesForPackageForm([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFilteredSubcategoriesForPackageForm([]);
    }
  };

  const handlePackageSubcategoryChange = (subcategoryId: string) => {
    setPackageFormData(prev => ({ ...prev, subcategoryId }));
  };

  const handleAddPackageFeature = () => {
    setPackageFormData(prev => ({
      ...prev,
      features: [...prev.features, { name_en: '', name_id: '', included: true, id: `temp-${Date.now()}` }],
    }));
  };

  const handlePackageFeatureChange = (index: number, field: keyof PackageFeatureFormData, value: string | boolean) => {
    setPackageFormData(prev => {
      const newFeatures = [...prev.features];
      if (newFeatures[index]) {
        (newFeatures[index] as any)[field] = value;
      }
      return { ...prev, features: newFeatures };
    });
  };

  const handleRemovePackageFeature = (index: number) => {
    setPackageFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSelectedImageFile(null);
      setImagePreview(editingPackage?.image || null);
    }
  };

  const handleSavePackage = async () => {
    setIsLoading(true);
    setError(null);
    if (!packageFormData.categoryId || !packageFormData.subcategoryId) {
      setError('Category and Subcategory are required for a package.');
      setIsLoading(false);
      return;
    }
    if (
      isNaN(parseFloat(packageFormData.price_idr)) || parseFloat(packageFormData.price_idr) < 0 ||
      isNaN(parseFloat(packageFormData.price_usd)) || parseFloat(packageFormData.price_usd) < 0
    ) {
      setError('Valid price (IDR & USD) is required for a package.');
      setIsLoading(false);
      return;
    }
    if (!packageFormData.features || packageFormData.features.length === 0) {
      setError('At least one feature is required for a package.');
      setIsLoading(false);
      return;
    }    if (packageFormData.features.some(f => !f.name_en.trim() || !f.name_id.trim())) {
      setError('All features must have a name in both languages.');
      setIsLoading(false);
      return;
    }
    
    // Enforce mandatory image for new packages
    if (!editingPackage && !selectedImageFile) {
      setError('Image is required for new packages.');
      setIsLoading(false);
      return;
    }
    
    // For existing packages, require image if not already present
    if (editingPackage && !editingPackage.image && !selectedImageFile) {
      setError('Image is required for this package.');
      setIsLoading(false);
      return;
    }

    let imageUrl = editingPackage?.image || undefined;
    if (selectedImageFile) {
      try {
        const token = SessionManager.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/admin/products/product-management/packages/upload?filename=${selectedImageFile.name}`, {
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
        setIsLoading(false);
        return;
      }
    }
    
    const method = editingPackage ? 'PUT' : 'POST';
    const url = editingPackage ? `/api/admin/products/product-management/packages/${editingPackage.id}` : '/api/admin/products/product-management/packages';
    
    const token = SessionManager.getToken();
    if (!token) {
      setError('No authentication token found');
      setIsLoading(false);
      return;
    }
    
    const payload = {
      ...packageFormData,
      price_idr: parseFloat(packageFormData.price_idr),
      price_usd: parseFloat(packageFormData.price_usd),
      image: imageUrl,
      features: packageFormData.features.map(f => ({
        id: f.id?.startsWith('temp-') ? undefined : f.id,        
        name_en: f.name_en,
        name_id: f.name_id,
        included: f.included,
      })),
    };
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
        throw new Error(errorData.message || (editingPackage ? 'Failed to update package' : 'Failed to create package'));
      }
      await fetchAll();
      setIsPackageModalOpen(false);
      setEditingPackage(null);
      setSelectedImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    setIsLoading(true);
    setError(null);
    
    const token = SessionManager.getToken();
    if (!token) {
      setError('No authentication token found');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/product-management/packages/${packageId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete package');
      }
      if (response.status === 204 || response.status === 200) {
        await fetchAll();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete package');
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
          <h2 className="text-2xl font-bold tracking-tight">Packages</h2>
          <p className="text-muted-foreground">
            Manage comprehensive product packages with features and pricing
          </p>
        </div>
        <Button 
          onClick={openCreatePackageModal} 
          disabled={categories.length === 0 || subcategories.length === 0}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {(categories.length === 0 || subcategories.length === 0) ? "Create Categories First" : "Create Package"}
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading packages...</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">Error: {error}</div>
          ) : (categories.length === 0 || subcategories.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              Please ensure you have at least one category and one subcategory before creating packages.
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No packages found. Click &apos;Create Package&apos; to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Price (IDR)</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg: Package) => {
                  const categoryName = categories.find((c: Category) => c.id === pkg.categoryId)?.name_id || 'N/A';
                  const subcategoryName = subcategories.find((sc: Subcategory) => sc.id === pkg.subcategoryId)?.name_id || 'N/A';
                  let imageSrc = pkg.image || '';
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
                    <TableRow key={pkg.id}>
                      <TableCell>
                        {isValidImage ? (
                          <Image
                            src={imageSrc}
                            alt={pkg.name_id}
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
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{pkg.name_id}</div>
                            <div className="text-sm text-muted-foreground">{pkg.name_en}</div>
                          </div>
                          {pkg.popular && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{categoryName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subcategoryName}</Badge>
                      </TableCell>
                      <TableCell>Rp {pkg.price_idr.toLocaleString()}</TableCell>
                      <TableCell>${pkg.price_usd.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {pkg.popular && (
                            <Badge variant="default" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditPackageModal(pkg)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeletePackage(pkg.id)}
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

      <PackageModal
        open={isPackageModalOpen}
        onOpenChange={(isOpen) => {
          setIsPackageModalOpen(isOpen);
          if (!isOpen) {
            setError(null);
            setImagePreview(null);
            setSelectedImageFile(null);
            setFilteredSubcategoriesForPackageForm([]);
          }
        }}
        formData={packageFormData}
        onFormChange={handlePackageFormChange}
        onCategoryChange={handlePackageCategoryChange}
        onSubcategoryChange={handlePackageSubcategoryChange}
        categories={categories}
        subcategories={subcategories}
        filteredSubcategories={filteredSubcategoriesForPackageForm}
        imagePreview={imagePreview}
        editingPackage={editingPackage}
        onImageFileChange={handleImageFileChange}
        onAddFeature={handleAddPackageFeature}
        onFeatureChange={handlePackageFeatureChange}
        onRemoveFeature={handleRemovePackageFeature}
        isLoading={isLoading}
        error={error}
        onSave={handleSavePackage}
      />
    </div>
  );
};

export default PackagesSection;
