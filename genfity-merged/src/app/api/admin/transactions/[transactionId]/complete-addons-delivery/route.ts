import { NextRequest, NextResponse } from "next/server";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { prisma } from "@/lib/prisma";

// POST /api/transactions/[transactionId]/complete-addons-delivery - Complete add-ons delivery for transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const body = await request.json().catch(() => ({}));
    const { adminUserId } = body;

    // Validate transaction exists and has addon transactions
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
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
        },
        payment: {
          select: {
            status: true
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
    }

    if (!transaction.addonTransactions || transaction.addonTransactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "This transaction does not contain add-ons purchases"
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

    // Use PaymentExpirationService to complete add-ons delivery
    const completionResult = await PaymentExpirationService.completeAddonsDelivery(
      transactionId,
      adminUserId
    );

    if (!completionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: completionResult.error || "Failed to complete add-ons delivery"
        },
        { status: 500 }
      );
    }

    // Get updated transaction data
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
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
      message: "Add-ons delivery completed successfully",
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
          adminUserId,
          addonsCount: transaction.addonTransactions.length,
          addons: transaction.addonTransactions.map(at => ({
            id: at.addon.id,
            name: at.addon.name_en,
            quantity: at.quantity
          }))
        },
        completionStatus: {
          addonsDelivered: true,
          transactionStatus: completionResult.transactionCompleted ? 'success' : 'in_progress',
          message: completionResult.transactionCompleted 
            ? 'All services completed - transaction marked as success'
            : 'Add-ons delivered - waiting for other services'
        }
      }
    });

  } catch (error: any) {
    console.error("Error completing add-ons delivery:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete add-ons delivery",
        details: error.message
      },
      { status: 500 }
    );
  }
}
