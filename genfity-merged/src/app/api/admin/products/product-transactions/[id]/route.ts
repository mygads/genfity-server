// ⚠️ LEGACY API - This endpoint is deprecated and maintained for backward compatibility
// New product services should use /api/product-services/[id] instead
// This endpoint will automatically create corresponding ServicesProductCustomers records

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { TransactionStatusManager } from "@/lib/transaction-status-manager";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const {
      quantity,
      websiteUrl,
      driveUrl,
      textDescription,
      domainName,
      domainExpiredAt,
      fileAssets,
      status,
      notes
    } = data;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'delivered'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status. Must be one of: " + validStatuses.join(', ')
        },
        { status: 400 }
      );
    }

    // Validate JSON for fileAssets if provided
    let parsedFileAssets = null;
    if (fileAssets && fileAssets.trim()) {
      try {
        parsedFileAssets = JSON.parse(fileAssets);
        // Re-stringify to ensure it's properly formatted
        parsedFileAssets = JSON.stringify(parsedFileAssets);
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid JSON format for file assets"
          },
          { status: 400 }
        );
      }
    }    // ⚠️ DEPRECATED: This endpoint now uses ServicesProductCustomers
    // Update the product service
    const updatedCustomer = await prisma.servicesProductCustomers.update({
      where: { id },
      data: {
        quantity: quantity || 1,
        websiteUrl: websiteUrl || null,
        driveUrl: driveUrl || null,
        textDescription: textDescription || null,
        domainName: domainName || null,
        domainExpiredAt: domainExpiredAt ? new Date(domainExpiredAt) : null,
        fileAssets: parsedFileAssets,
        status: status || 'pending',
        notes: notes || null,
        deliveredAt: status === 'delivered' ? new Date() : null, // Set delivery time when marked as delivered
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        transaction: {          select: {
            id: true,
            amount: true,
            currency: true,
            status: true
          }
        },
        package: {
          select: {
            id: true,
            name_en: true,
            name_id: true
          }
        }
      }
    });

    // If status is being updated to 'delivered', update transaction product status to 'success'
    if (status === 'delivered' && updatedCustomer.transaction?.id) {
      try {
        // Update all product transactions for this transaction to 'success'
        await TransactionStatusManager.updateChildTransactionStatus(
          updatedCustomer.transaction.id,
          'product'
        );
        console.log(`[ADMIN_DELIVERY] Product delivered for transaction ${updatedCustomer.transaction.id}, child transaction status updated to success`);
      } catch (error) {
        console.error('[ADMIN_DELIVERY] Error updating transaction status:', error);
        // Don't fail the update if status update fails
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: "Package customer updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating package customer:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: "Package customer not found"
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update package customer"
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ⚠️ DEPRECATED: This endpoint now uses ServicesProductCustomers
    const customer = await prisma.servicesProductCustomers.findUnique({
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
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true
          }
        },        package: {
          select: {
            id: true,
            name_en: true,
            name_id: true
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Package customer not found"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error("Error fetching package customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch package customer"
      },
      { status: 500 }
    );
  }
}
