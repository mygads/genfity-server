import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromRequest, revokeSessionByToken, revokeAllUserSessions, verifyUserSession } from '@/lib/jwt-session-manager';
import { withCORS, corsOptionsResponse } from '@/lib/cors';

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get('origin') || undefined);
}

// Helper function to create CORS-enabled JSON responses
function createCorsResponse(data: any, options: { status?: number } = {}, request: NextRequest) {
  const response = NextResponse.json(data, options);
  return withCORS(response, request.headers.get('origin') || undefined);
}

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromRequest(request);
      if (!token) {
      return createCorsResponse({
        success: false,
        error: 'Authentication required. Please provide a valid token.'
      }, { status: 401 }, request);
    }

    // Verify token to get user info
    const auth = await verifyUserSession(token);
      if (!auth) {
      return createCorsResponse({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 }, request);
    }

    const body = await request.json().catch(() => ({}));
    const { logoutAll = false } = body;

    if (logoutAll) {      // Logout from all devices
      const success = await revokeAllUserSessions(auth.user.id);
      
      return createCorsResponse({
        success,
        message: success ? 'Logged out from all devices' : 'Logout failed'
      }, {}, request);
    } else {      // Logout from current device only (revoke current token)
      const success = await revokeSessionByToken(token);
      
      return createCorsResponse({
        success,
        message: success ? 'Logged out successfully' : 'Logout failed'
      }, {}, request);
    }
  } catch (error) {
    console.error('[AUTH_LOGOUT] Error:', error);
    return createCorsResponse({
      success: false,
      error: 'Logout failed',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 }, request);
  }
}
