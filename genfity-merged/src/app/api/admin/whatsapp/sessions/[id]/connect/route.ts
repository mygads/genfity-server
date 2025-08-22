import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from "zod";

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

const connectSchema = z.object({
  Subscribe: z.array(z.string()).optional().default(["Message", "ReadReceipt"]),
  Immediate: z.boolean().optional().default(true)
});

// POST /api/admin/whatsapp/sessions/[id]/connect - Connect session to WhatsApp server
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

    // Validate request body
    const body = await request.json();
    const validation = connectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { Subscribe, Immediate } = validation.data;

    // Make request to external WhatsApp Go service
    const response = await fetch(`${WHATSAPP_SERVER_API}/session/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': session.token // Use session token for authentication
      },
      body: JSON.stringify({
        Subscribe,
        Immediate
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: responseData.error || "Failed to connect session",
        code: response.status
      }, { status: response.status });
    }

    // Update session connection status in database
    await prisma.whatsAppSession.update({
      where: { sessionId: id },
      data: {
        connected: true,
        events: Subscribe.join(', '),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        details: responseData.data?.details || "Connected!",
        events: Subscribe.join(', '),
        jid: responseData.data?.jid || "",
        webhook: responseData.data?.webhook || session.webhook || ""
      }
    });

  } catch (error) {
    console.error("[ADMIN_WHATSAPP_SESSION_CONNECT]", error);
    return NextResponse.json(
      { success: false, error: "Failed to connect WhatsApp session" },
      { status: 500 }
    );
  }
}
