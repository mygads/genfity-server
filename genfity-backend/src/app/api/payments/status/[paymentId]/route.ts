import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { TransactionStatusManager } from "@/lib/transaction-status-manager";

// GET /api/payments/status/[paymentId] - Check payment status
export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));    }

    const { paymentId } = await params;

    // Auto-expire this specific payment before checking status
    await PaymentExpirationService.autoExpireOnApiCall(undefined, paymentId);

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        transaction: {
          userId: session.user.id,
        },
      },      include: {
        transaction: {
          include: {
            productTransactions: {
              include: {
                package: true,
              },
            },
            addonTransactions: {
              include: {
                addon: true,
              },
            },
            whatsappTransaction: {
              include: {
                whatsappPackage: true,
              },
            },
          },
        },
      },
    });    if (!payment) {
      return withCORS(NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      ));
    }

    if (!payment.transaction) {
      return withCORS(NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      ));
    }    // Add additional status information
    const statusInfo = {
      isPaid: payment.status === 'paid',
      isPending: payment.status === 'pending',
      isFailed: payment.status === 'failed',
      canRetry: payment.status === 'failed' || payment.status === 'pending',
      paymentAge: payment.createdAt ? Math.floor((Date.now() - payment.createdAt.getTime()) / 1000) : 0,
      isExpired: payment.expiresAt ? new Date() > new Date(payment.expiresAt) : false,
      timeRemaining: payment.expiresAt ? Math.max(0, Math.floor((new Date(payment.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60))) + " hours" : null,
    };

    // TRIGGER: If payment is paid and transaction hasn't been processed yet, trigger processing
    if (payment.status === 'paid' && payment.transaction) {
      const transaction = payment.transaction;
      
      // Check if transaction is still in pending status (not yet processed)
      if (transaction.status === 'pending') {
        console.log(`[PAYMENT_STATUS_CHECK] Payment ${paymentId} is paid, processing transaction ${transaction.id}`);
        
        try {
          // Update transaction status using our flow
          await TransactionStatusManager.updateTransactionOnPayment(
            transaction.id,
            'paid'
          );

          console.log(`[PAYMENT_STATUS_CHECK] Transaction ${transaction.id} processed successfully`);
          
          // Refresh payment data to get updated transaction status
          const updatedPayment = await prisma.payment.findFirst({
            where: { id: paymentId },
            include: {
              transaction: {
                include: {
                  productTransactions: { include: { package: true } },
                  addonTransactions: { include: { addon: true } },
                  whatsappTransaction: { include: { whatsappPackage: true } },
                },
              },
            },
          });
          
          if (updatedPayment) {
            payment.transaction = updatedPayment.transaction;
          }
          
        } catch (error) {
          console.error(`[PAYMENT_STATUS_CHECK] Error processing transaction ${transaction.id}:`, error);
          // Don't fail the request, just log the error
        }
      }
    }

    return withCORS(NextResponse.json({
      success: true,
      data: {
        ...payment,
        statusInfo,
        expirationInfo: {
          paymentExpiresAt: payment.expiresAt,
          transactionExpiresAt: payment.transaction?.expiresAt,
          paymentTimeRemaining: payment.expiresAt ? Math.max(0, Math.floor((new Date(payment.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60))) + " hours" : null,
          transactionTimeRemaining: payment.transaction?.expiresAt ? Math.max(0, Math.floor((new Date(payment.transaction.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + " days" : null,
          isPaymentExpired: payment.expiresAt ? new Date() > new Date(payment.expiresAt) : false,
          isTransactionExpired: payment.transaction?.expiresAt ? new Date() > new Date(payment.transaction.expiresAt) : false        },
        transaction: payment.transaction ? {
          ...payment.transaction,
          item_name: payment.transaction.type === 'whatsapp_service' 
            ? payment.transaction.whatsappTransaction?.whatsappPackage?.name 
            : (() => {
                const productNames = payment.transaction!.productTransactions?.map(pt => pt.package?.name_en).filter(Boolean) || [];
                const addonNames = payment.transaction!.addonTransactions?.map(at => at.addon?.name_en).filter(Boolean) || [];
                const allNames = [...productNames, ...addonNames];
                return allNames.length > 0 ? allNames.join(', ') : 'No items';
              })(),
          item_type: payment.transaction.type,
        } : null,
      },
    }));
  } catch (error) {
    console.error("[PAYMENT_STATUS]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch payment status" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
