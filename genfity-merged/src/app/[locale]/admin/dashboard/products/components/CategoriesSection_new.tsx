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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlusCircle, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import CategoryModal from '../modals/CategoryModal';
import { SessionManager } from '@/lib/storage';
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
  
  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to check if icon is a URL or emoji
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Helper function to render icon
  const renderIcon = (icon: string, altText: string) => {
    if (isValidUrl(icon)) {
      return (
        <Image 
          src={icon} 
          alt={altText} 
          width={32} 
          height={32} 
          className="rounded-md"
        />
      );
    } else {
      // Render as emoji or text
      return (
        <span className="text-2xl" role="img" aria-label={altText}>
          {icon}
        </span>
      );
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
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
      const token = SessionManager.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/admin/products/product-management/categories/upload?filename=${file.name}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
  };

  const handleSaveCategory = async () => {
    setIsLoading(true);
    setError(null);
    if (!categoryFormData.name_en.trim() || !categoryFormData.name_id.trim() || !categoryFormData.icon?.trim()) {
      setError('All fields including icon are required.');
      setIsLoading(false);
      return;
    }
    const method = editingCategory ? 'PUT' : 'POST';
    const url = editingCategory ? `/api/admin/products/product-management/categories/${editingCategory.id}` : '/api/admin/products/product-management/categories';
    
    const token = SessionManager.getToken();
    if (!token) {
      setError('No authentication token found');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  // Handle delete - show confirmation dialog
  const handleDeleteClick = (categoryId: string, categoryName: string) => {
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setDeleteConfirmOpen(true);
  };

  // Actual delete operation
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      const token = SessionManager.getToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/admin/products/product-management/categories/${categoryToDelete.id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      
      await fetchCategories();
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Categories</CardTitle>
            <Button onClick={openCreateCategoryModal}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-4">Loading categories...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Name (ID)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {renderIcon(category.icon || '', category.name_en)}
                    </TableCell>
                    <TableCell>{category.name_en}</TableCell>
                    <TableCell>{category.name_id}</TableCell>
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
                          onClick={() => handleDeleteClick(category.id, category.name_en)}
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
      </Card>

      <CategoryModal
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category{' '}
              <span className="font-semibold text-foreground">
                &ldquo;{categoryToDelete?.name}&rdquo;
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">This action cannot be undone.</p>
                <p className="mt-1">
                  The category will be permanently removed from the system.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setCategoryToDelete(null);
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
                  Delete Category
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesSection;
