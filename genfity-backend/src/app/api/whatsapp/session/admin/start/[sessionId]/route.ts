import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waFetch } from '@/lib/whatsapp-services';

// POST /api/whatsapp/session/admin/start/[sessionId]
export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, sessionName } = body;
    
    // For admin sessions, handle userId properly
    let finalUserId = userId;
    
    // If userId is 'admin', find or create an admin user
    if (userId === 'admin') {
      let adminUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { email: 'admin@system.local' },
            { role: 'admin' }
          ]
        }
      });
      
      if (!adminUser) {
        // Create admin user if it doesn't exist
        adminUser = await prisma.user.create({
          data: {
            email: 'admin@system.local',
            name: 'System Admin',
            role: 'admin'
          }
        });
      }
      
      finalUserId = adminUser.id;
    } else if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // For admin sessions, sessionName defaults to sessionId if not provided
    const finalSessionName = sessionName || sessionId;

    // Check if session already exists
    const existingSession = await prisma.whatsAppSession.findUnique({
      where: { sessionId }
    });

    if (existingSession) {
      return NextResponse.json({ 
        error: 'Session already exists',
        sessionId,
        sessionName: existingSession.sessionName 
      }, { status: 409 });
    }

    // Start the WhatsApp session
    const startRes = await waFetch(`/session/start/${sessionId}`);    // Create session record in database
    await prisma.whatsAppSession.create({
      data: {
        sessionId,
        sessionName: finalSessionName,
        userId: finalUserId,
        status: 'starting',
        message: 'Session is starting...',
        isNotification: false,
        isTerminated: false // New session starts as not terminated
      }
    });

    return NextResponse.json({ 
      sessionId, 
      sessionName: finalSessionName,
      ...startRes 
    });
  } catch (e) {
    return NextResponse.json({ 
      sessionId, 
      error: (e as Error).message 
    }, { status: 500 });
  }
}
