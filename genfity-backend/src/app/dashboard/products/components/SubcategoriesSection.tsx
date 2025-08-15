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
import type { Subcategory, Category, SubcategoryFormData } from '@/types/product-dashboard';
import SubcategoryModal from '../modals/SubcategoryModal';

const SubcategoriesSection: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [subcategoryFormData, setSubcategoryFormData] = useState<SubcategoryFormData>({
    name_en: '',
    name_id: '',
    categoryId: '',
  });
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  // Fetch categories and subcategories together
  const fetchCategoriesAndSubcategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [catRes, subcatRes] = await Promise.all([
        fetch('/api/product/categories'),
        fetch('/api/product/subcategories'),
      ]);
      if (!catRes.ok) {
        const errorData = await catRes.json();
        throw new Error(errorData.message || 'Failed to fetch categories');
      }
      if (!subcatRes.ok) {
        const errorData = await subcatRes.json();
        throw new Error(errorData.message || 'Failed to fetch subcategories');
      }
      const catData: Category[] = await catRes.json();
      const subcatData: Subcategory[] = await subcatRes.json();
      setCategories(catData);
      setSubcategories(subcatData);
    } catch (err: any) {
      setError(err.message);
      setCategories([]);
      setSubcategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndSubcategories();
  }, []);

  const openCreateSubcategoryModal = () => {
    setEditingSubcategory(null);
    setSubcategoryFormData({ name_en: '', name_id: '', categoryId: categories[0]?.id || '' });
    setError(null);
    setIsSubcategoryModalOpen(true);
  };

  const openEditSubcategoryModal = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryFormData({ name_en: subcategory.name_en, name_id: subcategory.name_id, categoryId: subcategory.categoryId });
    setError(null);
    setIsSubcategoryModalOpen(true);
  };

  const handleSubcategoryFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSubcategoryFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubcategoryCategoryChange = (categoryId: string) => {
    setSubcategoryFormData(prev => ({ ...prev, categoryId }));
  };

  const handleSaveSubcategory = async () => {
    setIsLoading(true);
    setError(null);
    if (!subcategoryFormData.categoryId || !subcategoryFormData.name_en.trim() || !subcategoryFormData.name_id.trim()) {
      setError('Both English and Indonesian names and category are required.');
      setIsLoading(false);
      return;
    }
    const method = editingSubcategory ? 'PUT' : 'POST';
    const url = editingSubcategory ? `/api/product/subcategories/${editingSubcategory.id}` : '/api/product/subcategories';
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subcategoryFormData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (editingSubcategory ? 'Failed to update subcategory' : 'Failed to create subcategory'));
      }
      await fetchCategoriesAndSubcategories();
      setIsSubcategoryModalOpen(false);
      setEditingSubcategory(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/product/subcategories/${subcategoryId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete subcategory');
      }
      if (response.status === 204 || response.status === 200) {
        await fetchCategoriesAndSubcategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete subcategory');
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
          <h2 className="text-2xl font-bold tracking-tight">Subcategories</h2>
          <p className="text-muted-foreground">
            Manage subcategories within your product categories
          </p>
        </div>
        <Button 
          onClick={openCreateSubcategoryModal} 
          disabled={categories.length === 0}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {categories.length === 0 ? "Create Category First" : "Create Subcategory"}
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>All Subcategories</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading subcategories...</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">Error: {error}</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Please create a category first to add or view subcategories.
            </div>
          ) : subcategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No subcategories found. Click &apos;Create Subcategory&apos; to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name (ID)</TableHead>
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories.map((subcat: Subcategory) => {
                  const parentCategory = categories.find((c: Category) => c.id === subcat.categoryId);
                  return (
                    <TableRow key={subcat.id}>
                      <TableCell className="font-medium">{subcat.name_id}</TableCell>
                      <TableCell className="text-muted-foreground">{subcat.name_en}</TableCell>
                      <TableCell>
                        {parentCategory ? (
                          <Badge variant="secondary">{parentCategory.name_id}</Badge>
                        ) : (
                          <Badge variant="destructive">Category Not Found</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditSubcategoryModal(subcat)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteSubcategory(subcat.id)}
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
      <SubcategoryModal
        open={isSubcategoryModalOpen}
        onOpenChange={setIsSubcategoryModalOpen}
        formData={subcategoryFormData}
        onFormChange={handleSubcategoryFormChange}
        onCategoryChange={handleSubcategoryCategoryChange}
        categories={categories}
        isLoading={isLoading}
        error={error}
        editingSubcategory={editingSubcategory}
        onSave={handleSaveSubcategory}
      />
    </div>
  );
};

export default SubcategoriesSection;
