import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/whatsapp/session/list-realtime - Get all sessions with real-time status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    if (status) {
      whereClause.status = status;
    }    const sessions = await prisma.whatsAppSession.findMany({
      where: whereClause,
      select: {
        sessionId: true,
        sessionName: true,
        status: true,
        message: true,
        qr: true,
        userId: true,
        createdAt: true,
        updatedAt: true,        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            apiKey: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });    // Add computed fields
    const sessionsWithStatus = sessions.map(session => ({
      ...session,
      userName: session.user?.name || session.user?.phone || session.user?.email || 'Unknown',
      userEmail: session.user?.email || 'Unknown',
      userPhone: session.user?.phone || 'Unknown',
      userApiKey: session.user?.apiKey || 'No API Key',
      isConnected: session.status === 'session_connected',
      needsQR: session.status === 'qr_generated' && session.qr !== null,
      isLoading: session.status === 'loading' || session.status === 'connecting',
      hasError: session.status === 'auth_failure' || session.status === 'error',
      isStopped: session.status === 'stopped',
      hasQR: session.qr !== null,
      lastUpdated: session.updatedAt,
    }));    // Group by status for summary
    const statusSummary = {
      connected: sessionsWithStatus.filter(s => s.isConnected).length,
      disconnected: sessionsWithStatus.filter(s => !s.isConnected && !s.isLoading && !s.hasError && !s.isStopped).length,
      loading: sessionsWithStatus.filter(s => s.isLoading).length,
      needsQR: sessionsWithStatus.filter(s => s.needsQR).length,
      stopped: sessionsWithStatus.filter(s => s.isStopped).length,
      error: sessionsWithStatus.filter(s => s.hasError).length,
      total: sessionsWithStatus.length,
    };

    return NextResponse.json({
      success: true,
      data: sessionsWithStatus,
      summary: statusSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SESSION_LIST_REALTIME] Error fetching sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
