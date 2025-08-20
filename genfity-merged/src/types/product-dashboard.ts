export interface Feature {
  id: string;
  name_en: string;
  name_id: string;
  included: boolean;
  packageId: string;
}

export interface Subcategory {
  id: string;
  name_en: string;
  name_id: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name_en: string;
  name_id: string;
  icon?: string | null;
  subcategories: Subcategory[];
  addons: Addon[];
  packages: Package[];
}

export interface Addon {
  id: string;
  name_en: string;
  name_id: string;
  description_en?: string | null;
  description_id?: string | null;
  price_idr: number;
  price_usd: number;
  image?: string | null;
  categoryId: string;
  category?: Category;
}

export interface Package {
  id: string;
  name_en: string;
  name_id: string;
  description_en: string;
  description_id: string;
  price_idr: number;
  price_usd: number;
  image?: string | null;
  popular?: boolean | null;
  categoryId: string;
  subcategoryId: string;
  features: Feature[];  addons?: Addon[];
}

// --- Form Data Interfaces ---
export interface CategoryFormData {
  name_en: string;
  name_id: string;
  icon?: string;
}

export interface SubcategoryFormData {
  name_en: string;
  name_id: string;
  categoryId: string;
}

export interface AddonFormData {
  name_en: string;
  name_id: string;
  description_en?: string;
  description_id?: string;
  price_idr: string;
  price_usd: string;
  categoryId: string;
  image?: string;
}

export interface PackageFeatureFormData {
  id?: string;
  name_en: string;
  name_id: string;
  included: boolean;
}

export interface PackageFormData {
  name_en: string;
  name_id: string;
  description_en: string;
  description_id: string;
  price_idr: string;
  price_usd: string;
  categoryId: string;
  subcategoryId: string;
  image?: string;
  popular: boolean;
  features: PackageFeatureFormData[];
  addonIds: string[];
}

export type ProductEntityType = 'categories' | 'subcategories' | 'addons' | 'packages';
