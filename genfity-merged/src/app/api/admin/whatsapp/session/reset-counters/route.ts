import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/admin-auth';
import WhatsAppMessageTracker from '@/lib/whatsapp-message-tracker';

// POST /api/whatsapp/session/reset-counters - Reset session message counters
export async function POST(request: NextRequest) {
  try {
    const userVerification = await verifyUserToken(request);
    if (!userVerification.success) {
      return NextResponse.json({ error: userVerification.error }, { status: 401 });
    }

    const userId = userVerification.userId;

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    // Verify that the session belongs to the current user
    const { PrismaClient } = await import('@/generated/prisma');
    const prisma = new PrismaClient();
    
    const whatsappSession = await prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        userId: userId,
      },
    });

    if (!whatsappSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    const result = await WhatsAppMessageTracker.resetSessionCounters(
      userId,
      sessionId
    );

    return NextResponse.json({
      success: true,
      message: 'Session counters reset successfully',
      data: { resetSuccess: result },
    });
  } catch (error) {
    console.error('Error resetting session counters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
