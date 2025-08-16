import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import WhatsAppMessageTracker from '@/lib/whatsapp-message-tracker';

// Helper function to verify admin JWT token
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/admin/whatsapp/analytics - Get WhatsApp message analytics for admin
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
