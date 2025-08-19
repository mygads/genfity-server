import { NextRequest, NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { revokeSessionByToken, extractTokenFromRequest } from "@/lib/jwt-session-manager";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      return withCORS(NextResponse.json({
        success: false,
        message: "No authentication token provided"
      }, { status: 400 }));
    }

    // Revoke the session in database
    const revoked = await revokeSessionByToken(token);
    
    if (!revoked) {
      return withCORS(NextResponse.json({
        success: false,
        message: "Session not found or already expired"
      }, { status: 404 }));
    }

    return withCORS(NextResponse.json({
      success: true,
      message: "Logged out successfully"
    }));

  } catch (error) {
    console.error('Logout error:', error);
    return withCORS(NextResponse.json({
      success: false,
      message: "Logout failed"
    }, { status: 500 }));
  }
}