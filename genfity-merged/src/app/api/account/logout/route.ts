import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import jwt from 'jsonwebtoken';
import { tokenBlacklist } from '@/lib/token-blacklist';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    // Cek JWT token di header untuk customer logout
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    
    if (token) {
      try {
        // Verify token validity first
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        // Add token to blacklist - token menjadi tidak berguna
        tokenBlacklist.add(token);
        
        return withCORS(NextResponse.json({ 
          success: true,
          message: "Logout successful. Token has been invalidated.",
          data: {
            type: "JWT_LOGOUT",
            userId: decoded.sub || decoded.id,
            timestamp: new Date().toISOString()
          }
        }, { status: 200 }));
      } catch (jwtError) {
        return withCORS(NextResponse.json({ 
          success: false,
          message: "Invalid or expired token.",
          error: "INVALID_TOKEN"
        }, { status: 401 }));
      }
    }

    // Jika tidak ada token
    return withCORS(NextResponse.json({ 
      success: false,
      message: "No authentication found. Please provide a valid token.",
      error: "NO_AUTHENTICATION" 
    }, { status: 401 }));
  } catch (error) {
    console.error('Logout error:', error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: "Internal server error during logout.",
      error: "INTERNAL_SERVER_ERROR"
    }, { status: 500 }));
  }
}
