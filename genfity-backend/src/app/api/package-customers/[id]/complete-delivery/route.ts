import { NextRequest, NextResponse } from "next/server";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { prisma } from "@/lib/prisma";

// POST /api/package-customers/[id]/complete-delivery - Complete product delivery by admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { adminUserId } = body;    // First get the PackageCustomer to find the transaction ID
    // ⚠️ DEPRECATED: This endpoint now uses ServicesProductCustomers
    const packageCustomer = await prisma.servicesProductCustomers.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transaction: {
          select: {
            id: true,
            status: true,
            userId: true
          }
        },
        package: {
          select: {
            id: true,
            name_en: true
          }
        }
      }
    });

    if (!packageCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: "Package customer not found"
        },
        { status: 404 }
      );
    }

    if (!packageCustomer.transaction) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction not found for this package customer"
        },
        { status: 404 }
      );
    }

    // Check if already delivered
    if (packageCustomer.status === 'delivered') {
      return NextResponse.json(
        {
          success: true,
          message: "Product already delivered",
          data: {
            packageCustomer,
            alreadyDelivered: true
          }
        }
      );
    }

    // Use PaymentExpirationService to complete delivery
    const completionResult = await PaymentExpirationService.completeProductDelivery(
      packageCustomer.transaction.id,
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
    }    // Get updated data
    // ⚠️ DEPRECATED: This endpoint now uses ServicesProductCustomers  
    const updatedPackageCustomer = await prisma.servicesProductCustomers.findUnique({
      where: { id },
      include: {
        transaction: {
          select: {
            id: true,
            status: true,
            userId: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        package: {
          select: {
            id: true,
            name_en: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Product delivery completed successfully",
      data: {
        packageCustomer: updatedPackageCustomer,
        transactionCompleted: completionResult.transactionCompleted,
        completionDetails: {
          delivered: completionResult.delivered,
          transactionStatus: completionResult.transactionCompleted ? 'success' : 'in_progress'
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
