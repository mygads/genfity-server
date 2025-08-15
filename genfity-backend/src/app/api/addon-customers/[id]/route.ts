import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionStatusManager } from "@/lib/transaction-status-manager";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const {
      driveUrl,
      notes,
      status,
      fileAssets
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
    }

    // Update the addon service
    const updatedCustomer = await prisma.servicesAddonsCustomers.update({
      where: { id },
      data: {
        driveUrl: driveUrl || null,
        notes: notes || null,
        fileAssets: parsedFileAssets,
        status: status || 'pending',
        deliveredAt: status === 'delivered' ? new Date() : null,
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
        transaction: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true
          }
        }
      }
    });

    // If status is being updated to 'delivered', update transaction addon status to 'success'
    if (status === 'delivered' && updatedCustomer.transaction?.id) {
      try {
        // Update all addon transactions for this transaction to 'success'
        await TransactionStatusManager.updateChildTransactionStatus(
          updatedCustomer.transaction.id,
          'addon'
        );
        console.log(`[ADMIN_DELIVERY] Addon delivered for transaction ${updatedCustomer.transaction.id}, child transaction status updated to success`);
      } catch (error) {
        console.error('[ADMIN_DELIVERY] Error updating addon transaction status:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: "Addon customer updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating addon customer:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: "Addon customer not found"
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update addon customer"
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

    const customer = await prisma.servicesAddonsCustomers.findUnique({
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
            status: true,
            addonTransactions: {
              include: {
                addon: {
                  select: {
                    id: true,
                    name_en: true,
                    name_id: true,
                    price_idr: true,
                    price_usd: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Addon customer not found"
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
      message: "Addon customer retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching addon customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch addon customer"
      },
      { status: 500 }
    );
  }
}
