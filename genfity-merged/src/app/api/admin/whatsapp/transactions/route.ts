import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { withRoleAuthentication } from "@/lib/request-auth";

// GET /api/admin/whatsapp/transactions - Get all WhatsApp transactions for admin
export async function GET(req: Request) {
  return withRoleAuthentication(req, ['admin'], async (user) => {
    try {
      // Get ALL transactions that have WhatsApp service component
      const allTransactions = await prisma.transaction.findMany({
        where: { 
          whatsappTransaction: {
            isNot: null
          }
        },
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

      console.log('[ADMIN_WHATSAPP_TRANSACTIONS] Found transactions:', allTransactions.length);

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
          source: 'Admin API - Transaction table with whatsappTransaction relation'
        } 
      }));
    } catch (error) {
      console.error('[ADMIN_WHATSAPP_TRANSACTIONS] API error:', error);
      return withCORS(NextResponse.json({ success: false, error: error?.toString() }));
    }
  });
}

// POST /api/admin/whatsapp/transactions - Create new WhatsApp transaction (admin only)
export async function POST(req: Request) {
  return withRoleAuthentication(req, ['admin'], async (user) => {
    try {
      const body = await req.json();
      const { userId, packageId, duration } = body;
      
      if (!userId || !packageId || !['month', 'year'].includes(duration)) {
        return withCORS(NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 }));
      }

      // Check package exists
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
  });
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
