import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { hasActiveWhatsAppSubscription, getWhatsAppSubscriptionStatus } from "@/lib/whatsapp-subscription";
import { z } from "zod";

// Generate random string with specified length
function generateRandomId(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const createSessionSchema = z.object({
  sessionName: z.string().min(1, "Session name is required").max(100),
});

// GET /api/customer/whatsapp/sessions - Get user's WhatsApp sessions
export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = { userId: userAuth.id };
    
    if (status) {
      whereClause.status = status;
    }

    const [sessions, total] = await Promise.all([
      prisma.whatsAppSession.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          sessionId: true,
          sessionName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          qr: true,
          message: true,
        },
      }),
      prisma.whatsAppSession.count({ where: whereClause }),
    ]);

    // Get subscription status to include package info
    const subscriptionStatus = await getWhatsAppSubscriptionStatus(userAuth.id);

    return withCORS(NextResponse.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      subscription: {
        packageName: subscriptionStatus.packageName,
        maxSessions: subscriptionStatus.maxSessions,
        currentSessions: subscriptionStatus.currentSessions,
        canCreateMoreSessions: subscriptionStatus.canCreateMoreSessions,
        endDate: subscriptionStatus.endDate
      }
    }));
  } catch (error) {
    console.error("[CUSTOMER_WHATSAPP_SESSIONS_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch WhatsApp sessions" },
      { status: 500 }
    ));
  }
}

// POST /api/customer/whatsapp/sessions - Create new WhatsApp session
export async function POST(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, message: "Authentication required. Please login first." },
        { status: 401 }
      ));
    }

    // Check if user has active WhatsApp subscription
    const subscriptionStatus = await getWhatsAppSubscriptionStatus(userAuth.id);
    if (!subscriptionStatus.hasActiveSubscription) {
      return withCORS(NextResponse.json(
        { success: false, error: "Active WhatsApp subscription required" },
        { status: 403 }
      ));
    }

    console.log('[WHATSAPP_SESSION_CREATE] Subscription status:', {
      packageName: subscriptionStatus.packageName,
      maxSessions: subscriptionStatus.maxSessions,
      currentSessions: subscriptionStatus.currentSessions,
      canCreateMore: subscriptionStatus.canCreateMoreSessions
    });

    // Check if user can create more sessions
    if (!subscriptionStatus.canCreateMoreSessions) {
      return withCORS(NextResponse.json(
        { 
          success: false, 
          error: `Session limit reached. Your package "${subscriptionStatus.packageName}" allows maximum ${subscriptionStatus.maxSessions} sessions. You currently have ${subscriptionStatus.currentSessions} sessions.`,
          details: {
            packageName: subscriptionStatus.packageName,
            maxSessions: subscriptionStatus.maxSessions,
            currentSessions: subscriptionStatus.currentSessions
          }
        },
        { status: 403 }
      ));
    }

    const body = await request.json();
    const validation = createSessionSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { sessionName } = validation.data;
    
    // Generate unique session ID with 10 random characters
    const sessionId = `customer-${userAuth.id}-${generateRandomId(10)}`;

    // Create new session
    const session = await prisma.whatsAppSession.create({
      data: {
        sessionId,
        sessionName,
        userId: userAuth.id,
        status: 'disconnected',
      },
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: session,
      message: "WhatsApp session created successfully",
    }));
  } catch (error) {
    console.error("[CUSTOMER_WHATSAPP_SESSIONS_POST]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to create WhatsApp session" },
      { status: 500 }
    ));
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}
