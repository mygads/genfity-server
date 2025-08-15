export interface Feature {
  id: string
  name_en: string
  name_id: string
  included: boolean
}

export interface Package {
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
  features: Feature[]
}

export interface Subcategory {
  id: string
  name_en: string
  name_id: string
  packages: Record<string, Package>
}

export interface Category {
  id: string
  name_en: string
  name_id: string
  icon: string
  subcategories: Record<string, Subcategory>
  addons: Record<string, Addon>
}

export interface Addon {
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
  product: Record<string, Category>
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
