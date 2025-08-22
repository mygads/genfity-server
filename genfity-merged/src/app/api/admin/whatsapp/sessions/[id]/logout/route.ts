import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

// POST /api/admin/whatsapp/sessions/[id]/logout - Logout from WhatsApp account
export async function POST(
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
    const response = await fetch(`${WHATSAPP_SERVER_API}/session/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': session.token // Use session token for authentication
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: responseData.error || "Failed to logout from WhatsApp account",
        code: response.status
      }, { status: response.status });
    }

    // Update session status in database after successful logout
    await prisma.whatsAppSession.update({
      where: { sessionId: id },
      data: {
        loggedIn: false,
        jid: null,
        qrcode: null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        message: "Successfully logged out from WhatsApp account",
        details: responseData.data || "Logged out successfully"
      }
    });

  } catch (error) {
    console.error("[ADMIN_WHATSAPP_SESSION_LOGOUT]", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout from WhatsApp account" },
      { status: 500 }
    );
  }
}
