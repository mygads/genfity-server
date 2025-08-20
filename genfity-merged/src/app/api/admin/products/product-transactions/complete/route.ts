import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const completeSchema = z.object({
  id: z.string().uuid(),
  referenceLink: z.string().optional(),
});

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}

// PUT /api/admin/products/product-transactions/complete - Complete a product transaction
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const body = await request.json();
    const validation = completeSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { id, referenceLink } = validation.data;

    // Find the service record
    const service = await prisma.servicesProductCustomers.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            productTransactions: true
          }
        }
      }
    });

    if (!service) {
      return withCORS(NextResponse.json(
        { success: false, error: "Service record not found" },
        { status: 404 }
      ));
    }

    // Update service status to delivered
    await prisma.servicesProductCustomers.update({
      where: { id },
      data: {
        status: 'delivered',
        updatedAt: new Date()
      }
    });

    // Update TransactionProduct with reference link and status
    const transactionProduct = service.transaction.productTransactions.find(
      tp => tp.packageId === service.packageId
    );

    if (transactionProduct) {
      await prisma.transactionProduct.update({
        where: { id: transactionProduct.id },
        data: {
          status: 'success',
          referenceLink: referenceLink || transactionProduct.referenceLink
        }
      });
    }

    // Check if all product services in the transaction are completed
    const allProductServices = await prisma.servicesProductCustomers.findMany({
      where: { transactionId: service.transactionId }
    });

    const allCompleted = allProductServices.every(ps => ps.status === 'delivered');

    // If all product services are completed, check if we should complete the main transaction
    if (allCompleted) {
      // Check if there are other services (WhatsApp, addons) in this transaction
      const [whatsappServices, addonServices] = await Promise.all([
        prisma.servicesWhatsappCustomers.findMany({
          where: { transactionId: service.transactionId }
        }),
        prisma.servicesAddonsCustomers.findMany({
          where: { transactionId: service.transactionId }
        })
      ]);

      // Check if all services are completed
      const allWhatsappCompleted = whatsappServices.length === 0 || 
        whatsappServices.every(ws => ws.status === 'active');
      const allAddonsCompleted = addonServices.length === 0 || 
        addonServices.every(as => as.status === 'delivered');

      if (allWhatsappCompleted && allAddonsCompleted) {
        // Complete the main transaction
        await prisma.transaction.update({
          where: { id: service.transactionId },
          data: {
            status: 'success',
            updatedAt: new Date()
          }
        });
      }
    }

    return withCORS(NextResponse.json({
      success: true,
      message: "Product transaction completed successfully"
    }));

  } catch (error) {
    console.error('Error completing product transaction:', error);
    return withCORS(NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    ));
  }
}
