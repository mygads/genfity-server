import { NextResponse } from 'next/server';
import { monitorAndStopStaleSessions, getMonitoredSessions } from '@/lib/session-monitor';
import { withCORS, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptionsResponse();
}

// GET - Check which sessions are being monitored
export async function GET() {
  try {
    const monitoredSessions = await getMonitoredSessions();
    
    return withCORS(NextResponse.json({
      success: true,
      message: 'Retrieved monitored sessions',
      data: {
        monitoredSessions: monitoredSessions.map(session => ({
          sessionId: session.sessionId,
          status: session.status,
          updatedAt: session.updatedAt,
          createdAt: session.createdAt,
          minutesElapsed: Math.floor((Date.now() - session.updatedAt.getTime()) / 60000)
        })),
        total: monitoredSessions.length,
        timeoutMinutes: 10
      },
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('[SESSION_MONITOR_GET] Error:', error);
    return withCORS(NextResponse.json({
      success: false,
      error: 'Failed to get monitored sessions',
      details: (error as Error).message
    }, { status: 500 }));
  }
}

// POST - Manually trigger session monitoring and cleanup
export async function POST() {
  try {
    console.log('[SESSION_MONITOR] Manual trigger started');
    
    const result = await monitorAndStopStaleSessions();
    
    const response = {
      success: true,
      message: 'Session monitoring completed',      data: {
        sessionsChecked: result.checked,
        sessionsStopped: result.stopped, // Changed back to sessionsStopped
        errors: result.errors,        timeoutMinutes: 1,
        note: 'Sessions are terminated from WhatsApp server but preserved in database for restart (timeout based on createdAt, not updatedAt)'
      },
      timestamp: new Date().toISOString()
    };

    if (result.errors.length > 0) {
      console.warn('[SESSION_MONITOR] Completed with errors:', result.errors);
    } else {
      console.log('[SESSION_MONITOR] Completed successfully');
    }

    return withCORS(NextResponse.json(response));
  } catch (error) {
    console.error('[SESSION_MONITOR_POST] Error:', error);
    return withCORS(NextResponse.json({
      success: false,
      error: 'Session monitoring failed',
      details: (error as Error).message,      data: {
        sessionsChecked: 0,
        sessionsStopped: 0, // Changed back to be consistent
        errors: [(error as Error).message]
      }
    }, { status: 500 }));
  }
}
