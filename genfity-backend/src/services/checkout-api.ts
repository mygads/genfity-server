import { 
  CheckoutRequest, 
  VoucherCheckRequest, 
  VoucherCheckResponse, 
  PaymentCreateRequest,
  PaymentCreateResponse,
  CheckoutResponse,
  PaymentStatus,
  TransactionListResponse,
  TransactionDetailResponse,
} from '@/types/checkout'
import { apiCall } from './api-call'

// Check voucher validity
export const checkVoucher = async (voucherData: VoucherCheckRequest): Promise<VoucherCheckResponse> => {
  try {
    const response = await apiCall('/customer/check-voucher', {
      method: 'POST',
      body: JSON.stringify(voucherData),
    })
    
    return response
  } catch (error) {
    console.error('Check voucher error:', error)
    throw error
  }
}

// Process checkout
export const processCheckout = async (checkoutData: CheckoutRequest): Promise<CheckoutResponse> => {
  try {
    const response = await apiCall('/customer/checkout', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    })
    
    return response
  } catch (error) {
    console.error('Checkout error:', error)
    throw error
  }
}

// Create payment
export const createPayment = async (paymentData: PaymentCreateRequest): Promise<PaymentCreateResponse> => {
  try {
    const response = await apiCall('/customer/payment/create', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
    
    return response
  } catch (error) {
    console.error('Payment creation error:', error)
    throw error
  }
}

// Legacy function - keeping for backward compatibility
export const processPayment = async (paymentData: { transactionId: string; method: string }): Promise<{ paymentUrl?: string; paymentId: string }> => {
  try {
    const response = await createPayment({
      transactionId: paymentData.transactionId,
      paymentMethod: paymentData.method
    })
    return {
      paymentUrl: response.data.payment.paymentUrl,
      paymentId: response.data.payment.id
    }
  } catch (error) {
    console.error('Payment processing error:', error)
    throw error
  }
}

// Check payment status
export const checkPaymentStatus = async (paymentId: string): Promise<PaymentStatus> => {
  try {
    const response = await apiCall(`/customer/payment/status/${paymentId}`)
    return response
  } catch (error) {
    console.error('Check payment status error:', error)
    throw error
  }
}

// Get customer payment details for invoice
export const getCustomerPaymentDetails = async (paymentId: string) => {
  try {
    const response = await apiCall(`/customer/payment/${paymentId}`)
    return response
  } catch (error) {
    console.error('Get customer payment details error:', error)
    throw error
  }
}

// Cancel payment
export const cancelPayment = async (paymentId: string, reason?: string): Promise<{ success: boolean; message: string; data?: unknown }> => {
  try {
    const response = await apiCall(`/customer/payment/cancel/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify({
        ...(reason && { reason })
      })
    })
    
    return response
  } catch (error) {
    console.error('Payment cancellation error:', error)
    throw error
  }
}

// Poll payment status with intervals
export const pollPaymentStatus = (
  paymentId: string, 
  onStatusUpdate: (status: PaymentStatus) => void,
  intervalMs: number = 5000,
  maxAttempts: number = 60 // 5 minutes with 5-second intervals
): { stop: () => void } => {
  let attempts = 0
  let intervalId: NodeJS.Timeout | null = null

  const poll = async () => {
    try {
      attempts++
      const status = await checkPaymentStatus(paymentId)
      onStatusUpdate(status)

      // Stop polling if payment is completed or failed, or max attempts reached
      if (status.data.payment.status === 'paid' || status.data.payment.status === 'failed' || status.data.payment.status === 'expired' || attempts >= maxAttempts) {
        if (intervalId) clearInterval(intervalId)
      }
    } catch (error) {
      console.error('Payment status polling error:', error)
      if (attempts >= maxAttempts) {
        if (intervalId) clearInterval(intervalId)
      }
    }
  }

  intervalId = setInterval(poll, intervalMs)
  
  // Initial check
  poll()

  return {
    stop: () => {
      if (intervalId) clearInterval(intervalId)
    }
  }
}

// Get all customer products
export const getCustomerProducts = async () => {
  try {
    const response = await apiCall('/customer/catalog')
    return response
  } catch (error) {
    console.error('Get customer products error:', error)
    throw error
  }
}

// Get all customer payments
export const getCustomerPayments = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await apiCall(`/customer/payment?page=${page}&limit=${limit}`)
    return response
  } catch (error) {
    console.error('Get customer payments error:', error)
    throw error
  }
}

// Get all customer transactions
export const getCustomerTransactions = async (page: number = 1, limit: number = 10): Promise<TransactionListResponse> => {
  try {
    const response = await apiCall(`/customer/transactions?page=${page}&limit=${limit}`)
    return response
  } catch (error) {
    console.error('Get customer transactions error:', error)
    
    throw error
  }
}

// Get transaction details
export const getTransactionDetails = async (transactionId: string): Promise<TransactionDetailResponse> => {
  try {
    const response = await apiCall(`/customer/transactions/${transactionId}`)
    return response
  } catch (error) {
    console.error('Get transaction details error:', error)
    
    throw error
  }
}

// Cancel transaction
export const cancelTransaction = async (transactionId: string, reason?: string) => {
  try {
    const response = await apiCall(`/customer/transactions/cancel/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify({
        ...(reason && { reason })
      })
    })
    
    return response
  } catch (error) {
    console.error('Cancel transaction error:', error)
    throw error
  }
}
