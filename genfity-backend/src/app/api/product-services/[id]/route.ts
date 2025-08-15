import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentExpirationService } from "@/lib/payment-expiration";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { status, websiteUrl, driveUrl, textDescription, domainName, domainExpiredAt, notes } = body;

    const updatedProductService = await prisma.servicesProductCustomers.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(driveUrl !== undefined && { driveUrl }),
        ...(textDescription !== undefined && { textDescription }),
        ...(domainName !== undefined && { domainName }),
        ...(domainExpiredAt !== undefined && { domainExpiredAt: domainExpiredAt ? new Date(domainExpiredAt) : null }),
        ...(notes !== undefined && { notes }),
        ...(status === 'delivered' && { deliveredAt: new Date() }),
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

    // If product is marked as delivered, trigger transaction completion check
    if (status === 'delivered' && updatedProductService.transaction?.id) {
      try {
        const completionResult = await PaymentExpirationService.checkTransactionCompletion(updatedProductService.transaction.id);
        console.log(`[PRODUCT_SERVICE_UPDATE] Delivery completed, transaction completion check result:`, completionResult);
      } catch (completionError) {
        console.error('[PRODUCT_SERVICE_UPDATE] Error checking transaction completion:', completionError);
        // Don't fail the update if completion check fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedProductService,
      message: status === 'delivered' ? 'Product service delivered and transaction completion checked' : 'Product service updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating product service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update product service",
        details: error.message 
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

    const productService = await prisma.servicesProductCustomers.findUnique({
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

    if (!productService) {
      return NextResponse.json(
        { success: false, error: "Product service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: productService 
    });

  } catch (error: any) {
    console.error('Error fetching product service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch product service",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
