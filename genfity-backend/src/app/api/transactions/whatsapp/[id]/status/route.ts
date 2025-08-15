import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionStatusManager } from "@/lib/transaction-status-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Validate action
    if (!['delivered', 'failed'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'delivered' or 'failed'"
        },
        { status: 400 }
      );
    }

    // Get transaction with WhatsApp details
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payment: true,
        whatsappTransaction: {
          include: {
            whatsappPackage: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.type !== 'whatsapp_service' || !transaction.whatsappTransaction) {
      return NextResponse.json(
        { success: false, error: "This is not a WhatsApp service transaction" },
        { status: 400 }
      );
    }

    if (!transaction.payment || transaction.payment.status !== 'paid') {
      return NextResponse.json(
        { success: false, error: "Transaction payment is not completed" },
        { status: 400 }
      );
    }

    if (action === 'delivered') {
      // Check if WhatsApp transaction is already processed
      if (transaction.whatsappTransaction.status === 'success') {
        return NextResponse.json({
          success: true,
          message: "WhatsApp service is already activated",
          alreadyProcessed: true
        });
      }

      if (transaction.whatsappTransaction.status === 'failed') {
        console.log(`[MANUAL_WHATSAPP_ACTIVATION] Retrying failed WhatsApp activation for transaction ${id}`);
      }

      // Try to activate the WhatsApp service
      try {
        await TransactionStatusManager.activateWhatsAppService(transaction);
        
        console.log(`[MANUAL_WHATSAPP_ACTIVATION] ✅ Successfully activated WhatsApp service for transaction ${id}`);
        
        return NextResponse.json({
          success: true,
          message: "WhatsApp service activated successfully"
        });
        
      } catch (error) {
        console.error(`[MANUAL_WHATSAPP_ACTIVATION] Failed to activate WhatsApp service for transaction ${id}:`, error);
        
        // Mark as failed
        await prisma.transactionWhatsappService.update({
          where: { id: transaction.whatsappTransaction.id },
          data: { status: 'failed' }
        });
        
        return NextResponse.json({
          success: false,
          error: "Failed to activate WhatsApp service. Please try again or contact support."
        }, { status: 500 });
      }
      
    } else if (action === 'failed') {
      // Mark WhatsApp transaction as failed
      await prisma.transactionWhatsappService.update({
        where: { id: transaction.whatsappTransaction.id },
        data: { status: 'failed' }
      });
      
      console.log(`[MANUAL_WHATSAPP_ACTIVATION] ❌ Manually marked WhatsApp transaction ${id} as failed`);
      
      return NextResponse.json({
        success: true,
        message: "WhatsApp transaction marked as failed"
      });
    }

  } catch (error) {
    console.error("Error updating WhatsApp transaction status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update WhatsApp transaction status"
      },
      { status: 500 }
    );
  }
}
