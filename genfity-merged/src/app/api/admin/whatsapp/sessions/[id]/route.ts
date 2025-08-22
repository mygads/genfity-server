import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;
const WHATSAPP_ADMIN_TOKEN = process.env.WHATSAPP_ADMIN_TOKEN;

// GET /api/admin/whatsapp/sessions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find session in database first
    const dbSession = await prisma.whatsAppSession.findUnique({
      where: { sessionId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true
          }
        }
      }
    });

    if (!dbSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Format session data
    const formattedSession = {
      id: dbSession.sessionId,
      name: dbSession.sessionName,
      token: dbSession.token,
      webhook: dbSession.webhook,
      events: dbSession.events,
      expiration: dbSession.expiration,
      connected: dbSession.connected,
      loggedIn: dbSession.loggedIn,
      jid: dbSession.jid,
      qrcode: dbSession.qrcode,
      proxy_config: {
        enabled: dbSession.proxyEnabled,
        proxy_url: dbSession.proxyUrl
      },
      s3_config: {
        enabled: dbSession.s3Enabled,
        endpoint: dbSession.s3Endpoint,
        region: dbSession.s3Region,
        bucket: dbSession.s3Bucket,
        access_key: dbSession.s3AccessKey,
        path_style: dbSession.s3PathStyle,
        public_url: dbSession.s3PublicUrl,
        media_delivery: dbSession.s3MediaDelivery,
        retention_days: dbSession.s3RetentionDays
      },
      isSystemSession: dbSession.isSystemSession,
      label: dbSession.isSystemSession ? 'System (Genfity App)' : 'User Session',
      userName: dbSession.user?.name || dbSession.user?.email || 'System',
      userRole: dbSession.user?.role || 'system',
      createdAt: dbSession.createdAt,
      updatedAt: dbSession.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: formattedSession
    });

  } catch (error) {
    console.error('Error fetching WhatsApp session:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch WhatsApp session' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/whatsapp/sessions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!WHATSAPP_SERVER_API || !WHATSAPP_ADMIN_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        error: 'WhatsApp service configuration missing' 
      }, { status: 500 });
    }

    const { id } = await params;

    // Check if session exists and get details
    const dbSession = await prisma.whatsAppSession.findUnique({
      where: { sessionId: id }
    });

    if (!dbSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Prevent deletion of system sessions
    if (dbSession.isSystemSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete system session' 
      }, { status: 400 });
    }

    // Delete from external service first
    const response = await fetch(`${WHATSAPP_SERVER_API}/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': WHATSAPP_ADMIN_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok && response.status !== 404) {
      // If not 404, it's a real error
      throw new Error(`WhatsApp service error: ${response.status}`);
    }

    // Delete from database regardless of external service result
    await prisma.whatsAppSession.delete({
      where: { sessionId: id }
    });

    return NextResponse.json({
      success: true,
      data: { id },
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting WhatsApp session:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete WhatsApp session' 
    }, { status: 500 });
  }
}
