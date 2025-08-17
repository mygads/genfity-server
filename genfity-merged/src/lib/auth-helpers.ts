import { verifyUserSession, extractTokenFromRequest } from "./jwt-session-manager";
import { NextRequest } from "next/server";

export interface UserAuthInfo {
  id: string;
  email: string;
  role: string;
  sessionId?: string;
  name?: string;
  phone?: string;
  image?: string;
  emailVerified?: Date | null;
  phoneVerified?: Date | null;
}

/**
 * Get user authentication information from JWT token
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
 * Universal token-based authentication for /api/account routes
 * Works for all authenticated users (customer, admin, super_admin)
 */
export async function getUserFromToken(request: Request | NextRequest): Promise<UserAuthInfo | null> {
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
    console.error('[AUTH_HELPERS] Error getting user from token:', error);
    return null;
  }
}

/**
 * Get detailed user authentication information with full user data
 * Used for /api/auth/session endpoint
 */
export async function getDetailedUserAuth(request: Request | NextRequest): Promise<UserAuthInfo | null> {
  try {
    // Check JWT token in Authorization header
    const token = extractTokenFromRequest(request as NextRequest);
    if (!token) {
      return null;
    }

    const sessionData = await verifyUserSession(token);
    if (!sessionData) {
      return null;
    }

    // Get full user data from database
    const user = await getUserFullData(sessionData.user.id);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      image: user.image,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      sessionId: sessionData.session.id
    };
  } catch (error) {
    console.error('[AUTH_HELPERS] Error getting detailed user auth:', error);
    return null;
  }
}

/**
 * Get full user data from database
 */
async function getUserFullData(userId: string) {
  try {
    const { prisma } = await import('./prisma');
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        phoneVerified: true,
        isActive: true
      }
    });
  } catch (error) {
    console.error('[AUTH_HELPERS] Error getting user full data:', error);
    return null;
  }
}
