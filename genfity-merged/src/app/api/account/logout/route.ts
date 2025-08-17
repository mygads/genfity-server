import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { revokeSessionByToken, extractTokenFromRequest } from "@/lib/jwt-session-manager";
import { NextRequest } from "next/server";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    // Extract JWT token from Authorization header
    const token = extractTokenFromRequest(request as NextRequest);
    
    if (!token) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "No authentication token found. Please provide a valid token.",
        error: "NO_TOKEN" 
      }, { status: 401 }));
    }

    // Revoke the session in database
    const revoked = await revokeSessionByToken(token);
    
    if (revoked) {
      return withCORS(NextResponse.json({ 
        success: true,
        message: "Logout successful. Session has been invalidated.",
        data: {
          type: "SESSION_LOGOUT",
          timestamp: new Date().toISOString()
        }
      }, { status: 200 }));
    } else {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "Failed to invalidate session.",
        error: "LOGOUT_FAILED"
      }, { status: 500 }));
    }
  } catch (error) {
    console.error('[LOGOUT] Error:', error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: "Internal server error during logout.",
      error: "INTERNAL_SERVER_ERROR"
    }, { status: 500 }));
  }
}
