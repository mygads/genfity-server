import type {
  WhatsAppSession,
  WhatsAppSessionsResponse,
  WhatsAppApiKey,
  WhatsAppSubscription,
  WhatsAppTransaction,
  WhatsAppTransactionsResponse,
  QRCodeResponse,
  SendMessageResponse,
  CreateSessionPayload,
  UpdateSessionPayload,
  SendMessagePayload,
  TransactionQueryOptions,
  SessionResponse,
  SessionActionResponse,
  DeleteSessionResponse
} from '@/types/whatsapp-api'

// API Base URLs
const CUSTOMER_API_BASE = '/customer/whatsapp'
const PUBLIC_API_BASE = '/services/whatsapp/chat'

// Helper function for authenticated API calls
async function apiCall<T>(endpoint: string, options: RequestInit): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return response.json()
}

// Helper function for public API calls
async function publicApiCall<T>(endpoint: string, options: RequestInit): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return response.json()
}

// API Key Management
export async function getApiKey(): Promise<WhatsAppApiKey> {
  return await apiCall(`${CUSTOMER_API_BASE}/apikey`, {
    method: 'GET'
  })
}

export async function generateApiKey(name: string = 'WhatsApp API Key'): Promise<WhatsAppApiKey> {
  return await apiCall(`${CUSTOMER_API_BASE}/apikey`, {
    method: 'POST',
    body: JSON.stringify({ name })
  })
}

// Session Management
export async function getAllSessions(): Promise<WhatsAppSessionsResponse> {
  return await apiCall(`${CUSTOMER_API_BASE}/sessions`, {
    method: 'GET'
  })
}

export async function getSession(sessionId: string): Promise<SessionResponse> {
  return await apiCall(`${CUSTOMER_API_BASE}/sessions/${sessionId}`, {
    method: 'GET'
  })
}

export async function createSession(payload: CreateSessionPayload): Promise<SessionActionResponse> {
  return await apiCall(`${CUSTOMER_API_BASE}/sessions`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateSession(sessionId: string, payload: UpdateSessionPayload): Promise<SessionActionResponse> {
  return await apiCall(`${CUSTOMER_API_BASE}/sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function deleteSession(sessionId: string): Promise<DeleteSessionResponse> {
  return await apiCall(`${CUSTOMER_API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE'
  })
}

export async function getSessionQR(sessionId: string): Promise<QRCodeResponse> {
  return await apiCall(`${CUSTOMER_API_BASE}/sessions/${sessionId}/qr`, {
    method: 'GET'
  })
}

// Subscription Management
export async function getSubscription(): Promise<WhatsAppSubscription> {
  return await apiCall(`${CUSTOMER_API_BASE}/subscription`, {
    method: 'GET'
  })
}

// Transaction Management
export async function getTransactions(options: TransactionQueryOptions = {}): Promise<WhatsAppTransactionsResponse> {
  const params = new URLSearchParams()
  
  if (options.status) params.append('status', options.status)
  if (options.startDate) params.append('startDate', options.startDate)
  if (options.endDate) params.append('endDate', options.endDate)
  if (options.limit) params.append('limit', options.limit.toString())
  if (options.offset) params.append('offset', options.offset.toString())
  
  const endpoint = `${CUSTOMER_API_BASE}/transactions${params.toString() ? '?' + params.toString() : ''}`
  
  return await apiCall(endpoint, {
    method: 'GET'
  })
}

// Message Sending (Public API)
export async function sendMessage(sessionId: string, apiKey: string, payload: SendMessagePayload): Promise<SendMessageResponse> {
  return await publicApiCall(`${PUBLIC_API_BASE}/${sessionId}/${apiKey}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

// Alternative GET method for simple text messages
export async function sendMessageUrl(sessionId: string, apiKey: string, phone: string, message: string): Promise<SendMessageResponse> {
  const encodedMessage = encodeURIComponent(message)
  const endpoint = `${PUBLIC_API_BASE}/${sessionId}/${apiKey}/${phone}/${encodedMessage}`
  
  return await publicApiCall(endpoint, {
    method: 'GET'
  })
}
