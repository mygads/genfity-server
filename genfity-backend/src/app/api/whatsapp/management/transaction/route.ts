import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCORS, corsOptionsResponse } from "@/lib/cors";

// POST /api/whatsapp/management/transaction
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

// GET /api/whatsapp/management/transaction?userId=... (optional for admin)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url!);
  const userId = searchParams.get('userId');
  
  try {
    // Get ALL transactions that have WhatsApp service component
    const whereClause = userId ? { 
      userId, 
      whatsappTransaction: {
        isNot: null
      }
    } : { 
      whatsappTransaction: {
        isNot: null
      }
    };
    
    const allTransactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { 
        whatsappTransaction: {
          include: {
            whatsappPackage: true,
          },
        },
        payment: {
          select: { 
            id: true,
            status: true, 
            method: true,
            amount: true,
            expiresAt: true,
            createdAt: true 
          }
        },
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('All WhatsApp transactions found:', allTransactions.length);
    console.log('Transaction IDs:', allTransactions.map(t => t.id));
    console.log('Transaction details:', allTransactions.map(t => ({
      id: t.id,
      userId: t.userId,
      amount: t.amount,
      status: t.status,
      createdAt: t.createdAt,
      hasWhatsappTransaction: !!t.whatsappTransaction,
      whatsappTransactionId: t.whatsappTransaction?.id,
      paymentStatus: t.payment?.status
    })));

    // Transform the data to match the expected format for the dashboard
    const transformedTransactions = allTransactions.map(transaction => {
      // Calculate the correct amount based on WhatsApp package price and duration
      let calculatedAmount = Number(transaction.amount);
      
      if (transaction.whatsappTransaction?.whatsappPackage) {
        const whatsappPackage = transaction.whatsappTransaction.whatsappPackage;
        const duration = transaction.whatsappTransaction.duration;
        
        // For pure WhatsApp transactions, use package price
        if (transaction.type === 'whatsapp_service') {
          if (duration === 'year') {
            calculatedAmount = Number(whatsappPackage.priceYear || 0);
          } else if (duration === 'month') {
            calculatedAmount = Number(whatsappPackage.priceMonth || 0);
          }
        } else {
          // For combined transactions (package_addon_whatsapp), extract WhatsApp portion
          // Use the package price as WhatsApp component amount
          if (duration === 'year') {
            calculatedAmount = Number(whatsappPackage.priceYear || 0);
          } else if (duration === 'month') {
            calculatedAmount = Number(whatsappPackage.priceMonth || 0);
          }
        }
      }
      
      // Determine transaction status based on payment status and whatsapp transaction status
      let status = transaction.status;
      
      if (transaction.payment?.status === 'paid') {
        status = 'paid';
      } else if (transaction.payment?.status === 'pending') {
        status = 'pending';
      } else if (transaction.payment?.status === 'failed' || transaction.payment?.status === 'expired' || transaction.payment?.status === 'cancelled') {
        status = 'failed';
      }
      
      return {
        id: transaction.id,
        userId: transaction.userId,
        amount: calculatedAmount, // Use calculated amount from package price
        status: status,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
        notes: transaction.notes, // Include transaction notes from checkout
        user: transaction.user,
        whatsappTransaction: {
          whatsappPackage: transaction.whatsappTransaction?.whatsappPackage,
          duration: transaction.whatsappTransaction?.duration,
          status: transaction.whatsappTransaction?.status || 'pending'
        },
        payment: transaction.payment
      };
    });
    
    return withCORS(NextResponse.json({ 
      success: true, 
      data: transformedTransactions,
      debug: { 
        totalTransactions: allTransactions.length,
        transformedCount: transformedTransactions.length,
        source: 'Transaction table with whatsappTransaction relation',
        sampleAmounts: transformedTransactions.slice(0, 3).map(t => ({
          id: t.id,
          originalAmount: allTransactions.find(orig => orig.id === t.id)?.amount,
          calculatedAmount: t.amount,
          duration: t.whatsappTransaction?.duration,
          packagePriceMonth: t.whatsappTransaction?.whatsappPackage?.priceMonth,
          packagePriceYear: t.whatsappTransaction?.whatsappPackage?.priceYear
        }))
      } 
    }));
  } catch (error) {
    console.error('Transaction API error:', error);
    return withCORS(NextResponse.json({ success: false, error: error?.toString() }));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
