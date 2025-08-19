import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { verifyAdminToken } from "@/lib/auth-helpers";

// PUT /api/transactions/product/[id]/delivery-status - Update product delivery status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminVerification = await verifyAdminToken(request);
    
    if (!adminVerification.success) {
      return NextResponse.json(
        { error: adminVerification.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      status, 
      websiteUrl, 
      driveUrl, 
      textDescription, 
      domainName, 
      domainExpiredAt, 
      notes 
    } = body;

    // Validate status
    if (!status || !['pending', 'in_progress', 'delivered'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, in_progress, or delivered' },
        { status: 400 }
      );
    }

    // Check if transaction product exists
    const transactionProduct = await prisma.transactionProduct.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            payment: {
              select: { status: true }
            }
          }
        }
      }
    });

    if (!transactionProduct) {
      return NextResponse.json(
        { error: 'Product transaction not found' },
        { status: 404 }
      );
    }

    // Check if payment is paid
    if (transactionProduct.transaction.payment?.status !== 'paid') {
      return NextResponse.json(
        { error: 'Cannot update delivery status. Payment must be paid first.' },
        { status: 400 }
      );
    }

    // Update delivery status in ServicesProductCustomers table
    // Use the TransactionProduct ID to find the specific delivery record
    const updatedDelivery = await prisma.servicesProductCustomers.updateMany({
      where: { 
        transactionId: transactionProduct.transactionId,
        // Additional filter to ensure we update the right product delivery
        packageId: transactionProduct.packageId
      },
      data: {
        status,
        ...(status === 'delivered' && { deliveredAt: new Date() }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(driveUrl !== undefined && { driveUrl }),
        ...(textDescription !== undefined && { textDescription }),
        ...(domainName !== undefined && { domainName }),
        ...(domainExpiredAt && { domainExpiredAt: new Date(domainExpiredAt) }),
        ...(notes !== undefined && { notes })
      }
    });

    if (updatedDelivery.count === 0) {
      return NextResponse.json(
        { error: 'No delivery record found to update' },
        { status: 404 }
      );
    }

    // If status is 'delivered', update the TransactionProduct status to 'success'
    if (status === 'delivered') {
      await prisma.transactionProduct.update({
        where: { id },
        data: { status: 'success' }
      });
      
      // Import and trigger transaction completion check
      const { TransactionStatusManager } = await import('@/lib/transaction-status-manager');
      await TransactionStatusManager.checkAndUpdateMainTransactionStatus(transactionProduct.transactionId);
    }

    return withCORS(NextResponse.json({
      success: true,
      message: `Delivery status updated to ${status}${status === 'delivered' ? ' and transaction marked as success' : ''}`,
      data: {
        transactionId: id,
        status,
        updatedRecords: updatedDelivery.count
      }
    }));

  } catch (error) {
    console.error('[PRODUCT_DELIVERY_STATUS_PUT]', error);
    return withCORS(NextResponse.json(
      { error: 'Failed to update delivery status' },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
