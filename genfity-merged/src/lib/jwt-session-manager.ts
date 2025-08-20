import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days default

export interface JWTPayload {
  userId: string;
  email?: string;
  role: string;
  sessionId: string;
}

export interface DeviceInfo {
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string;
  browser?: string;
}

/**
 * Generate JWT token and create session in database
 */
export async function generateUserSession(
  userId: string,
  deviceInfo: DeviceInfo = {}
): Promise<{ token: string; sessionId: string; expiresAt: Date }> {
  try {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now    // Create session in database first
    const session = await prisma.userSession.create({
      data: {
        userId,
        token: '', // Will be updated after JWT generation
        deviceInfo: JSON.stringify(deviceInfo),
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        expiresAt,
        isActive: true
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true
      }
    });

    // Create JWT payload
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email || '',
      role: user.role,
      sessionId: session.id
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    } as jwt.SignOptions);

    // Update session with the actual token
    await prisma.userSession.update({
      where: { id: session.id },
      data: { token }
    });

    return {
      token,
      sessionId: session.id,
      expiresAt
    };
  } catch (error) {
    console.error('[JWT_MANAGER] Error generating session:', error);
    throw new Error('Failed to generate user session');
  }
}

/**
 * Verify JWT token and check session in database
 */
export async function verifyUserSession(token: string): Promise<{
  user: { id: string; email: string | null; role: string };
  session: { id: string; lastUsed: Date };
} | null> {  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Check if session exists and is active using the token itself
    const session = await prisma.userSession.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!session || !session.user.isActive) {
      return null;
    }

    // Update last used timestamp
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastUsed: new Date() }
    });

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      session: {
        id: session.id,
        lastUsed: session.lastUsed
      }
    };
  } catch (error) {
    console.error('[JWT_MANAGER] Error verifying session:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header (Bearer token)
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Priority 1: Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Priority 2: Check cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('auth-token=')) {
        return cookie.substring('auth-token='.length);
      }
    }
  }
  
  return null;
}

/**
 * Get device info from request
 */
export function getDeviceInfoFromRequest(request: NextRequest): DeviceInfo {
  const userAgent = request.headers.get('user-agent') || '';
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwarded?.split(',')[0] || realIp || '';

  return {
    userAgent,
    ipAddress,
    deviceType: getUserDeviceType(userAgent),
    browser: getUserBrowser(userAgent)
  };
}

/**
 * Revoke user session by token (logout)
 */
export async function revokeSessionByToken(token: string): Promise<boolean> {
  try {
    await prisma.userSession.updateMany({
      where: { 
        token,
        isActive: true 
      },
      data: { isActive: false }
    });
    return true;
  } catch (error) {
    console.error('[JWT_MANAGER] Error revoking session by token:', error);
    return false;
  }
}

/**
 * Revoke user session (logout) - deprecated, use revokeSessionByToken
 */
export async function revokeUserSession(sessionId: string): Promise<boolean> {
  try {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });
    return true;
  } catch (error) {
    console.error('[JWT_MANAGER] Error revoking session:', error);
    return false;
  }
}

/**
 * Revoke all user sessions (logout from all devices)
 */
export async function revokeAllUserSessions(userId: string): Promise<boolean> {
  try {
    await prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false }
    });
    return true;
  } catch (error) {
    console.error('[JWT_MANAGER] Error revoking all sessions:', error);
    return false;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false, updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7 days old inactive sessions
        ]
      }
    });
    return result.count;
  } catch (error) {
    console.error('[JWT_MANAGER] Error cleaning up sessions:', error);
    return 0;
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserActiveSessions(userId: string) {
  try {
    return await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        lastUsed: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { lastUsed: 'desc' }
    });
  } catch (error) {
    console.error('[JWT_MANAGER] Error getting user sessions:', error);
    return [];
  }
}

// Helper functions
function getUserDeviceType(userAgent: string): string {
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    return 'mobile';
  } else if (/Tablet|iPad/i.test(userAgent)) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

function getUserBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}
