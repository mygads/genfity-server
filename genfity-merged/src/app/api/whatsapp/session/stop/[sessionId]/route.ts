import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waFetch } from '@/lib/whatsapp-services';

// POST /api/whatsapp/session/stop/[sessionId]
export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  
  try {
    // Check if session exists in database
    const existingSession = await prisma.whatsAppSession.findUnique({
      where: { sessionId }
    });

    if (!existingSession) {
      return NextResponse.json({ 
        error: 'Session not found in database',
        sessionId 
      }, { status: 404 });
    }

    // First update database status to stopping
    await prisma.whatsAppSession.update({
      where: { sessionId },
      data: {
        status: 'stopping',
        message: 'Session is being stopped...',
        updatedAt: new Date()
      }
    });

    // Then call WhatsApp service to terminate the session (but keep DB record)
    try {
      const terminateRes = await waFetch(`/session/terminate/${sessionId}`);
        // Update database status to stopped and mark as terminated
      await prisma.whatsAppSession.update({
        where: { sessionId },
        data: {
          status: 'stopped',
          isTerminated: true, // Mark as terminated since we successfully called terminate
          message: 'Session stopped - exists in database but not in WhatsApp server',
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ 
        sessionId,
        status: 'stopped',
        message: 'Session stopped successfully',
        whatsappResponse: terminateRes
      });
    } catch (waError) {
      // Even if WhatsApp service fails, mark as stopped in database
      await prisma.whatsAppSession.update({
        where: { sessionId },
        data: {
          status: 'stopped',
          message: 'Session marked as stopped (WhatsApp service may have been unavailable)',
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ 
        sessionId,
        status: 'stopped',
        message: 'Session stopped (WhatsApp service error but marked as stopped in database)',
        whatsappError: (waError as Error).message
      });
    }
  } catch (e) {
    // Update database with error status
    try {
      await prisma.whatsAppSession.update({
        where: { sessionId },
        data: {
          status: 'error',
          message: `Stop failed: ${(e as Error).message}`,
          updatedAt: new Date()
        }
      });
    } catch (dbError) {
      console.error('Failed to update database after stop error:', dbError);
    }
    
    return NextResponse.json({ 
      sessionId, 
      error: (e as Error).message 
    }, { status: 500 });
  }
}
