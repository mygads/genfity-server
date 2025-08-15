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

    // Get current TransactionProduct
    const productTransaction = await prisma.transactionProduct.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            payment: true
          }
        },
        package: true
      }
    });

    if (!productTransaction) {
      return NextResponse.json(
        { success: false, error: "Product transaction not found" },
        { status: 404 }
      );
    }

    const transaction = productTransaction.transaction;

    // For "start" action: Check if payment is paid and child status allows starting
    if (action === 'start') {
      if (transaction.payment?.status !== 'paid') {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot start progress. Payment must be completed first"
          },
          { status: 400 }
        );
      }

      if (productTransaction.status !== 'pending') {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot start progress. Transaction must be in pending status"
          },
          { status: 400 }
        );
      }

      // Find existing delivery record
      const existingDelivery = await prisma.servicesProductCustomers.findFirst({
        where: {
          transactionId: transaction.id,
          customerId: transaction.userId
        }
      });

      if (!existingDelivery) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot start progress. Delivery record not found"
          },
          { status: 400 }
        );
      }

      // Update delivery status to in_progress and child transaction status
      await prisma.servicesProductCustomers.update({
        where: { id: existingDelivery.id },
        data: { 
          status: 'in_progress',
          updatedAt: new Date()
        }
      });

      // Update child transaction status to in_progress
      await prisma.transactionProduct.update({
        where: { id: productTransaction.id },
        data: { 
          status: 'in_progress'
        }
      });

      return NextResponse.json({
        success: true,
        message: "Delivery progress started successfully"
      });
    }

    // For "complete" action: Check if delivery is in progress
    if (action === 'complete') {
      const existingDelivery = await prisma.servicesProductCustomers.findFirst({
        where: {
          transactionId: transaction.id,
          customerId: transaction.userId
        }
      });

      if (!existingDelivery) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot complete. Delivery record not found"
          },
          { status: 400 }
        );
      }

      if (existingDelivery.status !== 'in_progress') {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot complete. Delivery must be in progress"
          },
          { status: 400 }
        );
      }

      // Update delivery record with completion data
      const packageCustomerData = {
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date(),
        ...(packageData && {
          websiteUrl: packageData.websiteUrl || existingDelivery.websiteUrl,
          driveUrl: packageData.driveUrl || existingDelivery.driveUrl,
          textDescription: packageData.textDescription || existingDelivery.textDescription,
          domainName: packageData.domainName || existingDelivery.domainName,
          domainExpiredAt: packageData.domainExpiredAt ? new Date(packageData.domainExpiredAt) : existingDelivery.domainExpiredAt,
          notes: packageData.notes || existingDelivery.notes
        })
      };

      await prisma.servicesProductCustomers.update({
        where: { id: existingDelivery.id },
        data: packageCustomerData
      });

      // Update child transaction status to success using TransactionStatusManager
      await TransactionStatusManager.updateChildTransactionStatus(id, 'product', productTransaction.id);

      return NextResponse.json({
        success: true,
        message: "Product transaction completed successfully"
      });
    }

  } catch (error) {
    console.error("Error updating transaction status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update transaction status"
      },
      { status: 500 }
    );
  }
}
