import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerAuth } from '@/lib/auth-helpers';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import { PaymentExpirationService } from '@/lib/payment-expiration';

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get('origin') || undefined);
}

// Helper function to create CORS-enabled JSON responses
function createCorsResponse(data: any, options: { status?: number } = {}, request: NextRequest) {
  const response = NextResponse.json(data, options);
  return withCORS(response, request.headers.get('origin') || undefined);
}

// POST /api/customer/transaction/active - Manual activation check for transactions
export async function POST(
  request: NextRequest
) {
  try {
    // Check authentication
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return createCorsResponse(
        { success: false, error: "Authentication required" },
        { status: 401 },
        request
      );
    }

    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return createCorsResponse(
        { success: false, error: "Transaction ID is required" },
        { status: 400 },
        request
      );
    }

    // Auto-expire payments and transactions first
    await PaymentExpirationService.autoExpireOnApiCall(transactionId);

    // Validate and activate transaction
    try {
      const result = await PaymentExpirationService.checkAndActivateTransaction(
        transactionId,
        userAuth.id
      );

      return createCorsResponse({
        success: true,
        data: {
          transactionId: result.transaction.id,
          status: result.transaction.status,
          activated: true,
          activatedAt: new Date(),          services: {
            whatsapp: !!result.transaction.whatsappTransaction,
            product: !!(result.transaction.productTransactions && result.transaction.productTransactions.length > 0)
          }
        },
        message: "Transaction services activated successfully"
      }, {}, request);    } catch (error: any) {
      // Handle specific error cases
      if (error?.message?.includes('not found') || error?.message?.includes('not in valid status')) {
        return createCorsResponse(
          { success: false, error: "Transaction not found or not eligible for activation" },
          { status: 404 },
          request
        );
      }

      if (error?.message?.includes('payment is not paid')) {
        return createCorsResponse(
          { success: false, error: "Transaction payment must be paid before activation" },
          { status: 400 },
          request
        );
      }

      throw error; // Re-throw unexpected errors
    }

  } catch (error) {
    console.error('Error activating transaction:', error);
    return createCorsResponse(
      { success: false, error: "Internal server error" },
      { status: 500 },
      request
    );
  }
}

// GET /api/customer/transaction/active - Get eligible transactions for manual activation
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return createCorsResponse(
        { success: false, error: "Authentication required" },
        { status: 401 },
        request
      );
    }

    // Auto-expire payments and transactions first
    await PaymentExpirationService.autoExpireOnApiCall();

    // Find transactions that are in-progress with paid payment but haven't been activated
    const eligibleTransactions = await prisma.transaction.findMany({
      where: {
        userId: userAuth.id,
        status: 'in_progress',
        payment: {
          status: 'paid'
        }
      },
      include: {
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            method: true,
            paymentDate: true
          }
        },
        whatsappTransaction: {
          include: {
            whatsappPackage: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },        productTransactions: {
          include: {
            package: {
              select: {
                id: true,
                name_en: true
              }
            }
          }
        },
        addonTransactions: {
          include: {
            addon: {
              select: {
                id: true,
                name_en: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedTransactions = eligibleTransactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      status: transaction.status,
      createdAt: transaction.createdAt,
      payment: transaction.payment,
      services: {
        whatsapp: transaction.whatsappTransaction ? {
          packageName: transaction.whatsappTransaction.whatsappPackage?.name,
          duration: transaction.whatsappTransaction.duration
        } : null,        product: (transaction.productTransactions && transaction.productTransactions.length > 0) ? {
          packages: transaction.productTransactions.map(pt => pt.package?.name_en).filter(Boolean),
          addons: transaction.addonTransactions ? transaction.addonTransactions.map(at => at.addon?.name_en).filter(Boolean) : []
        } : null
      },
      eligibleForActivation: true
    }));

    return createCorsResponse({
      success: true,
      data: {
        transactions: formattedTransactions,
        count: formattedTransactions.length
      },
      message: "Eligible transactions retrieved successfully"
    }, {}, request);

  } catch (error) {
    console.error('Error fetching eligible transactions:', error);
    return createCorsResponse(
      { success: false, error: "Internal server error" },
      { status: 500 },
      request
    );
  }
}
