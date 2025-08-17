import { useState, useEffect, useCallback } from 'react'
import type {
  WhatsAppSession,
  WhatsAppSessionsResponse,
  WhatsAppApiKey,
  WhatsAppSubscription,
  WhatsAppTransaction,
  WhatsAppTransactionsResponse,
  SendMessagePayload,
  QRCodeResponse,
  TransactionQueryOptions
} from '@/types/whatsapp-api'
import {
  getApiKey,
  generateApiKey,
  getAllSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  getSessionQR,
  getSubscription,
  getTransactions,
  sendMessage,
  sendMessageUrl
} from '@/services/whatsapp-api'

interface UseWhatsAppReturn {
  // State
  apiKey: string | null
  sessions: WhatsAppSession[]
  subscription: WhatsAppSubscription['subscription'] | null
  usage: WhatsAppSubscription['usage'] | null
  transactions: WhatsAppTransaction[]
  loading: boolean
  error: string | null
  
  // Session Quota Info
  sessionQuota: {
    used: number
    max: number
    canCreateMore: boolean
  } | null
  
  // Package Info
  packageInfo: {
    name: string
    maxSessions: number
    features: string[]
  } | null
  
  // API Key Management
  fetchApiKey: () => Promise<void>
  createApiKey: (name?: string) => Promise<string | null>
  
  // Session Management
  fetchSessions: () => Promise<void>
  createNewSession: (name: string) => Promise<WhatsAppSession | null>
  updateSessionName: (sessionId: string, name: string) => Promise<boolean>
  removeSession: (sessionId: string) => Promise<boolean>
  getQRCode: (sessionId: string) => Promise<string | null>
  
  // Subscription Management
  fetchSubscription: () => Promise<void>
  
  // Transaction Management
  fetchTransactions: (options?: TransactionQueryOptions) => Promise<void>
  
  // Message Sending
  sendWhatsAppMessage: (sessionId: string, payload: SendMessagePayload) => Promise<boolean>
  sendQuickMessage: (sessionId: string, phone: string, message: string) => Promise<boolean>
  
  // Utility
  clearError: () => void
  refresh: () => Promise<void>
}

export function useWhatsApp(): UseWhatsAppReturn {
  // State
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [subscription, setSubscription] = useState<WhatsAppSubscription['subscription'] | null>(null)
  const [usage, setUsage] = useState<WhatsAppSubscription['usage'] | null>(null)
  const [transactions, setTransactions] = useState<WhatsAppTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionQuota, setSessionQuota] = useState<{
    used: number
    max: number
    canCreateMore: boolean
  } | null>(null)
  const [packageInfo, setPackageInfo] = useState<{
    name: string
    maxSessions: number
    features: string[]
  } | null>(null)

  // Error handler
  const handleError = useCallback((err: any) => {
    const message = err instanceof Error ? err.message : 'An unknown error occurred'
    setError(message)
    console.error('WhatsApp API Error:', err)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // API Key Management
  const fetchApiKey = useCallback(async () => {
    try {
      const response = await getApiKey()
      if (response.success) {
        setApiKey(response.apiKey)
      }
    } catch (err) {
      // API key might not exist yet, that's okay
      setApiKey(null)
    }
  }, [])

  const createApiKey = useCallback(async (name: string = 'WhatsApp API Key'): Promise<string | null> => {
    try {
      setLoading(true)
      const response = await generateApiKey(name)
      if (response.success) {
        setApiKey(response.apiKey)
        return response.apiKey
      }
      return null
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [handleError])

  // Session Management
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAllSessions()
      if (response.success) {
        setSessions(response.sessions)
        setSessionQuota(response.sessionQuota)
        setPackageInfo(response.package)
      }
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const createNewSession = useCallback(async (name: string): Promise<WhatsAppSession | null> => {
    try {
      setLoading(true)
      const response = await createSession({ name })
      if (response.success) {
        await fetchSessions() // Refresh sessions list
        return response.session
      }
      return null
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [handleError, fetchSessions])

  const updateSessionName = useCallback(async (sessionId: string, name: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await updateSession(sessionId, { name })
      if (response.success) {
        await fetchSessions() // Refresh sessions list
        return true
      }
      return false
    } catch (err) {
      handleError(err)
      return false
    } finally {
      setLoading(false)
    }
  }, [handleError, fetchSessions])

  const removeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await deleteSession(sessionId)
      if (response.success) {
        await fetchSessions() // Refresh sessions list
        return true
      }
      return false
    } catch (err) {
      handleError(err)
      return false
    } finally {
      setLoading(false)
    }
  }, [handleError, fetchSessions])

  const getQRCode = useCallback(async (sessionId: string): Promise<string | null> => {
    try {
      const response = await getSessionQR(sessionId)
      if (response.success) {
        return response.qr
      }
      return null
    } catch (err) {
      handleError(err)
      return null
    }
  }, [handleError])

  // Subscription Management
  const fetchSubscription = useCallback(async () => {
    try {
      const response = await getSubscription()
      if (response.success) {
        setSubscription(response.subscription)
        setUsage(response.usage)
      }
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  // Transaction Management
  const fetchTransactions = useCallback(async (options: TransactionQueryOptions = {}) => {
    try {
      setLoading(true)
      const response = await getTransactions(options)
      if (response.success) {
        setTransactions(response.transactions)
      }
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  // Message Sending
  const sendWhatsAppMessage = useCallback(async (sessionId: string, payload: SendMessagePayload): Promise<boolean> => {
    if (!apiKey) {
      setError('API key required')
      return false
    }
    
    try {
      const response = await sendMessage(sessionId, apiKey, payload)
      return response.success
    } catch (err) {
      handleError(err)
      return false
    }
  }, [apiKey, handleError])

  const sendQuickMessage = useCallback(async (sessionId: string, phone: string, message: string): Promise<boolean> => {
    if (!apiKey) {
      setError('API key required')
      return false
    }
    
    try {
      const response = await sendMessageUrl(sessionId, apiKey, phone, message)
      return response.success
    } catch (err) {
      handleError(err)
      return false
    }
  }, [apiKey, handleError])

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchApiKey(),
      fetchSessions(),
      fetchSubscription(),
      fetchTransactions()
    ])
  }, [fetchApiKey, fetchSessions, fetchSubscription, fetchTransactions])

  // Initialize
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    // State
    apiKey,
    sessions,
    subscription,
    usage,
    transactions,
    loading,
    error,
    sessionQuota,
    packageInfo,
    
    // API Key Management
    fetchApiKey,
    createApiKey,
    
    // Session Management
    fetchSessions,
    createNewSession,
    updateSessionName,
    removeSession,
    getQRCode,
    
    // Subscription Management
    fetchSubscription,
    
    // Transaction Management
    fetchTransactions,
    
    // Message Sending
    sendWhatsAppMessage,
    sendQuickMessage,
    
    // Utility
    clearError,
    refresh
  }
}
