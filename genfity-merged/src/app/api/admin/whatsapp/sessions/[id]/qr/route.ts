import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

// GET /api/admin/whatsapp/sessions/[id]/qr - Get QR code for session
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
        return NextResponse.json({
          success: false,
          code: 500,
          error: "no session"
        }, { status: 500 });
      }

      return NextResponse.json({
        success: false,
        error: responseData.error || "Failed to get QR code",
        code: response.status
      }, { status: response.status });
    }

    // Update QR code in database if successful
    if (responseData.success && responseData.data?.QRCode) {
      await prisma.whatsAppSession.update({
        where: { sessionId: id },
        data: {
          qrcode: responseData.data.QRCode,
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        QRCode: responseData.data?.QRCode || ""
      }
    });

  } catch (error) {
    console.error("[ADMIN_WHATSAPP_SESSION_QR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to get WhatsApp QR code" },
      { status: 500 }
    );
  }
}
