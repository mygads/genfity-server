import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { hasActiveWhatsAppSubscription } from "@/lib/whatsapp-subscription";
import { z } from "zod";

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

const connectSchema = z.object({
  Subscribe: z.array(z.string()).optional().default(["Message", "ReadReceipt"]),
  Immediate: z.boolean().optional().default(true)
});

// POST /api/customer/whatsapp/sessions/[sessionId]/connect - Connect session to WhatsApp server
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

    // Validate request body
    const body = await request.json();
    const validation = connectSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      ));
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
      return withCORS(NextResponse.json({
        success: false,
        error: responseData.error || "Failed to connect session",
        code: response.status
      }, { status: response.status }));
    }

    // Update session connection status in database
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: {
        connected: true,
        events: Subscribe.join(', '),
        updatedAt: new Date()
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      code: 200,
      data: {
        details: responseData.data?.details || "Connected!",
        events: Subscribe.join(', '),
        jid: responseData.data?.jid || "",
        webhook: responseData.data?.webhook || session.webhook || ""
      }
    }));

  } catch (error) {
    console.error("[WHATSAPP_SESSION_CONNECT]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to connect WhatsApp session" },
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
