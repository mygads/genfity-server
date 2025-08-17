import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { validateSessionAndApiKey } from "@/lib/whatsapp-public-auth";
import { z } from "zod";

const sendMessageSchema = z.object({
  phone: z.string().min(10).max(15).regex(/^[0-9+]+$/, "Invalid phone number format"),
  contentType: z.enum(['text', 'image', 'document', 'audio', 'video']).default('text'),
  content: z.string().min(1, "Content cannot be empty"),
  fileName: z.string().optional(), // For file uploads
  caption: z.string().optional(), // For media with caption
});

// POST /api/services/whatsapp/chat/[sessionId]/[apiKey] - Send WhatsApp message via body
export async function POST(
  request: Request,
  { params }: { 
    params: Promise<{ 
      sessionId: string;
      apiKey: string;
    }> 
  }
) {
  try {
    const { sessionId, apiKey } = await params;

    // Validate required parameters
    if (!sessionId || !apiKey) {
      return withCORS(NextResponse.json(
        { 
          success: false, 
          error: "Missing required parameters: sessionId, apiKey" 
        },
        { status: 400 }
      ));
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);
    
    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { phone, contentType, content, fileName, caption } = validation.data;

    // Validate session and API key
    const sessionValidation = await validateSessionAndApiKey(sessionId, apiKey);
    
    if (!sessionValidation.isValid) {
      return withCORS(NextResponse.json(
        { success: false, error: sessionValidation.error },
        { status: 403 }
      ));
    }

    // Format phone number (ensure it starts with country code)
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      // Assume Indonesian number if no country code
      formattedPhone = formattedPhone.startsWith('0') 
        ? '+62' + formattedPhone.substring(1)
        : '+62' + formattedPhone;
    }

    // Update message stats
    try {
      await prisma.whatsAppMessageStats.upsert({
        where: {
          userId_sessionId: {
            userId: sessionValidation.userId!,
            sessionId: sessionValidation.sessionData!.sessionId,
          },
        },
        update: {
          totalMessagesSent: { increment: 1 },
          lastMessageSentAt: new Date(),
        },
        create: {
          userId: sessionValidation.userId!,
          sessionId: sessionValidation.sessionData!.sessionId,
          totalMessagesSent: 1,
          lastMessageSentAt: new Date(),
        },
      });
    } catch (statsError) {
      console.error("Error updating message stats:", statsError);
      // Continue execution even if stats update fails
    }

    // Prepare message data for WhatsApp service
    const messageData = {
      sessionId: sessionValidation.sessionData!.sessionId,
      recipient: formattedPhone,
      contentType,
      content,
      fileName,
      caption,
      timestamp: new Date().toISOString(),
    };

    // Here you would integrate with your WhatsApp service
    // For now, we'll return a success response
    // TODO: Integrate with actual WhatsApp API service
    
    return withCORS(NextResponse.json({
      success: true,
      data: messageData,
      message: `${contentType} message sent successfully`,
    }));

  } catch (error) {
    console.error("[WHATSAPP_PUBLIC_CHAT_BODY_POST]", error);
    
    // Try to update failed message stats
    try {
      const { sessionId, apiKey } = await params;
      const sessionValidation = await validateSessionAndApiKey(sessionId, apiKey);
      
      if (sessionValidation.isValid) {
        await prisma.whatsAppMessageStats.upsert({
          where: {
            userId_sessionId: {
              userId: sessionValidation.userId!,
              sessionId: sessionValidation.sessionData!.sessionId,
            },
          },
          update: {
            totalMessagesFailed: { increment: 1 },
            lastMessageFailedAt: new Date(),
          },
          create: {
            userId: sessionValidation.userId!,
            sessionId: sessionValidation.sessionData!.sessionId,
            totalMessagesFailed: 1,
            lastMessageFailedAt: new Date(),
          },
        });
      }
    } catch (statsError) {
      console.error("Error updating failed message stats:", statsError);
    }

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

    // Get message stats
    const messageStats = await prisma.whatsAppMessageStats.findUnique({
      where: {
        userId_sessionId: {
          userId: validation.userId!,
          sessionId: validation.sessionData!.sessionId,
        },
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: {
        sessionId: validation.sessionData!.sessionId,
        sessionName: validation.sessionData!.sessionName,
        status: validation.sessionData!.status,
        ready: validation.sessionData!.status === 'connected',
        stats: messageStats ? {
          totalMessagesSent: messageStats.totalMessagesSent,
          totalMessagesFailed: messageStats.totalMessagesFailed,
          lastMessageSentAt: messageStats.lastMessageSentAt,
          lastMessageFailedAt: messageStats.lastMessageFailedAt,
        } : null,
      },
      message: "WhatsApp service status retrieved",
    }));

  } catch (error) {
    console.error("[WHATSAPP_PUBLIC_CHAT_BODY_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to check WhatsApp service status" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
