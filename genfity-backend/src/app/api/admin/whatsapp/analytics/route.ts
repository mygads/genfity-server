import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import WhatsAppMessageTracker from '@/lib/whatsapp-message-tracker';

// GET /api/admin/whatsapp/analytics - Get WhatsApp message analytics for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') 
      ? new Date(url.searchParams.get('startDate')!) 
      : undefined;
    const endDate = url.searchParams.get('endDate') 
      ? new Date(url.searchParams.get('endDate')!) 
      : undefined;
    const userId = url.searchParams.get('userId') || undefined;
    const days = parseInt(url.searchParams.get('days') || '30');

    // Get general analytics
    const analytics = await WhatsAppMessageTracker.getAnalytics({
      startDate,
      endDate,
      userId,
    });

    // Get daily stats for charts
    const dailyStats = await WhatsAppMessageTracker.getDailyStats(userId, days);

    return NextResponse.json({
      success: true,
      data: {
        ...analytics,
        dailyStats,
      },
    });
  } catch (error) {
    console.error('Error getting WhatsApp analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
