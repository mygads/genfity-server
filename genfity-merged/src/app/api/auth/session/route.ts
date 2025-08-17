import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  // Get JWT session user
  const authResult = await getCustomerAuth(request);
  
  if (!authResult) {
    return withCORS(NextResponse.json({ 
      authenticated: false, 
      session: null 
    }, { status: 200 }));
  }

  return withCORS(NextResponse.json({ 
    authenticated: true, 
    session: {
      user: {
        id: authResult.id,
        email: authResult.email,
        role: authResult.role
      }
    }
  }, { status: 200 }));
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
