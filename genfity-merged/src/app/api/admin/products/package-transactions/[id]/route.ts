import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from '@/lib/cors';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { TransactionStatusManager } from '@/lib/transaction-status-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const { id } = await params;

    // Fetch the specific service with related data
    const service = await prisma.servicesProductCustomers.findFirst({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        transaction: {
          include: {
            payment: true,
            productTransactions: {
              include: {
                package: {
                  include: {
                    category: true,
                    subcategory: true,
                    features: true
                  }
                }
              }
            }
          }
        },
        package: {
          include: {
            category: true,
            subcategory: true,
            features: true
          }
        }
      }
    });

    if (!service) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      ));
    }

    // Transform the data to match frontend expectations
    const responseData = {
      id: service.id,
      transactionId: service.transactionId,
      status: service.status,
      package: service.package,
      quantity: service.quantity,
      notes: service.notes,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      customer: service.customer,
      transaction: service.transaction
    };

    return withCORS(NextResponse.json({
      success: true,
      data: responseData
    }));
  } catch (error) {
    console.error('Error fetching product transaction detail:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const { id } = await params;
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
    const validStatuses = ['pending', 'in_progress', 'delivered'];
    if (!validStatuses.includes(status)) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      ));
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Add delivery info if provided
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (driveUrl !== undefined) updateData.driveUrl = driveUrl;
    if (textDescription !== undefined) updateData.textDescription = textDescription;
    if (domainName !== undefined) updateData.domainName = domainName;
    if (domainExpiredAt !== undefined) updateData.domainExpiredAt = domainExpiredAt ? new Date(domainExpiredAt) : null;
    if (notes !== undefined) updateData.notes = notes;

    // Add timestamp based on status
    if (status === 'in_progress') updateData.activatedAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();

    // Update the service status
    const updatedService = await prisma.servicesProductCustomers.update({
      where: { id },
      data: updateData,
      include: {
        transaction: {
          include: {
            productTransactions: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Update related TransactionProduct status if exists
    const transactionProduct = updatedService.transaction.productTransactions.find(
      tp => tp.packageId === updatedService.packageId
    );

    if (transactionProduct) {
      const productStatus = status === 'delivered' ? 'success' : 
                           status === 'in_progress' ? 'in_progress' : 'pending';
      
      await prisma.transactionProduct.update({
        where: { id: transactionProduct.id },
        data: { status: productStatus }
      });
    }

    // If status is being updated to 'delivered', check transaction completion
    if (status === 'delivered') {
      try {
        await TransactionStatusManager.updateChildTransactionStatus(
          updatedService.transactionId,
          'product'
        );
        console.log(`[ADMIN_DELIVERY] Product delivered for transaction ${updatedService.transactionId}, status updated`);
      } catch (error) {
        console.error('[ADMIN_DELIVERY] Error updating transaction status:', error);
        // Don't fail the update if status update fails
      }
    }

    return withCORS(NextResponse.json({
      success: true,
      data: updatedService,
      message: `Service status updated to ${status}`
    }));
  } catch (error: any) {
    console.error('Error updating product transaction status:', error);
    
    if (error.code === 'P2025') {
      return withCORS(NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      ));
    }

    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to update service status' },
      { status: 500 }
    ));
  }
}
