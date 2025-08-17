import { NextResponse } from 'next/server';
import { monitorAndStopStaleSessions } from '@/lib/session-monitor';

// Cron job untuk auto-stop session yang stale
// Endpoint ini bisa dipanggil oleh cron service seperti Vercel Cron atau external cron
export async function GET(request: Request) {
  try {
    // Validate cron secret if needed
    const cronSecret = process.env.CRON_API_KEY;
    const authHeader = request.headers.get('authorization');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log('[CRON_SESSION_MONITOR] Starting scheduled session monitoring...');

    const result = await monitorAndStopStaleSessions();
    const response = {
      success: true,
      message: 'Cron session monitoring completed',
      data: {
        sessionsChecked: result.checked,
        sessionsStopped: result.stopped, // Changed back to sessionsStopped since we're not deleting
        errorsCount: result.errors.length,
        errors: result.errors.slice(0, 5), // Limit errors in response        timeoutMinutes: 10,
        executedAt: new Date().toISOString(),
        note: 'Sessions are terminated from WhatsApp server but preserved in database for restart (timeout based on createdAt, not updatedAt)'
      }
    };

    if (result.errors.length > 0) {
      console.warn('[CRON_SESSION_MONITOR] Completed with errors:', result.errors);
    } else {
      console.log(`[CRON_SESSION_MONITOR] Completed successfully - Checked: ${result.checked}, Stopped: ${result.stopped}`);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[CRON_SESSION_MONITOR] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Cron session monitoring failed',
      details: (error as Error).message,
      executedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST method untuk trigger manual dari dashboard
export async function POST(request: Request) {
  return GET(request);
}
