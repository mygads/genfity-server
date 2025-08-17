import { NextRequest, NextResponse } from "next/server";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { prisma } from "@/lib/prisma";

// POST /api/transactions/[transactionId]/complete-delivery - Complete product delivery for transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const body = await request.json().catch(() => ({}));
    const { adminUserId } = body;    // Validate transaction exists and has product transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        productTransactions: {
          include: {
            package: true
          }
        },
        addonTransactions: {
          include: {
            addon: true
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            paymentDate: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction not found"
        },
        { status: 404 }
      );
    }    if (!transaction.productTransactions || transaction.productTransactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "This transaction does not contain product purchases"
        },
        { status: 400 }
      );
    }

    if (transaction.status !== 'in_progress') {
      return NextResponse.json(
        {
          success: false,
          error: `Transaction must be in 'in_progress' status. Current status: ${transaction.status}`
        },
        { status: 400 }
      );
    }

    if (transaction.payment?.status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction payment is not paid"
        },
        { status: 400 }
      );
    }

    // Use PaymentExpirationService to complete delivery
    const completionResult = await PaymentExpirationService.completeProductDelivery(
      transactionId,
      adminUserId
    );

    if (!completionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: completionResult.error || "Failed to complete delivery"
        },
        { status: 500 }
      );
    }    // Get updated transaction data
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        productTransactions: {
          include: {
            package: true
          }
        },
        addonTransactions: {
          include: {
            addon: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Product delivery completed successfully",
      data: {
        transaction: {
          id: updatedTransaction?.id,
          status: updatedTransaction?.status,
          userId: updatedTransaction?.userId,
          transactionCompleted: completionResult.transactionCompleted
        },
        deliveryDetails: {
          delivered: completionResult.delivered,
          deliveredAt: new Date(),
          adminUserId
        },
        completionStatus: {
          productDelivered: true,
          transactionStatus: completionResult.transactionCompleted ? 'success' : 'in_progress',
          message: completionResult.transactionCompleted 
            ? 'All services completed - transaction marked as success'
            : 'Product delivered - waiting for other services'
        }
      }
    });

  } catch (error: any) {
    console.error("Error completing product delivery:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete product delivery",
        details: error.message
      },
      { status: 500 }
    );
  }
}
