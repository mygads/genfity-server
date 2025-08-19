import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from "@/lib/auth-helpers";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

function getTransactionStatusText(status: string) {
  switch (status) {
    case 'created': return 'Created';
    case 'pending': return 'Payment Pending';
    case 'in-progress': return 'In Progress';
    case 'success': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'expired': return 'Expired';
    default: return 'Unknown';
  }
}

function getPaymentStatusText(status: string) {
  switch (status) {
    case 'pending': return 'Payment Pending';
    case 'paid': return 'Paid';
    case 'failed': return 'Payment Failed';
    case 'expired': return 'Payment Expired';
    case 'cancelled': return 'Payment Cancelled';
    default: return 'Unknown';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    
    if (!transactionId) {
      return withCORS(NextResponse.json(
        { success: false, error: "Transaction ID is required" },
        { status: 400 }
      ));
    }

    const userVerification = await verifyUserToken(request);
    
    if (!userVerification.success) {
      return withCORS(NextResponse.json(
        { success: false, error: userVerification.error },
        { status: 401 }
      ));
    }

    const userId = userVerification.userId;
    let whereCondition: any = { id: transactionId };
    
    // Non-admin users can only access their own transactions
    whereCondition = { ...whereCondition, userId: userId };

    const transaction = await prisma.transaction.findFirst({
      where: whereCondition,
      include: {
        productTransactions: {
          include: {
            package: {
              include: {
                category: true,
                subcategory: true,
                features: true,
              },
            },
          },
        },
        addonTransactions: {
          include: {
            addon: {
              include: {
                category: true,
              },
            },
          },
        },
        whatsappTransaction: {
          include: {
            whatsappPackage: true,
          },
        },
        payment: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      },
    });

    if (!transaction) {
      return withCORS(NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      ));
    }

    const productNames = transaction.productTransactions?.map(pt => pt.package?.name_en).filter(Boolean) || [];
    const addonNames = transaction.addonTransactions?.map(at => at.addon?.name_en).filter(Boolean) || [];
    const allNames = [...productNames, ...addonNames];

    const transactionWithInfo = {
      ...transaction,
      amount: Number(transaction.amount),
      item_name: transaction.type === 'whatsapp_service'
        ? transaction.whatsappTransaction?.whatsappPackage?.name
        : allNames.length > 0 ? allNames.join(', ') : 'No items',
      item_type: transaction.type,
      transactionStatusText: getTransactionStatusText(transaction.status),
      paymentStatusText: getPaymentStatusText(transaction.payment?.status || 'pending'),
      canRetryPayment: transaction.status === 'created' || transaction.status === 'pending' || transaction.status === 'expired',
      canConfirmTransaction: transaction.type === 'product' && transaction.status === 'in-progress',
      durationText: transaction.type === 'whatsapp_service' && transaction.whatsappTransaction?.duration
        ? (transaction.whatsappTransaction.duration === 'year' ? '1 Year' : '1 Month')
        : null,
      paymentInfo: transaction.payment ? {
        ...transaction.payment,
        amount: Number(transaction.payment.amount),
        isPaid: transaction.payment.status === 'paid',
        isPending: transaction.payment.status === 'pending',
      } : null,
      expirationInfo: {
        transactionExpiresAt: transaction.expiresAt,
        paymentExpiresAt: transaction.payment?.expiresAt,
        transactionTimeRemaining: transaction.expiresAt ? Math.max(0, Math.floor((new Date(transaction.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + " days" : null,
      }
    };

    return withCORS(NextResponse.json({
      success: true,
      data: transactionWithInfo
    }));

  } catch (error) {
    console.error("Error fetching transaction:", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch transaction" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}