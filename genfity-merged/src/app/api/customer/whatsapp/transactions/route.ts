import { NextRequest, NextResponse } from 'next/server';
import { getCustomerAuth } from '@/lib/auth-helpers';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import { prisma } from '@/lib/prisma';

// GET /api/customer/whatsapp/transactions - Get user's WhatsApp transaction history
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const customerAuth = await getCustomerAuth(request);
    if (!customerAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ));
    }

    const userId = customerAuth.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // paid, pending, failed
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const whereClause: any = {
      userId: userId,
      status: 'paid' // Only show successful transactions by default
    };

    if (status && ['paid', 'pending', 'failed'].includes(status)) {
      whereClause.status = status;
    }

    // Get transactions from both systems
    const [legacyTransactions, newTransactions, totalLegacy, totalNew] = await Promise.all([
      // Legacy system - ServicesWhatsappCustomers
      prisma.servicesWhatsappCustomers.findMany({
        where: {
          customerId: userId,
          transaction: {
            status: whereClause.status
          }
        },
        include: {
          transaction: {
            include: {
              payment: true
            }
          },
          package: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),

      // New system - TransactionWhatsappService
      prisma.transactionWhatsappService.findMany({
        where: {
          transaction: {
            userId: userId,
            status: whereClause.status
          }
        },
        include: {
          transaction: {
            include: {
              payment: true
            }
          },
          whatsappPackage: true
        },
        orderBy: {
          startDate: 'desc'
        },
        take: limit,
        skip: offset
      }),

      // Count for legacy
      prisma.servicesWhatsappCustomers.count({
        where: {
          customerId: userId,
          transaction: {
            status: whereClause.status
          }
        }
      }),

      // Count for new
      prisma.transactionWhatsappService.count({
        where: {
          transaction: {
            userId: userId,
            status: whereClause.status
          }
        }
      })
    ]);

    // Format legacy transactions
    const formattedLegacyTransactions = legacyTransactions.map(sub => ({
      id: sub.id,
      transactionId: sub.transactionId,
      packageName: sub.package.name,
      packageDescription: sub.package.description,
      maxSessions: sub.package.maxSession,
      amount: sub.transaction.amount,
      status: sub.transaction.status,
      paymentMethod: sub.transaction.payment?.method || null,
      purchaseDate: sub.transaction.createdAt,
      startDate: sub.activatedAt || sub.createdAt,
      endDate: sub.expiredAt,
      duration: 'monthly', // Default for legacy
      system: 'legacy',
      subscriptionStatus: sub.status,
      isActive: sub.status === 'active' && sub.expiredAt > new Date()
    }));

    // Format new transactions
    const formattedNewTransactions = newTransactions.map(trans => ({
      id: trans.id,
      transactionId: trans.transactionId,
      packageName: trans.whatsappPackage.name,
      packageDescription: trans.whatsappPackage.description,
      maxSessions: trans.whatsappPackage.maxSession,
      amount: trans.transaction.amount,
      status: trans.transaction.status,
      paymentMethod: trans.transaction.payment?.method || null,
      purchaseDate: trans.transaction.createdAt,
      startDate: trans.startDate,
      endDate: trans.endDate,
      duration: trans.duration,
      system: 'new',
      subscriptionStatus: trans.status,
      isActive: trans.status === 'success' && trans.endDate && trans.endDate > new Date()
    }));

    // Combine and sort by date
    const allTransactions = [...formattedLegacyTransactions, ...formattedNewTransactions]
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
      .slice(0, limit);

    const totalTransactions = totalLegacy + totalNew;

    // Get active subscription info
    const activeSubscription = allTransactions.find(t => t.isActive);

    return withCORS(NextResponse.json({
      success: true,
      data: {
        transactions: allTransactions,
        activeSubscription: activeSubscription || null,
        pagination: {
          total: totalTransactions,
          limit,
          offset,
          hasMore: offset + limit < totalTransactions
        },
        summary: {
          totalTransactions,
          totalLegacyTransactions: totalLegacy,
          totalNewTransactions: totalNew,
          hasActiveSubscription: !!activeSubscription
        }
      },
      message: 'WhatsApp transaction history retrieved successfully'
    }));

  } catch (error) {
    console.error('Error getting WhatsApp transactions:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}
