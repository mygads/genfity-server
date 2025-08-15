import { publicApiCall } from './api-call'


// Fetch all products and WhatsApp packages from unified catalog endpoint
export async function fetchCatalog() {
  try {
    const response = await publicApiCall('/customer/catalog')
    return response
  } catch (error) {
    console.error('Fetch catalog error:', error)
    throw error
  }
}

// Legacy functions for backward compatibility
export async function fetchProducts() {
  const catalog = await fetchCatalog()
  if (catalog.success && catalog.data.product) {
    return { product: catalog.data.product }
  }
  throw new Error('Failed to fetch products from catalog')
}

export async function fetchWhatsAppPackages() {
  const catalog = await fetchCatalog()
  if (catalog.success && catalog.data.whatsapp) {
    return {
      success: true,
      data: catalog.data.whatsapp.packages,
      total: catalog.data.whatsapp.total
    }
  }
  throw new Error('Failed to fetch WhatsApp packages from catalog')
}

