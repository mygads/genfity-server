import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';


// GET /api/whatsapp-api/service/all
export async function GET() {
  try {    const services = await prisma.servicesWhatsappCustomers.findMany({
      include: {
        package: true,
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { expiredAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    return NextResponse.json({ success: false, error: error?.toString() });
  }
}
