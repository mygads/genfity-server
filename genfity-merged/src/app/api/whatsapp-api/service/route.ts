import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET /api/whatsapp-api/service?userId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
  }
  try {    // Ambil service aktif (expiredAt > now)
    const now = new Date();
    const service = await prisma.servicesWhatsappCustomers.findFirst({
      where: {
        customerId: userId,
        expiredAt: { gt: now },
      },
      include: {
        package: true,
      },
      orderBy: { expiredAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() });
  }
}
