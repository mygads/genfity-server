// Backend Product Types (for admin dashboard)
export interface Feature {
  name: string;
  included: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Icon name (e.g., "Monitor" for lucide-react)
  subcategories: Subcategory[];
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string; // Category ID
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string; // Category ID
  subcategory: string; // Subcategory ID
  popular?: boolean;
  bgColor?: string; // Tailwind CSS class for background gradient
  features: Feature[];
}

export interface ProductData {
  categories: Category[];
  addons: Addon[];
  packages: Package[];
}

// Frontend Product Types (for user interface)
export interface FeatureFrontend {
  id: string
  name_en: string
  name_id: string
  included: boolean
}

export interface PackageFrontend {
  id: string
  name_en: string
  name_id: string
  description_en: string
  description_id: string
  price_idr: number
  price_usd: number
  image: string
  popular: boolean
  bgColor: string
  features: FeatureFrontend[]
}

export interface SubcategoryFrontend {
  id: string
  name_en: string
  name_id: string
  packages: Record<string, PackageFrontend>
}

export interface CategoryFrontend {
  id: string
  name_en: string
  name_id: string
  icon: string
  subcategories: Record<string, SubcategoryFrontend>
  addons: Record<string, AddonFrontend>
}

export interface AddonFrontend {
  id: string
  name_en: string
  name_id: string
  description_en: string
  description_id: string
  price_idr: number
  price_usd: number
  image: string
  popular?: boolean
}

export interface ProductApiResponse {
  product: Record<string, CategoryFrontend>
}

// WhatsApp Package types
export interface WhatsAppPackage {
  id: string
  name: string
  description: string | null
  priceMonth: number
  priceYear: number
  maxSession: number
  createdAt: string
  yearlyDiscount: number
  recommended: boolean
  features: string[]
}

export interface WhatsAppPackageResponse {
  success: boolean
  data: WhatsAppPackage[]
  total: number
}
