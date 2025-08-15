import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionStatusManager } from "@/lib/transaction-status-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, packageData } = await request.json();

    // Validate action
    if (!['start', 'complete'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'start' or 'complete'"
        },
        { status: 400 }
      );
    }

    // Get current Transaction (for addon transactions, we work with the main transaction)
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
        addonCustomers: true,
        addonTransactions: true
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Validate current status for the action
    if (action === 'start') {
      // Check if addon transactions are in correct status for starting
      const canStart = transaction.addonTransactions.some(addon => addon.status === 'pending');
      
      if (!canStart) {
        return NextResponse.json(
          {
            success: false,
            error: "No addon transactions are in pending status to start progress"
          },
          { status: 400 }
        );
      }

      // Update addon transactions status to in_progress
      await prisma.transactionAddons.updateMany({
        where: { 
          transactionId: id,
          status: 'pending'
        },
        data: {
          status: 'in_progress'
        }
      });

      return NextResponse.json({
        success: true,
        message: "Addon transactions status updated to in_progress"
      });

    } else if (action === 'complete') {
      // Check if addon transactions are in correct status for completion
      const canComplete = transaction.addonTransactions.some(addon => addon.status === 'in_progress');
      
      if (!canComplete) {
        return NextResponse.json(
          {
            success: false,
            error: "No addon transactions are in in_progress status to complete"
          },
          { status: 400 }
        );
      }

      // Validate required package data for completion
      if (!packageData) {
        return NextResponse.json(
          {
            success: false,
            error: "Package data is required for completion"
          },
          { status: 400 }
        );
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update or create addon customer delivery record
        const existingAddonCustomer = transaction.addonCustomers?.[0];
        
        if (existingAddonCustomer) {
          // Update existing record
          await tx.servicesAddonsCustomers.update({
            where: { id: existingAddonCustomer.id },
            data: {
              status: 'delivered',
              deliveredAt: new Date(),
              driveUrl: packageData.driveUrl,
              notes: packageData.notes,
              updatedAt: new Date()
            }
          });
        } else {
          // Create new addon customer record
          const addonDetails = transaction.addonTransactions.map(addon => ({
            addonId: addon.addonId,
            quantity: addon.quantity
          }));

          await tx.servicesAddonsCustomers.create({
            data: {
              transactionId: id,
              customerId: transaction.userId,
              addonDetails: JSON.stringify(addonDetails),
              status: 'delivered',
              deliveredAt: new Date(),
              driveUrl: packageData.driveUrl,
              notes: packageData.notes
            }
          });
        }

        return { success: true };
      });

      // Use TransactionStatusManager to update addon status to success
      await TransactionStatusManager.updateChildTransactionStatus(id, 'addon');
      
      // Trigger transaction completion check after updating addon status
      // (this is already called within updateChildTransactionStatus, but adding for clarity)
      await TransactionStatusManager.checkAndUpdateMainTransactionStatus(id);

      return NextResponse.json({
        success: true,
        message: "Addon transactions completed successfully"
      });
    }

  } catch (error) {
    console.error("Error updating addon transaction status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update transaction status"
      },
      { status: 500 }
    );
  }
}
