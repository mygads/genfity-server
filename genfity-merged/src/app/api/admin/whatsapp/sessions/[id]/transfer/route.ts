import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from '@/lib/cors';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Transfer WhatsApp session to a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { userId } = await request.json();

    console.log('Transfer session request:', { sessionId: id, targetUserId: userId });

    // Validate session exists
    const session = await prisma.whatsAppSession.findUnique({
      where: { sessionId: id },
      include: { user: true }
    });

    console.log('Session found:', session ? { id: session.id, sessionId: session.sessionId, name: session.sessionName } : 'null');

    if (!session) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      ));
    }

    // Don't allow transfer of system sessions
    if (session.isSystemSession) {
      return withCORS(NextResponse.json(
        { success: false, error: 'System sessions cannot be transferred' },
        { status: 400 }
      ));
    }

    // If userId is provided, validate user exists
    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser) {
        return withCORS(NextResponse.json(
          { success: false, error: 'Target user not found' },
          { status: 404 }
        ));
      }

      // Check if user already has maximum sessions (if you have limits)
      // You can add this validation based on your business rules
    }

    // Update session ownership
    const updatedSession = await prisma.whatsAppSession.update({
      where: { sessionId: id },
      data: { 
        userId: userId || null // null means unassigned (admin-owned)
      },
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    console.log('Session updated:', { 
      sessionId: updatedSession.sessionId,
      isSystemSession: updatedSession.isSystemSession,
      userId: updatedSession.userId,
      userName: updatedSession.user?.name || updatedSession.user?.email
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedSession,
      message: userId 
        ? `Session transferred to ${updatedSession.user?.name || updatedSession.user?.email}`
        : 'Session transferred to Admin (unassigned from user)'
    }));

  } catch (error) {
    console.error('Transfer session error:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to transfer session' },
      { status: 500 }
    ));
  }
}
