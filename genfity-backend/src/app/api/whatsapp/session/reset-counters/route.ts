import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import WhatsAppMessageTracker from '@/lib/whatsapp-message-tracker';

// POST /api/whatsapp/session/reset-counters - Reset session message counters
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        userId: session.user.id,
      },
    });

    if (!whatsappSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    const result = await WhatsAppMessageTracker.resetSessionCounters(
      session.user.id,
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
