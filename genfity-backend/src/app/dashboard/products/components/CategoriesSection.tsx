import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import CategoryModal from '../modals/CategoryModal';
import type { Category, CategoryFormData } from '@/types/product-dashboard';

const CategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name_en: '',
    name_id: '',
    icon: '',
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/product/categories');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch categories');
      }
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({ name_en: '', name_id: '', icon: '' });
    setError(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name_en: category.name_en,
      name_id: category.name_id,
      icon: category.icon || '',
    });
    setError(null);
    setIsCategoryModalOpen(true);
  };
  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleImageUpload = async (file: File) => {
    try {
      const response = await fetch(`/api/product/categories/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      setCategoryFormData(prev => ({ ...prev, icon: result.url }));
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };const handleSaveCategory = async () => {
    setIsLoading(true);
    setError(null);
    if (!categoryFormData.name_en.trim() || !categoryFormData.name_id.trim() || !categoryFormData.icon?.trim()) {
      setError('All fields including icon are required.');
      setIsLoading(false);
      return;
    }
    const method = editingCategory ? 'PUT' : 'POST';
    const url = editingCategory ? `/api/product/categories/${editingCategory.id}` : '/api/product/categories';
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (editingCategory ? 'Failed to update category' : 'Failed to create category'));
      }
      await fetchCategories();
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/product/categories/${categoryId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      if (response.status === 204) {
        await fetchCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
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
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Manage your product categories and their configurations
          </p>
        </div>
        <Button onClick={openCreateCategoryModal} className="w-full sm:w-auto">
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">Error: {error}</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories found. Click &apos;Create Category&apos; to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name (ID)</TableHead>
                  <TableHead>Name (EN)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.icon && (
                        <Image 
                          src={category.icon} 
                          alt={category.name_id} 
                          width={32} 
                          height={32} 
                          className="rounded-md"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{category.name_id}</TableCell>
                    <TableCell className="text-muted-foreground">{category.name_en}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEditCategoryModal(category)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card><CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        formData={categoryFormData}
        onFormChange={handleCategoryFormChange}
        isLoading={isLoading}
        error={error}
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
};

export default CategoriesSection;
