import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";
import { TransactionStatusManager } from "@/lib/transaction-status-manager";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'delivered']).optional(),
  quantity: z.number().min(1).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  driveUrl: z.string().url().optional().or(z.literal('')),
  textDescription: z.string().optional(),
  domainName: z.string().optional(),
  domainExpiredAt: z.string().nullable().optional(),
  notes: z.string().optional(),
});

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function PATCH(
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

    // Validate input
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { status, quantity, websiteUrl, driveUrl, textDescription, domainName, domainExpiredAt, notes } = validation.data;

    const updatedProductService = await prisma.servicesProductCustomers.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(quantity !== undefined && { quantity }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl || null }),
        ...(driveUrl !== undefined && { driveUrl: driveUrl || null }),
        ...(textDescription !== undefined && { textDescription }),
        ...(domainName !== undefined && { domainName }),
        ...(domainExpiredAt !== undefined && { domainExpiredAt: domainExpiredAt ? new Date(domainExpiredAt) : null }),
        ...(notes !== undefined && { notes }),
        ...(status === 'delivered' && { deliveredAt: new Date() }),
        ...(status === 'in_progress' && { activatedAt: new Date() }),
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
            status: true,
            productTransactions: {
              select: {
                id: true,
                status: true,
                packageId: true
              }
            }
          }
        },
        package: {
          select: {
            id: true,
            name_en: true,
            name_id: true,
            price_idr: true,
            price_usd: true
          }
        }
      }
    });

    // If product is marked as delivered, trigger transaction completion check
    if (status === 'delivered' && updatedProductService.transaction?.id) {
      try {
        await TransactionStatusManager.updateChildTransactionStatus(
          updatedProductService.transactionId,
          'product'
        );
        console.log(`[PACKAGE_DELIVERY] Product delivered for transaction ${updatedProductService.transactionId}, status updated`);
      } catch (completionError) {
        console.error('[PACKAGE_DELIVERY] Error updating transaction status:', completionError);
        // Don't fail the update if completion check fails
      }
    }

    return withCORS(NextResponse.json({ 
      success: true, 
      data: updatedProductService,
      message: status === 'delivered' ? 'Package delivered and transaction status updated' : 'Package updated successfully'
    }));

  } catch (error: any) {
    console.error('Error updating package delivery:', error);
    
    if (error.code === 'P2025') {
      return withCORS(NextResponse.json(
        { success: false, error: "Package delivery not found" },
        { status: 404 }
      ));
    }

    return withCORS(NextResponse.json(
      { 
        success: false, 
        error: "Failed to update package delivery",
        details: error.message 
      },
      { status: 500 }
    ));
  }
}

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
            status: true,
            productTransactions: {
              select: {
                id: true,
                status: true,
                packageId: true
              }
            }
          }
        },
        package: {
          select: {
            id: true,
            name_en: true,
            name_id: true,
            price_idr: true,
            price_usd: true
          }
        }
      }
    });

    if (!productService) {
      return withCORS(NextResponse.json(
        { success: false, error: "Package delivery not found" },
        { status: 404 }
      ));
    }

    return withCORS(NextResponse.json({ 
      success: true, 
      data: productService 
    }));

  } catch (error: any) {
    console.error('Error fetching package delivery:', error);
    return withCORS(NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch package delivery",
        details: error.message 
      },
      { status: 500 }
    ));
  }
}
