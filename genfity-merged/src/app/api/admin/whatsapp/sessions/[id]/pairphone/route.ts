import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from "zod";

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;

const pairPhoneSchema = z.object({
  Phone: z.string().regex(/^(\+?[1-9]\d{1,14})$/, "Phone number must be in international format without leading 0")
});

// POST /api/admin/whatsapp/sessions/[id]/pairphone - Pair phone with session
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
    const validation = pairPhoneSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format. Use international format without leading 0 (e.g., 6281233784490)", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { Phone } = validation.data;

    // Format phone number to ensure it has country code
    const formattedPhone = Phone.replace(/\D/g, ''); // Remove non-digits
    if (!formattedPhone.startsWith('62') && !formattedPhone.startsWith('1') && !formattedPhone.startsWith('61')) {
      // If no country code detected, assume it needs one
      return NextResponse.json(
        { success: false, error: "Phone number must include country code (e.g., 62 for Indonesia)" },
        { status: 400 }
      );
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
      return NextResponse.json({
        success: false,
        error: responseData.error || "Failed to generate pairing code",
        code: response.status
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        LinkingCode: responseData.data?.LinkingCode || ""
      }
    });

  } catch (error) {
    console.error("[ADMIN_WHATSAPP_SESSION_PAIRPHONE]", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate pairing code" },
      { status: 500 }
    );
  }
}
