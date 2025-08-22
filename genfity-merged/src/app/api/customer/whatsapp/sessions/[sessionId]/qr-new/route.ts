import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { hasActiveWhatsAppSubscription } from "@/lib/whatsapp-subscription";

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

// GET /api/customer/whatsapp/sessions/[sessionId]/qr - Get QR code for session
export async function GET(
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

    // Make request to external WhatsApp Go service to get QR code
    const response = await fetch(`${WHATSAPP_SERVER_API}/session/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': session.token // Use session token for authentication
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 500 && responseData.error === "no session") {
        return withCORS(NextResponse.json({
          success: false,
          code: 500,
          error: "no session"
        }, { status: 500 }));
      }

      return withCORS(NextResponse.json({
        success: false,
        error: responseData.error || "Failed to get QR code",
        code: response.status
      }, { status: response.status }));
    }

    // Update QR code in database if successful
    if (responseData.success && responseData.data?.QRCode) {
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: {
          qrcode: responseData.data.QRCode,
          updatedAt: new Date()
        }
      });
    }

    return withCORS(NextResponse.json({
      success: true,
      code: 200,
      data: {
        QRCode: responseData.data?.QRCode || ""
      }
    }));

  } catch (error) {
    console.error("[WHATSAPP_SESSION_QR]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to get WhatsApp QR code" },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
