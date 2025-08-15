import { apiRequest } from "./auth-api"

export interface TransactionSummary {
  success: {
    total: number
    product: number
    whatsapp: number
  }
  pending: {
    awaitingPayment: number
    awaitingVerification: number
  }
  failed: number
  totalOverall: number
}

export interface WhatsAppSummary {
  expiration: string | null
  sessionQuota: {
    total: number
    used: number
    remaining: number
  }
  activeSessions: number
  messageStats: {
    sent: number
    failed: number
  }
}

export interface ProductDeliveryItem {
  transactionId: string
  packageName: string
  addonName: string
  isDelivered: boolean
  amount: string
  currency: string
  createdAt: string
}

export interface ProductHistoryItem {
  id: string
  packageName: string
  addonName: string
  amount: string
  currency: string
  createdAt: string
}

export interface WhatsAppHistoryItem {
  id: string
  packageName: string
  duration: string
  amount: string
  currency: string
  createdAt: string
}

export interface RecentHistory {
  products: ProductHistoryItem[]
  whatsapp: WhatsAppHistoryItem[]
}

export interface DashboardData {
  transactionSummary: TransactionSummary
  productDeliveryLog: ProductDeliveryItem[]
  whatsappSummary: WhatsAppSummary
  recentHistory: RecentHistory
  lastUpdated: string
}

export interface DashboardResponse {
  success: boolean
  data: DashboardData
  error?: {
    message: string
    code?: string
  }
}

// Mock data for development when API is not available
const mockDashboardData: DashboardData = {
  transactionSummary: {
    success: {
      total: 125,
      product: 75,
      whatsapp: 50
    },
    pending: {
      awaitingPayment: 8,
      awaitingVerification: 3
    },
    failed: 12,
    totalOverall: 148
  },
  productDeliveryLog: [
    {
      transactionId: "TXN-001",
      packageName: "Premium Package",
      addonName: "Extra Storage",
      isDelivered: true,
      amount: "150000",
      currency: "IDR",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      transactionId: "TXN-002",
      packageName: "Basic Package",
      addonName: "SMS Addon",
      isDelivered: false,
      amount: "75000",
      currency: "IDR",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ],
  whatsappSummary: {
    expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    sessionQuota: {
      total: 1000,
      used: 650,
      remaining: 350
    },
    activeSessions: 12,
    messageStats: {
      sent: 2340,
      failed: 45
    }
  },
  recentHistory: {
    products: [
      {
        id: "PROD-001",
        packageName: "Premium Package",
        addonName: "Extra Storage",
        amount: "150000",
        currency: "IDR",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "PROD-002",
        packageName: "Basic Package",
        addonName: "SMS Addon",
        amount: "75000",
        currency: "IDR",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    whatsapp: [
      {
        id: "WA-001",
        packageName: "WhatsApp Business",
        duration: "30 days",
        amount: "100000",
        currency: "IDR",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  lastUpdated: new Date().toISOString()
}

export async function fetchDashboardData(): Promise<DashboardResponse> {
  // Try to use the real API endpoint first
  try {
    console.log("Fetching dashboard data from API...")
    const response = await apiRequest<DashboardResponse>("/customer/dashboard", { method: "GET" })
    
    if (response.success && response.data) {
      console.log("Dashboard data fetched successfully from API")
      return response
    } else {
      console.warn("API response was not successful:", response)
      throw new Error(response.error?.message || "API response was not successful")
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data from API, using mock data:", error)
    
    // Return mock data as fallback when API is not available
    return {
      success: true,
      data: mockDashboardData,
      error: {
        message: "Using development data (API not available)",
        code: "DEVELOPMENT_MODE"
      }
    }
  }
}
