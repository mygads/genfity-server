import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const actionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['pending', 'in_progress', 'delivered']),
  referenceLink: z.string().optional(),
});

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}

// PUT /api/admin/products/product-transactions/action - Update product transaction status
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
    const validation = actionSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { id, action, referenceLink } = validation.data;

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

    // Update service status
    await prisma.servicesProductCustomers.update({
      where: { id },
      data: {
        status: action,
        updatedAt: new Date()
      }
    });

    // Update TransactionProduct status and reference link if provided
    const transactionProduct = service.transaction.productTransactions.find(
      tp => tp.packageId === service.packageId
    );

    if (transactionProduct) {
      const updateData: any = {
        status: action === 'delivered' ? 'success' : 
                action === 'in_progress' ? 'in_progress' : 'pending'
      };

      if (referenceLink) {
        updateData.referenceLink = referenceLink;
      }

      await prisma.transactionProduct.update({
        where: { id: transactionProduct.id },
        data: updateData
      });
    }

    // If status is delivered, check if we should complete the main transaction
    if (action === 'delivered') {
      // Check if all product services in the transaction are completed
      const allProductServices = await prisma.servicesProductCustomers.findMany({
        where: { transactionId: service.transactionId }
      });

      const allCompleted = allProductServices.every(ps => 
        ps.id === id ? true : ps.status === 'delivered'
      );

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
    }

    return withCORS(NextResponse.json({
      success: true,
      message: `Product transaction status updated to ${action}`
    }));

  } catch (error) {
    console.error('Error updating product transaction status:', error);
    return withCORS(NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    ));
  }
}
