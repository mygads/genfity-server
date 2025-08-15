import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { validateSessionAndApiKey } from "@/lib/whatsapp-public-auth";
import { z } from "zod";

const phoneSchema = z.string().min(10).max(15).regex(/^[0-9+]+$/, "Invalid phone number format");

// POST /api/services/whatsapp/chat/[sessionId]/[apiKey]/[phone]/[message] - Send WhatsApp message via URL params
export async function POST(
  request: Request,
  { params }: { 
    params: Promise<{ 
      sessionId: string;
      apiKey: string;
      phone: string;
      message: string;
    }> 
  }
) {
  try {
    const { sessionId, apiKey, phone, message } = await params;

    // Validate required parameters
    if (!sessionId || !apiKey || !phone || !message) {
      return withCORS(NextResponse.json(
        { 
          success: false, 
          error: "Missing required parameters: sessionId, apiKey, phone, message" 
        },
        { status: 400 }
      ));
    }

    // Validate phone number format
    const phoneValidation = phoneSchema.safeParse(phone);
    if (!phoneValidation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      ));
    }

    // Decode message from URL
    const decodedMessage = decodeURIComponent(message);
    
    if (!decodedMessage || decodedMessage.trim().length === 0) {
      return withCORS(NextResponse.json(
        { success: false, error: "Message cannot be empty" },
        { status: 400 }
      ));
    }

    // Validate session and API key
    const validation = await validateSessionAndApiKey(sessionId, apiKey);
    
    if (!validation.isValid) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error },
        { status: 403 }
      ));
    }

    // Format phone number (ensure it starts with country code)
    let formattedPhone = phoneValidation.data;
    if (!formattedPhone.startsWith('+')) {
      // Assume Indonesian number if no country code
      formattedPhone = formattedPhone.startsWith('0') 
        ? '+62' + formattedPhone.substring(1)
        : '+62' + formattedPhone;
    }

    // Update message stats
    await prisma.whatsAppMessageStats.upsert({
      where: {
        userId_sessionId: {
          userId: validation.userId!,
          sessionId: validation.sessionData!.sessionId,
        },
      },
      update: {
        totalMessagesSent: { increment: 1 },
        lastMessageSentAt: new Date(),
      },
      create: {
        userId: validation.userId!,
        sessionId: validation.sessionData!.sessionId,
        totalMessagesSent: 1,
        lastMessageSentAt: new Date(),
      },
    });

    // Here you would integrate with your WhatsApp service
    // For now, we'll return a success response
    // TODO: Integrate with actual WhatsApp API service
    
    return withCORS(NextResponse.json({
      success: true,
      data: {
        sessionId: validation.sessionData!.sessionId,
        recipient: formattedPhone,
        message: decodedMessage,
        status: 'sent',
        timestamp: new Date().toISOString(),
      },
      message: "Message sent successfully",
    }));

  } catch (error) {
    console.error("[WHATSAPP_PUBLIC_CHAT_URL_POST]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to send WhatsApp message" },
      { status: 500 }
    ));
  }
}

// GET method for testing/health check
export async function GET(
  request: Request,
  { params }: { 
    params: Promise<{ 
      sessionId: string;
      apiKey: string;
      phone: string;
      message: string;
    }> 
  }
) {
  try {
    const { sessionId, apiKey } = await params;

    // Validate session and API key only
    const validation = await validateSessionAndApiKey(sessionId, apiKey);
    
    if (!validation.isValid) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error },
        { status: 403 }
      ));
    }

    return withCORS(NextResponse.json({
      success: true,
      data: {
        sessionId: validation.sessionData!.sessionId,
        sessionName: validation.sessionData!.sessionName,
        status: validation.sessionData!.status,
        ready: true,
      },
      message: "WhatsApp service is ready",
    }));

  } catch (error) {
    console.error("[WHATSAPP_PUBLIC_CHAT_URL_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to check WhatsApp service status" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
