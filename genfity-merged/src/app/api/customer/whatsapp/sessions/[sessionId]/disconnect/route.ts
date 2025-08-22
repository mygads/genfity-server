import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { hasActiveWhatsAppSubscription } from "@/lib/whatsapp-subscription";

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

// POST /api/customer/whatsapp/sessions/[sessionId]/disconnect - Disconnect session from WhatsApp server
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
    const response = await fetch(`${WHATSAPP_SERVER_API}/session/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': session.token // Use session token for authentication
      }
    });

    // Update session connection status in database regardless of response
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: {
        connected: false,
        updatedAt: new Date()
      }
    });

    // Note: Disconnect feature is still in development and may have bugs
    if (!response.ok) {
      const responseData = await response.json().catch(() => ({}));
      
      return withCORS(NextResponse.json({
        success: false,
        error: "Disconnect feature is still in development and may have bugs. Session status updated in database.",
        details: responseData.error || "External service error",
        code: response.status,
        warning: "This feature is experimental"
      }, { status: 200 })); // Return 200 since we updated local status
    }

    const responseData = await response.json();

    return withCORS(NextResponse.json({
      success: true,
      code: 200,
      data: {
        message: "Session disconnected successfully",
        details: responseData.data || "Disconnected from WhatsApp server"
      },
      warning: "Disconnect feature is still in development"
    }));

  } catch (error) {
    console.error("[WHATSAPP_SESSION_DISCONNECT]", error);
    
    // Still try to update database status even if external call fails
    try {
      const session = await prisma.whatsAppSession.findFirst({
        where: {
          userId: (await getCustomerAuth(request))?.id,
          OR: [
            { sessionId: (await params).sessionId },
            { sessionName: (await params).sessionId }
          ]
        }
      });

      if (session) {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            connected: false,
            updatedAt: new Date()
          }
        });
      }
    } catch (dbError) {
      console.error("[WHATSAPP_SESSION_DISCONNECT_DB]", dbError);
    }

    return withCORS(NextResponse.json({
      success: false,
      error: "Failed to disconnect session, but local status updated",
      warning: "Disconnect feature is still in development and may have bugs"
    }, { status: 500 }));
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
