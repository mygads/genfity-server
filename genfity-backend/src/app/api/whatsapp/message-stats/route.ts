import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import WhatsAppMessageTracker from '@/lib/whatsapp-message-tracker';

// GET /api/whatsapp/message-stats - Get user's message statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    // Get user's overall message statistics
    const userStats = await WhatsAppMessageTracker.getUserTotalStats(session.user.id);

    // Get session statistics if sessionId is provided
    let sessionStats = null;
    if (sessionId) {
      sessionStats = await WhatsAppMessageTracker.getSessionStatsWithUserId(session.user.id, sessionId);
    }

    // Get all user's sessions with their stats
    const sessionsList = await WhatsAppMessageTracker.getUserSessionsStats(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        userStats,
        sessionStats,
        sessionsList,
      },
    });
  } catch (error) {
    console.error('Error getting message stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/message-stats - Record a message sent or failed
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, isSuccess } = body;

    if (!sessionId || typeof isSuccess !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId (string), isSuccess (boolean)' },
        { status: 400 }
      );
    }

    const result = await WhatsAppMessageTracker.updateMessageCounter({
      userId: session.user.id,
      sessionId,
      isSuccess,
    });

    return NextResponse.json({
      success: true,
      data: { updated: result },
    });
  } catch (error) {
    console.error('Error recording message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
