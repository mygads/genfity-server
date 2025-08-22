import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waFetch, canCreateWhatsappSession } from '@/lib/whatsapp-services';

// POST /api/whatsapp/session/start/[sessionId] - Start a stopped session
export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  
  try {
    // Check if session exists and is stopped
    const existingSession = await prisma.whatsAppSession.findUnique({
      where: { sessionId },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (existingSession.status !== 'stopped') {
      return NextResponse.json({ 
        error: `Cannot start session. Current status: ${existingSession.status}. Only stopped sessions can be started.` 
      }, { status: 400 });
    }    // Update database status to starting
    // Reset isTerminated and update createdAt since we're creating a new WhatsApp session
    await prisma.whatsAppSession.update({
      where: { sessionId },
      data: { 
        status: 'starting',
        message: 'Starting session...',
        isTerminated: false, // Reset termination flag for new session
        createdAt: new Date(), // Update creation time for new session
        updatedAt: new Date(),
      },
    });

    // Start the session on WhatsApp service
    const startRes = await waFetch(`/session/start/${sessionId}`);
    
    // Update database with success status
    await prisma.whatsAppSession.update({
      where: { sessionId },
      data: { 
        status: 'connecting',
        message: 'Session started successfully',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true,
      sessionId, 
      message: 'Session started successfully',
      ...startRes 
    });
  } catch (error) {
    console.error(`[START_SESSION] Error starting session ${sessionId}:`, error);
    
    // Update database with error status
    try {
      await prisma.whatsAppSession.update({
        where: { sessionId },
        data: { 
          status: 'error',
          message: `Failed to start: ${(error as Error).message}`,
          updatedAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error('[START_SESSION] Failed to update database with error status:', dbError);
    }

    return NextResponse.json({ 
      success: false,
      sessionId, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
