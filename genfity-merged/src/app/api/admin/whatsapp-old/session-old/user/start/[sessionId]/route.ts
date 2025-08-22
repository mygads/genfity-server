import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waFetch, canCreateWhatsappSession } from '@/lib/whatsapp-services';

// POST /api/whatsapp/session/user/start/[sessionId]
export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  // Ambil userId dari request body (atau dari session jika sudah ada auth)
  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  // Validasi limit session user (user biasa)
  const limitCheck = await canCreateWhatsappSession(userId);
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: `Limit session tercapai (${limitCheck.currentSession}/${limitCheck.maxSession}). Upgrade paket untuk menambah session.`
    }, { status: 403 });
  }
  try {
    const startRes = await waFetch(`/session/start/${sessionId}`);
    return NextResponse.json({ sessionId, ...startRes });
  } catch (e) {
    return NextResponse.json({ sessionId, error: (e as Error).message }, { status: 500 });
  }
}
