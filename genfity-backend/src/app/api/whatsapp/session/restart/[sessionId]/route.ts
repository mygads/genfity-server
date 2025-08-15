import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waFetch } from '@/lib/whatsapp-services';


// PATCH /api/whatsapp/session/restart/[sessionId]
export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {    // First update database status to restarting
    // Reset isTerminated and update createdAt since we're creating a new WhatsApp session
    await prisma.whatsAppSession.update({
      where: { sessionId },
      data: {
        status: 'restarting',
        message: 'Session is restarting...',
        isTerminated: false, // Reset termination flag for new session
        createdAt: new Date(), // Update creation time for new session
        updatedAt: new Date()
      }
    });

    // Then call WhatsApp service to restart
    const restartRes = await waFetch(`/session/restart/${sessionId}`);
    
    // Update database with result
    if (restartRes && !restartRes.error) {
      await prisma.whatsAppSession.update({
        where: { sessionId },
        data: {
          status: restartRes.status || 'restarting',
          message: restartRes.message || 'Session restarted',
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.whatsAppSession.update({
        where: { sessionId },
        data: {
          status: 'error',
          message: restartRes?.error || 'Restart failed',
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({ sessionId, ...restartRes });
  } catch (e) {
    // Update database with error status
    try {
      await prisma.whatsAppSession.update({
        where: { sessionId },
        data: {
          status: 'error',
          message: (e as Error).message,
          updatedAt: new Date()
        }
      });
    } catch (dbError) {
      console.error('Failed to update database after restart error:', dbError);
    }
    
    return NextResponse.json({ sessionId, error: (e as Error).message }, { status: 500 });
  }
}
