export interface WhatsAppSession {
  id: string
  sessionId: string
  sessionName: string
  status: 'connected' | 'disconnected' | 'connecting' | 'inactive'
  createdAt: string
  updatedAt: string
  qr?: string | null
  message?: string
  aiConfig?: any
  isNotification?: boolean
}

export interface WhatsAppSessionsResponse {
  success: boolean
  data: WhatsAppSession[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  subscription: {
    packageName: string
    maxSessions: number
    currentSessions: number
    canCreateMoreSessions: boolean
    endDate: string
  }
  error?: {
    message: string
  }
}

export interface WhatsAppApiKey {
  apiKey: string
  name: string
  isActive: boolean
  createdAt: string
}

export interface WhatsAppApiKeyResponse {
  success: boolean
  data: WhatsAppApiKey
  message: string
  error?: {
    message: string
  }
}

export interface SendMessagePayload {
  phone: string
  contentType: 'text' | 'image' | 'document'
  content: string
  fileName?: string
  caption?: string
}

export interface SendMessageResponse {
  success: boolean
  data: {
    sessionId: string
    recipient: string
    contentType: string
    content: string
    fileName?: string | null
    caption?: string | null
    timestamp: string
  }
  message: string
  error?: {
    message: string
  }
}

export interface QRCodeResponse {
  success: boolean
  data: {
    sessionId: string
    sessionName: string
    status: string
    qr: string | null
    message: string
    hasQR: boolean
  }
  error?: {
    message: string
  }
}

export interface ServiceStatusResponse {
  success: boolean
  data: {
    sessionId: string
    sessionName: string
    status: string
    ready: boolean
    stats?: {
      totalMessagesSent: number
      totalMessagesFailed: number
      lastMessageSentAt?: string
      lastMessageFailedAt?: string
    }
  }
  message: string
  error?: {
    message: string
  }
}
