import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { hasActiveWhatsAppSubscription } from "@/lib/whatsapp-subscription";

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

// GET /api/customer/whatsapp/sessions/[sessionId]/status - Get session status from WhatsApp server
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

    // Make request to external WhatsApp Go service
    const response = await fetch(`${WHATSAPP_SERVER_API}/session/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': session.token // Use session token for authentication
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
      return withCORS(NextResponse.json({
        success: false,
        error: responseData.error || "Failed to get session status",
        code: response.status
      }, { status: response.status }));
    }

    // Update session status in database based on external service response
    if (responseData.success && responseData.data) {
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: {
          connected: responseData.data.connected || false,
          loggedIn: responseData.data.loggedIn || false,
          jid: responseData.data.jid || null,
          qrcode: responseData.data.qrcode || null,
          events: responseData.data.events || session.events,
          updatedAt: new Date()
        }
      });
    }

    return withCORS(NextResponse.json({
      success: true,
      code: 200,
      data: {
        connected: responseData.data?.connected || false,
        events: responseData.data?.events || session.events || "All",
        id: session.sessionId,
        jid: responseData.data?.jid || "",
        loggedIn: responseData.data?.loggedIn || false,
        name: session.sessionName,
        proxy_config: {
          enabled: session.proxyEnabled || false,
          proxy_url: session.proxyUrl || ""
        },
        proxy_url: session.proxyUrl || "",
        qrcode: responseData.data?.qrcode || "",
        s3_config: {
          access_key: session.s3AccessKey ? "***" : "",
          bucket: session.s3Bucket || "",
          enabled: session.s3Enabled || false,
          endpoint: session.s3Endpoint || "",
          media_delivery: session.s3MediaDelivery || "base64",
          path_style: session.s3PathStyle || false,
          public_url: session.s3PublicUrl || "",
          region: session.s3Region || "",
          retention_days: session.s3RetentionDays || 30
        },
        token: session.token,
        webhook: session.webhook || ""
      }
    }));

  } catch (error) {
    console.error("[WHATSAPP_SESSION_STATUS]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to get WhatsApp session status" },
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
