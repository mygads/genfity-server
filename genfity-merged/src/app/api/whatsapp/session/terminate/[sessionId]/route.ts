import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waFetch } from '@/lib/whatsapp-services';

// POST /api/whatsapp/session/terminate/[sessionId]
export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    // First call WhatsApp service to terminate the session
    const terminateRes = await waFetch(`/session/terminate/${sessionId}`);
    
    // If termination is successful, update database status
    if (terminateRes && !terminateRes.error) {
      await prisma.whatsAppSession.delete({
      where: { sessionId }
      });
    }
    
    return NextResponse.json({ sessionId, ...terminateRes });
  } catch (e) {
    return NextResponse.json({ sessionId, error: (e as Error).message }, { status: 500 });
  }
}
