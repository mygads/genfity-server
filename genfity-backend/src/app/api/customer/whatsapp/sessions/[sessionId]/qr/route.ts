import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { hasActiveWhatsAppSubscription } from "@/lib/whatsapp-subscription";
import QRCode from "qrcode";

// GET /api/customer/whatsapp/sessions/[sessionId]/qr - Get QR code for session
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

    // Check if session exists and belongs to user - support both sessionId and sessionName
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        userId: userAuth.id,
        OR: [
          { sessionId: sessionId },
          { sessionName: sessionId }
        ]
      },
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        status: true,
        qr: true,
        message: true,
      }
    });

    if (!session) {
      return withCORS(NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      ));
    }

    // Generate QR code if session is disconnected and doesn't have one
    let qrCodeData = session.qr;
    let qrMessage = session.message;

    if (session.status === 'disconnected' && !session.qr) {
      try {
        // Generate a QR code string for WhatsApp session connection
        // In a real implementation, this would be the actual WhatsApp connection QR
        const qrContent = `whatsapp-session-${session.sessionId}-${Date.now()}`;
        qrCodeData = await QRCode.toDataURL(qrContent, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        qrMessage = "Scan this QR code with WhatsApp to connect your session";

        // Update the session with the generated QR code
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { 
            qr: qrCodeData,
            message: qrMessage 
          }
        });
      } catch (error) {
        console.error("[QR_GENERATION_ERROR]", error);
        qrMessage = "Failed to generate QR code. Please try again.";
      }
    }

    return withCORS(NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        status: session.status,
        qr: qrCodeData,
        message: qrMessage || (session.status === 'connected' ? 'Session is connected' : 'QR code ready for scanning'),
        hasQR: !!qrCodeData,
      },
    }));
  } catch (error) {
    console.error("[CUSTOMER_WHATSAPP_SESSION_QR_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch QR code" },
      { status: 500 }
    ));
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}
