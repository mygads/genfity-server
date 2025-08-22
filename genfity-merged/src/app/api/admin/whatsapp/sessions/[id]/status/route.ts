import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

// GET /api/admin/whatsapp/sessions/[id]/status - Get session status from WhatsApp server
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!WHATSAPP_SERVER_API) {
      return NextResponse.json({ 
        success: false, 
        error: 'WhatsApp service configuration missing' 
      }, { status: 500 });
    }

    const { id } = await params;

    // Check if session exists in database
    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionId: id }
    });

    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session not found' 
      }, { status: 404 });
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
      return NextResponse.json({
        success: false,
        error: responseData.error || "Failed to get session status",
        code: response.status
      }, { status: response.status });
    }

    // Update session status in database based on external service response
    if (responseData.success && responseData.data) {
      await prisma.whatsAppSession.update({
        where: { sessionId: id },
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

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error("[ADMIN_WHATSAPP_SESSION_STATUS]", error);
    return NextResponse.json(
      { success: false, error: "Failed to get WhatsApp session status" },
      { status: 500 }
    );
  }
}
