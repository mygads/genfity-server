import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  try {
    // Get authenticated user with detailed information
    const { getDetailedUserAuth } = await import("@/lib/auth-helpers");
    const authResult = await getDetailedUserAuth(request);
    
    if (!authResult?.id) {
      return withCORS(NextResponse.json({ 
        success: false,
        authenticated: false, 
        session: null,
        error: "Authentication required"
      }, { status: 401 }));
    }

    return withCORS(NextResponse.json({ 
      success: true,
      authenticated: true, 
      session: {
        user: {
          id: authResult.id,
          email: authResult.email,
          role: authResult.role,
          name: authResult.name,
          phone: authResult.phone,
          image: authResult.image,
          emailVerified: authResult.emailVerified,
          phoneVerified: authResult.phoneVerified
        }
      }
    }, { status: 200 }));
  } catch (error) {
    console.error('Session validation error:', error);
    return withCORS(NextResponse.json({ 
      success: false,
      authenticated: false,
      session: null,
      error: "Session validation failed"
    }, { status: 500 }));
  }
}
