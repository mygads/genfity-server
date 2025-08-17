import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { withCORS, corsOptionsResponse } from "@/lib/cors";


// POST /api/whatsapp-api/transaction
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, packageId, duration } = body;
    if (!userId || !packageId || !['month', 'year'].includes(duration)) {
      return withCORS(NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 }));
    }

    // Cek paket
    const pkg = await prisma.whatsappApiPackage.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return withCORS(NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 }));
    }

    const amount = duration === 'year' ? pkg.priceYear : pkg.priceMonth;

    // Create transaction with modular structure
    const result = await prisma.$transaction(async (tx) => {
      // Create main transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'whatsapp_service',
          amount,
          status: 'pending',
        },
      });

      // Create WhatsApp service transaction details
      await tx.transactionWhatsappService.create({
        data: {
          transactionId: transaction.id,
          whatsappPackageId: packageId,
          duration,
        },
      });

      // Return transaction with details
      return await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          whatsappTransaction: {
            include: {
              whatsappPackage: true,
            },
          },
          user: { select: { id: true, name: true, email: true } }
        },
      });
    });

    return withCORS(NextResponse.json({ success: true, data: result }));
  } catch (error) {
    return withCORS(NextResponse.json({ success: false, error: error?.toString() }));
  }
}

// GET /api/whatsapp-api/transaction?userId=... (optional for admin)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const userId = searchParams.get('userId');
  
  try {
    const whereClause = userId ? { userId, type: 'whatsapp_service' } : { type: 'whatsapp_service' };
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { 
        whatsappTransaction: {
          include: {
            whatsappPackage: true,
          },
        },
        user: { select: { id: true, name: true, email: true } }
            },
      orderBy: { createdAt: 'desc' },
    });
    return withCORS(NextResponse.json({ success: true, data: transactions }));
  } catch (error) {
    return withCORS(NextResponse.json({ success: false, error: error?.toString() }));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
