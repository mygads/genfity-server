'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  FolderTree, 
  Puzzle, 
  ShoppingCart,
  Plus,
  BarChart3,
  TrendingUp,
  Archive
} from 'lucide-react';
import CategoriesSection from './components/CategoriesSection';
import SubcategoriesSection from './components/SubcategoriesSection';
import AddonsSection from './components/AddonsSection';
import PackagesSection from './components/PackagesSection';
import type { ProductEntityType } from '@/types/product-dashboard';
import { SessionManager } from '@/lib/storage';

interface ProductStats {
  totalCategories: number;
  totalSubcategories: number;
  totalAddons: number;
  totalPackages: number;
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<ProductEntityType>('categories');
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch product stats
  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const token = SessionManager.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/products/product-management?format=stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const tabs = [
    {
      key: 'categories' as ProductEntityType,
      label: 'Categories',
      icon: FolderTree,
      description: 'Manage product categories'
    },
    {
      key: 'subcategories' as ProductEntityType,
      label: 'Subcategories',
      icon: Package,
      description: 'Manage product subcategories'
    },
    {
      key: 'addons' as ProductEntityType,
      label: 'Add-ons',
      icon: Puzzle,
      description: 'Manage product add-ons'
    },
    {
      key: 'packages' as ProductEntityType,
      label: 'Packages',
      icon: ShoppingCart,
      description: 'Manage product packages'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your product catalog, categories, and configurations
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : stats?.totalCategories || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subcategories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : stats?.totalSubcategories || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add-ons</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : stats?.totalAddons || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packages</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : stats?.totalPackages || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Product Categories</CardTitle>
          <CardDescription>
            Select a category to manage your products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${isActive 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-md
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {tab.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tab.description}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div>
        {activeTab === 'categories' && <CategoriesSection />}
        {activeTab === 'subcategories' && <SubcategoriesSection />}
        {activeTab === 'addons' && <AddonsSection />}
        {activeTab === 'packages' && <PackagesSection />}
      </div>
    </div>
  );
}
