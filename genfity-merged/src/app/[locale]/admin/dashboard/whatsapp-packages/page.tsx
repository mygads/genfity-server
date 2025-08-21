"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Save, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SessionManager } from "@/lib/storage";
import { useRouter } from "next/navigation";

interface WhatsAppPackage {
  id: string;
  name: string;
  description: string;
  priceMonth: number;
  priceYear: number;
  maxSession: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  description: string;
  priceMonth: string;
  priceYear: string;
  maxSession: string;
}

export default function WhatsAppPackagesPage() {
  const [packages, setPackages] = useState<WhatsAppPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    priceMonth: "",
    priceYear: "",
    maxSession: "",
  });
  const { toast } = useToast();
  const router = useRouter();

  // Fetch packages from API
  const fetchPackages = useCallback(async () => {
    try {
      const token = SessionManager.getToken();
      if (!token) {
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/admin/whatsapp/packages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push("/signin");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch packages");
      }

      const data = await response.json();
      if (data.success) {
        setPackages(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch packages");
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch WhatsApp packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  // Create new package
  const createPackage = async () => {
    try {
      const token = SessionManager.getToken();
      if (!token) {
        router.push("/signin");
        return;
      }

      const response = await fetch("/api/admin/whatsapp/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          priceMonth: parseInt(formData.priceMonth),
          priceYear: parseInt(formData.priceYear),
          maxSession: parseInt(formData.maxSession),
        }),
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push("/signin");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to create package");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "WhatsApp package created successfully",
        });
        resetForm();
        setShowAddForm(false);
        fetchPackages();
      } else {
        throw new Error(data.error || "Failed to create package");
      }
    } catch (error) {
      console.error("Error creating package:", error);
      toast({
        title: "Error",
        description: "Failed to create WhatsApp package",
        variant: "destructive",
      });
    }
  };

  // Update package
  const updatePackage = async (id: string) => {
    try {
      const token = SessionManager.getToken();
      if (!token) {
        router.push("/signin");
        return;
      }

      const response = await fetch(`/api/admin/whatsapp/packages/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          priceMonth: parseInt(formData.priceMonth),
          priceYear: parseInt(formData.priceYear),
          maxSession: parseInt(formData.maxSession),
        }),
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push("/signin");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update package");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "WhatsApp package updated successfully",
        });
        setEditingId(null);
        resetForm();
        fetchPackages();
      } else {
        throw new Error(data.error || "Failed to update package");
      }
    } catch (error) {
      console.error("Error updating package:", error);
      toast({
        title: "Error",
        description: "Failed to update WhatsApp package",
        variant: "destructive",
      });
    }
  };

  // Delete package - show confirmation dialog
  const handleDeleteClick = (pkg: WhatsAppPackage) => {
    setPackageToDelete({ 
      id: pkg.id, 
      name: pkg.name
    });
    setDeleteConfirmOpen(true);
  };

  // Actual delete operation
  const handleConfirmDelete = async () => {
    if (!packageToDelete) return;
    
    try {
      setIsDeleting(true);
      const token = SessionManager.getToken();
      if (!token) {
        SessionManager.clearSession();
        router.push("/signin");
        return;
      }

      const response = await fetch(`/api/admin/whatsapp/packages/${packageToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        SessionManager.clearSession();
        router.push("/signin");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete package");
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "WhatsApp package deleted successfully",
        });
        fetchPackages();
        setDeleteConfirmOpen(false);
        setPackageToDelete(null);
      } else {
        throw new Error(data.error || "Failed to delete package");
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      toast({
        title: "Error",
        description: "Failed to delete WhatsApp package",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priceMonth: "",
      priceYear: "",
      maxSession: "",
    });
  };

  const startEdit = (pkg: WhatsAppPackage) => {
    setFormData({
      name: pkg.name,
      description: pkg.description,
      priceMonth: pkg.priceMonth.toString(),
      priceYear: pkg.priceYear.toString(),
      maxSession: pkg.maxSession.toString(),
    });
    setEditingId(pkg.id);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const startAdd = () => {
    resetForm();
    setShowAddForm(true);
    setEditingId(null);
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.priceMonth || !formData.priceYear || !formData.maxSession) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      updatePackage(editingId);
    } else {
      createPackage();
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading WhatsApp packages...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Packages</h1>
          <p className="text-muted-foreground mt-2">
            Manage WhatsApp service packages for customers
          </p>
        </div>
        <Button onClick={startAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Package
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {editingId ? "Edit Package" : "Add New Package"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter package name"
                />
              </div>
              <div>
                <Label htmlFor="priceMonth">Monthly Price ($)</Label>
                <Input
                  id="priceMonth"
                  type="number"
                  value={formData.priceMonth}
                  onChange={(e) =>
                    setFormData({ ...formData, priceMonth: e.target.value })
                  }
                  placeholder="Monthly price in USD"
                />
              </div>
              <div>
                <Label htmlFor="priceYear">Yearly Price ($)</Label>
                <Input
                  id="priceYear"
                  type="number"
                  value={formData.priceYear}
                  onChange={(e) =>
                    setFormData({ ...formData, priceYear: e.target.value })
                  }
                  placeholder="Yearly price in USD"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="maxSession">Maximum Sessions</Label>
                <Input
                  id="maxSession"
                  type="number"
                  value={formData.maxSession}
                  onChange={(e) =>
                    setFormData({ ...formData, maxSession: e.target.value })
                  }
                  placeholder="Maximum number of concurrent sessions"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter package description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editingId ? "Update" : "Create"} Package
              </Button>
              <Button
                variant="outline"
                onClick={editingId ? cancelEdit : cancelAdd}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packages List */}
      <div className="grid gap-6">
        {packages.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-muted-foreground">
                  No WhatsApp packages found
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first package to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          packages.map((pkg) => (
            <Card key={pkg.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {pkg.name}
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                      {pkg.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(pkg)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(pkg)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Monthly Price
                    </p>
                    <p className="text-lg font-semibold">${pkg.priceMonth}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Yearly Price
                    </p>
                    <p className="text-lg font-semibold">${pkg.priceYear}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Max Sessions
                    </p>
                    <p className="text-lg font-semibold">{pkg.maxSession}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Created: {new Date(pkg.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(pkg.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the WhatsApp package{' '}
              <span className="font-semibold text-foreground">
                {packageToDelete?.name}
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
                  The package will be permanently removed and cannot be used for future subscriptions.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setPackageToDelete(null);
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
                  Delete Package
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
