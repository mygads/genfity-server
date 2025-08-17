import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/admin-auth';
import WhatsAppMessageTracker from '@/lib/whatsapp-message-tracker';

// GET /api/whatsapp/message-stats - Get user's message statistics
export async function GET(request: NextRequest) {
  try {
    const userVerification = await verifyUserToken(request);
    if (!userVerification.success) {
      return NextResponse.json({ error: userVerification.error }, { status: 401 });
    }

    const userId = userVerification.userId;

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    // Get user's overall message statistics
    const userStats = await WhatsAppMessageTracker.getUserTotalStats(userId);

    // Get session statistics if sessionId is provided
    let sessionStats = null;
    if (sessionId) {
      sessionStats = await WhatsAppMessageTracker.getSessionStatsWithUserId(userId, sessionId);
    }

    // Get all user's sessions with their stats
    const sessionsList = await WhatsAppMessageTracker.getUserSessionsStats(userId);

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
    const userVerification = await verifyUserToken(request);
    if (!userVerification.success) {
      return NextResponse.json({ error: userVerification.error }, { status: 401 });
    }

    const userId = userVerification.userId;

    const body = await request.json();
    const { sessionId, isSuccess } = body;

    if (!sessionId || typeof isSuccess !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId (string), isSuccess (boolean)' },
        { status: 400 }
      );
    }

    const result = await WhatsAppMessageTracker.updateMessageCounter({
      userId: userId,
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
