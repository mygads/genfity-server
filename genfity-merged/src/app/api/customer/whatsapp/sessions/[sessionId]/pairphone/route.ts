import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { hasActiveWhatsAppSubscription } from "@/lib/whatsapp-subscription";
import { z } from "zod";

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

const pairPhoneSchema = z.object({
  Phone: z.string().regex(/^(\+?[1-9]\d{1,14})$/, "Phone number must be in international format without leading 0")
});

// POST /api/customer/whatsapp/sessions/[sessionId]/pairphone - Pair phone with session
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
    const validation = pairPhoneSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: "Invalid phone number format. Use international format without leading 0 (e.g., 6281233784490)", details: validation.error.errors },
        { status: 400 }
      ));
    }

    const { Phone } = validation.data;

    // Format phone number to ensure it has country code
    const formattedPhone = Phone.replace(/\D/g, ''); // Remove non-digits
    if (!formattedPhone.startsWith('62') && !formattedPhone.startsWith('1') && !formattedPhone.startsWith('61')) {
      // If no country code detected, assume it needs one
      return withCORS(NextResponse.json(
        { success: false, error: "Phone number must include country code (e.g., 62 for Indonesia)" },
        { status: 400 }
      ));
    }

    // Make request to external WhatsApp Go service
    const response = await fetch(`${WHATSAPP_SERVER_API}/session/pairphone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': session.token // Use session token for authentication
      },
      body: JSON.stringify({
        Phone: formattedPhone
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      return withCORS(NextResponse.json({
        success: false,
        error: responseData.error || "Failed to generate pairing code",
        code: response.status
      }, { status: response.status }));
    }

    return withCORS(NextResponse.json({
      success: true,
      code: 200,
      data: {
        LinkingCode: responseData.data?.LinkingCode || ""
      }
    }));

  } catch (error) {
    console.error("[WHATSAPP_SESSION_PAIRPHONE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to generate pairing code" },
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
