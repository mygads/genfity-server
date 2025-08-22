import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { hasActiveWhatsAppSubscription } from "@/lib/whatsapp-subscription";

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

// POST /api/customer/whatsapp/sessions/[sessionId]/logout - Logout from WhatsApp account
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, message: "Authentication required. Please login first." },
        { status: 401 }
      ));
    }

    // Check if user has active WhatsApp subscription
    const hasSubscription = await hasActiveWhatsAppSubscription(userAuth.id);
    if (!hasSubscription) {
      return withCORS(NextResponse.json(
        { success: false, message: "Active WhatsApp subscription required" },
        { status: 403 }
      ));
    }

    // Check if session exists and belongs to user
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        userId: userAuth.id,
        OR: [
          { sessionId: sessionId },
          { sessionName: sessionId }
        ]
      }
    });

    if (!session) {
      return withCORS(NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      ));
    }

    // Make request to external WhatsApp Go service
    const response = await fetch(`${WHATSAPP_SERVER_API}/session/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': session.token // Use session token for authentication
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
      return withCORS(NextResponse.json({
        success: false,
        error: responseData.error || "Failed to logout from WhatsApp account",
        code: response.status
      }, { status: response.status }));
    }

    // Update session status in database after successful logout
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: {
        loggedIn: false,
        jid: null,
        qrcode: null,
        updatedAt: new Date()
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      code: 200,
      data: {
        message: "Successfully logged out from WhatsApp account",
        details: responseData.data || "Logged out successfully"
      }
    }));

  } catch (error) {
    console.error("[WHATSAPP_SESSION_LOGOUT]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to logout from WhatsApp account" },
      { status: 500 }
    ));
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
