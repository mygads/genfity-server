import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { tokenBlacklist } from '@/lib/token-blacklist';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {  try {
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

    // Jika tidak ada JWT token, cek session untuk admin logout
    const session = await getServerSession(authOptions);
    if (session) {
      return withCORS(NextResponse.json({ 
        success: true,
        message: "Admin session logout successful.",
        data: {
          type: "SESSION_LOGOUT",
          userId: session.user?.id,
          timestamp: new Date().toISOString()
        }
      }, { status: 200 }));
    }

    // Jika tidak ada token maupun session
    return withCORS(NextResponse.json({ 
      success: false,
      message: "No authentication found. Please provide a valid token or session.",
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
