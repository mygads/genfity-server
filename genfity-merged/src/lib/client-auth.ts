/**
 * Client-side Authentication Utilities
 * 
 * This module provides utilities for handling JWT Bearer token authentication
 * on the client side, including token validation and session management.
 * 
 * Key principles:
 * - Uses JWT Bearer tokens in Authorization headers (not cookies)
 * - Stores tokens in localStorage for persistence
 * - Provides automatic token validation with server
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  image?: string | null;
  verification?: {
    emailVerified?: Date | null;
    phoneVerified?: Date | null;
  };
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

export interface AuthResponse {
  success: boolean;
  authenticated: boolean;
  session: AuthSession | null;
  error?: string;
}

/**
 * Storage keys for authentication data
 */
export const AUTH_STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_SESSION: 'user_session',
  THEME: 'theme'
} as const;

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('[CLIENT_AUTH] Error getting auth token:', error);
    return null;
  }
}

/**
 * Set authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
  } catch (error) {
    console.error('[CLIENT_AUTH] Error setting auth token:', error);
  }
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('[CLIENT_AUTH] Error removing auth token:', error);
  }
}

/**
 * Get user session from localStorage
 */
export function getUserSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionData = localStorage.getItem(AUTH_STORAGE_KEYS.USER_SESSION);
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData) as AuthSession;
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      removeUserSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[CLIENT_AUTH] Error getting user session:', error);
    return null;
  }
}

/**
 * Set user session in localStorage
 */
export function setUserSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    // Also set the token separately for easier access
    setAuthToken(session.token);
  } catch (error) {
    console.error('[CLIENT_AUTH] Error setting user session:', error);
  }
}

/**
 * Remove user session from localStorage
 */
export function removeUserSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER_SESSION);
    removeAuthToken();
  } catch (error) {
    console.error('[CLIENT_AUTH] Error removing user session:', error);
  }
}

/**
 * Check if user is authenticated (has valid token and session)
 */
export function isAuthenticated(): boolean {
  const session = getUserSession();
  const token = getAuthToken();
  
  return !!(session && token && Date.now() < session.expiresAt);
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): AuthUser | null {
  const session = getUserSession();
  return session?.user || null;
}

/**
 * Validate authentication with server
 * This function calls the /api/account/session endpoint to verify the token
 */
export async function validateAuthWithServer(): Promise<AuthResponse> {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return {
        success: false,
        authenticated: false,
        session: null,
        error: 'No authentication token found'
      };
    }

    const response = await fetch('/api/account/session', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success || !data.authenticated) {
      // Token is invalid, clear local storage
      removeUserSession();
      return {
        success: false,
        authenticated: false,
        session: null,
        error: data.error || 'Authentication failed'
      };
    }

    // Update local session with server response
    if (data.session) {
      const session: AuthSession = {
        user: data.session.user,
        token: token,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
      setUserSession(session);
    }

    return {
      success: true,
      authenticated: true,
      session: getUserSession(),
    };
  } catch (error) {
    console.error('[CLIENT_AUTH] Error validating auth with server:', error);
    return {
      success: false,
      authenticated: false,
      session: null,
      error: 'Failed to validate authentication'
    };
  }
}

/**
 * Make authenticated API request using token from SessionManager
 * Automatically includes the Authorization header with Bearer token
 */
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Import SessionManager dynamically to avoid SSR issues
  const { SessionManager } = await import('./storage');
  const token = SessionManager.getToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Logout user by clearing local storage and optionally calling logout API
 */
export async function logout(): Promise<void> {
  try {
    const token = getAuthToken();
    
    // Clear local storage first
    removeUserSession();
    
    // Optionally call logout API to invalidate server session
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('[CLIENT_AUTH] Error calling logout API:', error);
      }
    }
  } catch (error) {
    console.error('[CLIENT_AUTH] Error during logout:', error);
  }
}

/**
 * Auto-refresh authentication periodically
 * Call this function to set up automatic token validation
 */
export function setupAutoAuthRefresh(intervalMs: number = 5 * 60 * 1000): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const interval = setInterval(async () => {
    if (isAuthenticated()) {
      await validateAuthWithServer();
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Initialize authentication on app startup
 * Call this in your app's initialization (e.g., _app.tsx or main layout)
 */
export async function initializeAuth(): Promise<AuthResponse> {
  // Check if we have a token in localStorage
  if (!isAuthenticated()) {
    return {
      success: false,
      authenticated: false,
      session: null,
      error: 'No valid authentication found'
    };
  }

  // Validate with server
  return await validateAuthWithServer();
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  
  if (!token) {
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Check if token is expired based on local storage
 */
export function isTokenExpired(): boolean {
  const session = getUserSession();
  if (!session) return true;
  
  return Date.now() > session.expiresAt;
}

/**
 * Handle authentication errors from API responses
 * Call this function when you receive 401 responses
 */
export function handleAuthError(): void {
  console.warn('[CLIENT_AUTH] Authentication error detected, clearing session');
  
  // Import SessionManager dynamically to avoid SSR issues
  if (typeof window !== 'undefined') {
    import('./storage').then(({ SessionManager }) => {
      SessionManager.clearSession();
    });
    
    // Optionally redirect to login page
    window.location.href = '/login';
  }
}
