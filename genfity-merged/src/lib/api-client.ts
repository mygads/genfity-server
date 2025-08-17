/**
 * Global API Client with Automatic Authentication
 * 
 * This module provides a universal API client that automatically handles
 * JWT Bearer token authentication for all API requests.
 * 
 * Usage examples:
 * - apiClient.get('/api/customer/profile')
 * - apiClient.post('/api/customer/checkout', checkoutData)
 * - apiClient.put('/api/customer/profile', profileData)
 * - apiClient.delete('/api/customer/item', { itemId: 'xxx' })
 */

import { SessionManager } from './storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean; // Default: true
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = SessionManager.getToken();
    
    if (!token) {
      throw new Error('Authentication required. Please login first.');
    }

    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    console.warn('[API_CLIENT] Authentication error detected, clearing session');
    SessionManager.clearSession();
    
    // Optionally redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      body,
      requireAuth = true,
      headers = {},
      ...fetchOptions
    } = options;

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers || {}),
    };

    // Add authentication headers if required
    if (requireAuth) {
      try {
        const authHeaders = this.getAuthHeaders();
        Object.assign(requestHeaders, authHeaders);
      } catch (error) {
        throw new Error('Authentication required. Please login first.');
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers: requestHeaders,
    };

    // Add body if provided
    if (body !== undefined) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, requestOptions);
      
      // Handle different content types
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle authentication errors
      if (response.status === 401 && requireAuth) {
        this.handleAuthError();
        throw new Error('Authentication required. Please login first.');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorMessage = 
          (data && typeof data === 'object' && (data.error || data.message)) || 
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`[API_CLIENT] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body,
    });
  }

  /**
   * Make request without authentication (for public endpoints)
   */
  async public<T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'requireAuth'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      requireAuth: false,
    });
  }

  /**
   * Upload file with authentication
   */
  async upload<T = any>(
    endpoint: string,
    file: File | FormData,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    const { headers, ...restOptions } = options;

    // Don't set Content-Type for FormData, let browser handle it
    const uploadHeaders: Record<string, string> = { ...(headers || {}) };
    if (file instanceof FormData) {
      delete uploadHeaders['Content-Type'];
    }

    return this.request<T>(endpoint, {
      ...restOptions,
      method: 'POST',
      headers: uploadHeaders,
      body: file,
    });
  }

  /**
   * Download file with authentication
   */
  async download(endpoint: string, filename?: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<void> {
    try {
      const authHeaders = this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        method: 'GET',
        headers: {
          ...authHeaders,
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[API_CLIENT] Download failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances if needed
export { ApiClient };

/**
 * Typed API helpers for common endpoints
 */
export const api = {
  // Customer endpoints
  customer: {
    profile: () => apiClient.get('/api/customer/profile'),
    updateProfile: (data: any) => apiClient.put('/api/customer/profile', data),
    checkout: (data: any) => apiClient.post('/api/customer/checkout', data),
    transactions: () => apiClient.get('/api/customer/transactions'),
    transaction: (id: string) => apiClient.get(`/api/customer/transactions/${id}`),
  },

  // Payment endpoints
  payment: {
    create: (data: any) => apiClient.post('/api/customer/payment/create', data),
    status: (id: string) => apiClient.get(`/api/customer/payment/status/${id}`),
    methods: () => apiClient.get('/api/customer/payment/methods'),
  },

  // Voucher endpoints
  voucher: {
    check: (data: any) => apiClient.post('/api/voucher/check', data),
    apply: (code: string) => apiClient.post('/api/voucher/apply', { code }),
  },

  // WhatsApp endpoints
  whatsapp: {
    sessions: () => apiClient.get('/api/customer/whatsapp/sessions'),
    createSession: (data: any) => apiClient.post('/api/customer/whatsapp/sessions', data),
    getQR: (sessionId: string) => apiClient.get(`/api/customer/whatsapp/sessions/${sessionId}/qr`),
  },

  // Account endpoints
  account: {
    session: () => apiClient.get('/api/account/session'),
  },

  // Public endpoints (no auth required)
  public: {
    packages: () => apiClient.public('/api/packages'),
    addons: () => apiClient.public('/api/addons'),
    categories: () => apiClient.public('/api/categories'),
  },
};

/**
 * Usage examples:
 * 
 * // Basic usage
 * const profile = await apiClient.get('/api/customer/profile');
 * const checkout = await apiClient.post('/api/customer/checkout', checkoutData);
 * 
 * // Typed helpers
 * const profile = await api.customer.profile();
 * const checkout = await api.customer.checkout(checkoutData);
 * 
 * // Public endpoints (no auth)
 * const packages = await api.public.packages();
 * 
 * // File upload
 * await apiClient.upload('/api/customer/upload-avatar', fileFormData);
 * 
 * // File download
 * await apiClient.download('/api/customer/download-invoice/123', 'invoice.pdf');
 */
