import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyUserSession, extractTokenFromRequest } from "./jwt-session-manager";
import { NextRequest } from "next/server";

export interface UserAuthInfo {
  id: string;
  email: string;
  role: string;
  sessionId?: string;
}

/**
 * Get user authentication information from JWT token or NextAuth session
 * Priority: JWT Token > NextAuth Session
 * @param request - The request object
 * @returns User auth info or null if not authenticated
 */
export async function getUserAuth(request: Request | NextRequest): Promise<UserAuthInfo | null> {
  try {
    // Priority 1: Check JWT token in Authorization header
    if (request instanceof NextRequest || 'headers' in request) {
      const token = extractTokenFromRequest(request as NextRequest);
      if (token) {
        const sessionData = await verifyUserSession(token);
        if (sessionData) {
          return {
            id: sessionData.user.id,
            email: sessionData.user.email || '',
            role: sessionData.user.role,
            sessionId: sessionData.session.id
          };
        }
      }
    }

    // Priority 2: Check JWT token headers (set by middleware for non-NextRequest)
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

    // Priority 3: Fallback to NextAuth session (for admin/dashboard routes)
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email || '',
        role: session.user.role || 'customer'
      };
    }

    return null;
  } catch (error) {
    console.error('[AUTH_HELPERS] Error getting user auth:', error);
    return null;
  }
}

/**
 * Simplified auth check that only validates JWT token
 * Used for customer API endpoints
 */
export async function getCustomerAuth(request: Request | NextRequest): Promise<UserAuthInfo | null> {
  try {
    // Check JWT token in Authorization header
    const token = extractTokenFromRequest(request as NextRequest);
    if (!token) {
      // Check JWT token headers (set by middleware for non-NextRequest)
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
    console.error('[AUTH_HELPERS] Error getting customer auth:', error);
    return null;
  }
}

/**
 * Admin authentication helper - validates user is authenticated and has admin role
 * Used for admin API endpoints that require admin privileges
 */
export async function getAdminAuth(request: Request | NextRequest): Promise<UserAuthInfo | null> {
  try {
    // Get user authentication using the general getUserAuth function
    const userAuth = await getUserAuth(request);
    
    // Check if user is authenticated and has admin role
    if (!userAuth || userAuth.role !== 'admin') {
      return null;
    }

    return userAuth;
  } catch (error) {
    console.error('[AUTH_HELPERS] Error getting admin auth:', error);
    return null;
  }
}
