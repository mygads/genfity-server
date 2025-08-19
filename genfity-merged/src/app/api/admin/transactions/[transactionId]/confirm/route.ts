import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth-helpers";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { PaymentExpirationService } from "@/lib/payment-expiration";

// PATCH /api/transactions/[transactionId]/confirm - Confirm transaction completion (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const adminVerification = await verifyAdminToken(request);
    if (!adminVerification.success) {
      return withCORS(NextResponse.json(
        { success: false, error: adminVerification.error },
        { status: 401 }
      ));
    }

    const { transactionId } = await params;

    // Auto-expire this specific transaction before confirming
    await PaymentExpirationService.autoExpireOnApiCall(transactionId);

    // Check if transaction exists and is in valid state for confirmation
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },      include: {
        payment: true,
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
    });

    if (!existingTransaction) {
      return withCORS(NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      ));
    }    // Check if transaction is in progress and ready for confirmation
    if (existingTransaction.status !== 'in-progress') {
      return withCORS(NextResponse.json(
        { success: false, error: "Transaction must be in progress before confirming" },
        { status: 400 }
      ));
    }    // For package (product) transactions, allow manual confirmation
    // For WhatsApp service transactions, they should auto-confirm when payment is made
    if (existingTransaction.type === 'product' && existingTransaction.productTransactions && existingTransaction.productTransactions.length > 0) {
      // Manual confirmation for packages
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },        data: {
          status: 'success',
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },          payment: true,
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
        },
      });

      return withCORS(NextResponse.json({
        success: true,
        data: {
          ...updatedTransaction,
          amount: Number(updatedTransaction.amount),          item_name: updatedTransaction.type === 'whatsapp_service'
            ? updatedTransaction.whatsappTransaction?.whatsappPackage?.name
            : (() => {
                const productNames = updatedTransaction.productTransactions?.map(pt => pt.package?.name_en).filter(Boolean) || [];
                const addonNames = updatedTransaction.addonTransactions?.map(at => at.addon?.name_en).filter(Boolean) || [];
                const allNames = [...productNames, ...addonNames];
                return allNames.length > 0 ? allNames.join(', ') : 'No items';
              })(),
          item_type: updatedTransaction.type,          
          transactionStatusText: getTransactionStatusText(updatedTransaction.status),
          paymentStatusText: getPaymentStatusText(updatedTransaction.payment?.status || 'pending'),
        },
        message: "Transaction confirmed successfully",
      }));
    } else {
      return withCORS(NextResponse.json(
        { success: false, error: "This transaction type does not require manual confirmation" },
        { status: 400 }
      ));
    }
  } catch (error) {
    console.error("[TRANSACTION_CONFIRM]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to confirm transaction" },
      { status: 500 }
    ));
  }
}

function getTransactionStatusText(status: string) {
  switch (status) {
    case 'created':
      return 'Created';
    case 'pending':
      return 'Payment Pending';
    case 'in-progress':
      return 'In Progress';
    case 'success':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
}

function getPaymentStatusText(status: string) {
  switch (status) {
    case 'pending':
      return 'Pending Payment';
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Payment Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
