import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

// POST /api/admin/whatsapp/sessions/[id]/disconnect - Disconnect session from WhatsApp server
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
    const response = await fetch(`${WHATSAPP_SERVER_API}/session/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': session.token // Use session token for authentication
      }
    });

    // Update session connection status in database regardless of response
    await prisma.whatsAppSession.update({
      where: { sessionId: id },
      data: {
        connected: false,
        updatedAt: new Date()
      }
    });

    // Note: Disconnect feature is still in development and may have bugs
    if (!response.ok) {
      const responseData = await response.json().catch(() => ({}));
      
      return NextResponse.json({
        success: false,
        error: "Disconnect feature is still in development and may have bugs. Session status updated in database.",
        details: responseData.error || "External service error",
        code: response.status,
        warning: "This feature is experimental"
      }, { status: 200 }); // Return 200 since we updated local status
    }

    const responseData = await response.json();

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        message: "Session disconnected successfully",
        details: responseData.data || "Disconnected from WhatsApp server"
      },
      warning: "Disconnect feature is still in development"
    });

  } catch (error) {
    console.error("[ADMIN_WHATSAPP_SESSION_DISCONNECT]", error);
    
    // Still try to update database status even if external call fails
    try {
      const { id } = await params;
      const session = await prisma.whatsAppSession.findUnique({
        where: { sessionId: id }
      });

      if (session) {
        await prisma.whatsAppSession.update({
          where: { sessionId: id },
          data: {
            connected: false,
            updatedAt: new Date()
          }
        });
      }
    } catch (dbError) {
      console.error("[ADMIN_WHATSAPP_SESSION_DISCONNECT_DB]", dbError);
    }

    return NextResponse.json({
      success: false,
      error: "Failed to disconnect session, but local status updated",
      warning: "Disconnect feature is still in development and may have bugs"
    }, { status: 500 });
  }
}
