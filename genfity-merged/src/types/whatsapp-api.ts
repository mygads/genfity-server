// WhatsApp API Types - exactly matching the API guide

export interface WhatsAppSession {
  id: string
  name: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR'
  phone?: string | null
  createdAt: string
  updatedAt: string
}

export interface WhatsAppSessionsResponse {
  success: boolean
  sessions: WhatsAppSession[]
  sessionQuota: {
    used: number
    max: number
    canCreateMore: boolean
  }
  package: {
    name: string
    maxSessions: number
    features: string[]
  }
}

export interface WhatsAppApiKey {
  success: boolean
  apiKey: string
  message: string
}

export interface WhatsAppSubscription {
  success: boolean
  subscription: {
    id?: string
    packageName: string
    status: string
    maxSessions: number
    features: string[]
    billingCycle?: string
    nextBillingDate?: string
    price?: number
    currency?: string
    isLegacy?: boolean
  }
  usage: {
    sessionsUsed: number
    messagesThisMonth?: number
  }
}

export interface WhatsAppTransaction {
  id: string
  type: string
  description: string
  amount: number
  currency: string
  status: string
  createdAt: string
  packageInfo?: {
    name: string
    maxSessions: number
  }
}

export interface WhatsAppTransactionsResponse {
  success: boolean
  transactions: WhatsAppTransaction[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface QRCodeResponse {
  success: boolean
  qr: string // base64 image data
  message: string
}

export interface SendMessageResponse {
  success: boolean
  messageId?: string
  status?: string
  timestamp?: string
  message?: string
}

// Payload Types
export interface CreateSessionPayload {
  name: string
}

export interface UpdateSessionPayload {
  name: string
}

export interface SendMessagePayload {
  phone: string
  message?: string
  type?: 'text' | 'image' | 'document'
  image?: string
  caption?: string
  document?: string
  filename?: string
}

// Transaction Query Options
export interface TransactionQueryOptions {
  status?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

// API Response Types
export interface SessionResponse {
  success: boolean
  session: WhatsAppSession
}

export interface SessionActionResponse {
  success: boolean
  session: WhatsAppSession
  message: string
}

export interface DeleteSessionResponse {
  success: boolean
  message: string
}
