/**
 * Server-side Authentication Request Utilities
 * 
 * This module provides authentication utilities focused on JWT Bearer tokens
 * in Authorization headers for proper API authentication.
 */

import { NextRequest } from "next/server";
import { verifyUserSession } from "./jwt-session-manager";
import { UserAuthInfo } from "./auth-helpers";

/**
 * Extract JWT token from Authorization header (Bearer token)
 * This is the standard and recommended way for API authentication
 */
export function extractTokenFromRequest(request: NextRequest | Request): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Enhanced customer authentication using JWT Bearer tokens
 * This replaces getCustomerAuth with better error handling
 */
export async function authenticateCustomerRequest(request: NextRequest | Request): Promise<UserAuthInfo | null> {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      // Fallback: Check headers set by middleware
      if ('headers' in request) {
        const userId = request.headers.get('x-user-id');
        const userEmail = request.headers.get('x-user-email');
        const userRole = request.headers.get('x-user-role');
        const sessionId = request.headers.get('x-session-id');

        if (userId) {
          return {
            id: userId,
            email: userEmail || '',
            role: userRole || 'customer',
            sessionId: sessionId || undefined
          };
        }
      }
      return null;
    }

    // Verify token with database
    const sessionData = await verifyUserSession(token);
    if (!sessionData) {
      return null;
    }

    return {
      id: sessionData.user.id,
      email: sessionData.user.email || '',
      role: sessionData.user.role,
      sessionId: sessionData.session.id
    };
  } catch (error) {
    console.error('[REQUEST_AUTH] Error authenticating customer request:', error);
    return null;
  }
}

/**
 * Validate authentication and return standardized error response
 */
export async function validateAuthenticationRequired(
  request: NextRequest | Request
): Promise<{ success: true; user: UserAuthInfo } | { success: false; error: string; status: number }> {
  const userAuth = await authenticateCustomerRequest(request);
  
  if (!userAuth?.id) {
    return {
      success: false,
      error: "Authentication required",
      status: 401
    };
  }

  return {
    success: true,
    user: userAuth
  };
}

/**
 * Get user authentication with detailed error information
 */
export async function getAuthenticationDetails(
  request: NextRequest | Request
): Promise<{
  authenticated: boolean;
  user: UserAuthInfo | null;
  tokenSource: 'header' | 'cookie' | 'x-auth-token' | 'middleware' | null;
  error?: string;
}> {
  try {
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const sessionData = await verifyUserSession(token);
      if (sessionData) {
        return {
          authenticated: true,
          user: {
            id: sessionData.user.id,
            email: sessionData.user.email || '',
            role: sessionData.user.role,
            sessionId: sessionData.session.id
          },
          tokenSource: 'header'
        };
      }
    }

    // Check cookie (for NextRequest)
    if (request instanceof NextRequest && request.cookies) {
      const cookieToken = request.cookies.get('genfity-session-token')?.value;
      if (cookieToken) {
        const sessionData = await verifyUserSession(cookieToken);
        if (sessionData) {
          return {
            authenticated: true,
            user: {
              id: sessionData.user.id,
              email: sessionData.user.email || '',
              role: sessionData.user.role,
              sessionId: sessionData.session.id
            },
            tokenSource: 'cookie'
          };
        }
      }
    }

    // Check X-Auth-Token header
    const authTokenHeader = request.headers.get('x-auth-token');
    if (authTokenHeader) {
      const sessionData = await verifyUserSession(authTokenHeader);
      if (sessionData) {
        return {
          authenticated: true,
          user: {
            id: sessionData.user.id,
            email: sessionData.user.email || '',
            role: sessionData.user.role,
            sessionId: sessionData.session.id
          },
          tokenSource: 'x-auth-token'
        };
      }
    }

    // Check middleware headers
    if ('headers' in request) {
      const userId = request.headers.get('x-user-id');
      const userEmail = request.headers.get('x-user-email');
      const userRole = request.headers.get('x-user-role');
      const sessionId = request.headers.get('x-session-id');

      if (userId) {
        return {
          authenticated: true,
          user: {
            id: userId,
            email: userEmail || '',
            role: userRole || 'customer',
            sessionId: sessionId || undefined
          },
          tokenSource: 'middleware'
        };
      }
    }

    return {
      authenticated: false,
      user: null,
      tokenSource: null,
      error: 'No valid authentication found'
    };
  } catch (error) {
    console.error('[REQUEST_AUTH] Error getting authentication details:', error);
    return {
      authenticated: false,
      user: null,
      tokenSource: null,
      error: 'Authentication validation failed'
    };
  }
}

/**
 * Authentication middleware wrapper for API routes
 * Returns either the authenticated user or an error response
 */
export async function withAuthentication<T>(
  request: NextRequest | Request,
  handler: (user: UserAuthInfo, request: NextRequest | Request) => Promise<T>
): Promise<T | { success: false; error: string; status: number }> {
  const authResult = await validateAuthenticationRequired(request);
  
  if (!authResult.success) {
    return authResult;
  }

  return await handler(authResult.user, request);
}

/**
 * Role-based authentication wrapper
 */
export async function withRoleAuthentication<T>(
  request: NextRequest | Request,
  allowedRoles: string[],
  handler: (user: UserAuthInfo, request: NextRequest | Request) => Promise<T>
): Promise<T | { success: false; error: string; status: number }> {
  const authResult = await validateAuthenticationRequired(request);
  
  if (!authResult.success) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      success: false,
      error: "Insufficient permissions",
      status: 403
    };
  }

  return await handler(authResult.user, request);
}

/**
 * Create authentication headers for debugging purposes
 */
export function createAuthDebugInfo(request: NextRequest | Request): Record<string, any> {
  const headers: Record<string, any> = {};
  
  // Check all possible authentication sources
  headers.authorizationHeader = request.headers.get('authorization');
  headers.xAuthTokenHeader = request.headers.get('x-auth-token');
  headers.xUserIdHeader = request.headers.get('x-user-id');
  
  if (request instanceof NextRequest && request.cookies) {
    headers.sessionCookie = request.cookies.get('genfity-session-token')?.value;
  }
  
  return headers;
}

/**
 * Get authentication error response with proper message
 */
export function getAuthErrorResponse(): {
  success: false;
  error: string;
  message: string;
} {
  return {
    success: false,
    error: "Authentication required",
    message: "Please provide a valid JWT token in Authorization header"
  };
}
