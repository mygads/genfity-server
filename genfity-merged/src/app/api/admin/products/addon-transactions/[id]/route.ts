import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'delivered']),
  driveUrl: z.string().optional(),
  fileAssets: z.string().optional(),
  notes: z.string().optional(),
});

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}

// GET /api/admin/products/addon-transactions/[id] - Get addon transaction details
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

    // Find the service record with all related data
    const service = await prisma.servicesAddonsCustomers.findUnique({
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
            payment: {
              select: {
                id: true,
                status: true,
                method: true,
                amount: true,
                createdAt: true,
                updatedAt: true
              }
            },
            addonTransactions: {
              include: {
                addon: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name_en: true,
                        name_id: true,
                        icon: true
                      }
                    }
                  }
                }
              }
            }
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

    // Transform data for frontend
    const transformedData = {
      id: service.id,
      transactionId: service.transactionId,
      userId: service.customerId,
      amount: Number(service.transaction.amount),
      status: service.status,
      currency: service.transaction.currency,
      type: 'addon',
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
      notes: service.transaction.notes,
      mainTransactionStatus: service.transaction.status,
      payment: service.transaction.payment ? {
        id: service.transaction.payment.id,
        status: service.transaction.payment.status,
        method: service.transaction.payment.method,
        amount: Number(service.transaction.payment.amount),
        createdAt: service.transaction.payment.createdAt.toISOString(),
        updatedAt: service.transaction.payment.updatedAt.toISOString()
      } : undefined,
      user: service.customer,
      addonInfo: {
        id: service.id,
        addonDetails: service.addonDetails,
        driveUrl: service.driveUrl,
        fileAssets: service.fileAssets,
        addons: service.transaction.addonTransactions.map((at: any) => ({
          id: at.addon.id,
          name_en: at.addon.name_en,
          name_id: at.addon.name_id,
          description_en: at.addon.description_en,
          description_id: at.addon.description_id,
          price_idr: Number(at.addon.price_idr),
          price_usd: Number(at.addon.price_usd),
          category: at.addon.category,
          quantity: at.quantity
        }))
      },
      // Service delivery info
      deliveryNotes: service.notes
    };

    return withCORS(NextResponse.json({
      success: true,
      data: transformedData
    }));

  } catch (error) {
    console.error('Error fetching addon transaction details:', error);
    return withCORS(NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    ));
  }
}

// PUT /api/admin/products/addon-transactions/[id] - Update addon transaction status
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
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { status, driveUrl, fileAssets, notes } = validation.data;

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Add delivery info if provided
    if (driveUrl !== undefined) updateData.driveUrl = driveUrl;
    if (fileAssets !== undefined) updateData.fileAssets = fileAssets;
    if (notes !== undefined) updateData.notes = notes;

    // Add timestamp based on status
    if (status === 'delivered') updateData.deliveredAt = new Date();

    // Update the service status
    const updatedService = await prisma.servicesAddonsCustomers.update({
      where: { id },
      data: updateData,
      include: {
        transaction: {
          include: {
            addonTransactions: true
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

    // Update related TransactionAddon status if exists
    for (const addonTransaction of updatedService.transaction.addonTransactions) {
      const addonStatus = status === 'delivered' ? 'success' : 
                         status === 'in_progress' ? 'in_progress' : 'pending';
      
      await prisma.transactionAddons.update({
        where: { id: addonTransaction.id },
        data: { status: addonStatus }
      });
    }

    // If status is being updated to 'delivered', check transaction completion
    if (status === 'delivered') {
      try {
        // Check if all addon services in the transaction are completed
        const allAddonServices = await prisma.servicesAddonsCustomers.findMany({
          where: { transactionId: updatedService.transactionId }
        });

        const allCompleted = allAddonServices.every(as => 
          as.id === id ? true : as.status === 'delivered'
        );

        // If all addon services are completed, check if we should complete the main transaction
        if (allCompleted) {
          // Check if there are other services (products, WhatsApp) in this transaction
          const [productServices, whatsappServices] = await Promise.all([
            prisma.servicesProductCustomers.findMany({
              where: { transactionId: updatedService.transactionId }
            }),
            prisma.servicesWhatsappCustomers.findMany({
              where: { transactionId: updatedService.transactionId }
            })
          ]);

          // Check if all services are completed
          const allProductsCompleted = productServices.length === 0 || 
            productServices.every(ps => ps.status === 'delivered');
          const allWhatsappCompleted = whatsappServices.length === 0 || 
            whatsappServices.every(ws => ws.status === 'active');

          if (allProductsCompleted && allWhatsappCompleted) {
            // Complete the main transaction
            await prisma.transaction.update({
              where: { id: updatedService.transactionId },
              data: {
                status: 'success',
                updatedAt: new Date()
              }
            });
          }
        }
      } catch (error) {
        console.error('[ADMIN_DELIVERY] Error updating transaction status:', error);
        // Don't fail the update if status update fails
      }
    }

    return withCORS(NextResponse.json({
      success: true,
      data: updatedService,
      message: `Addon service status updated to ${status}`
    }));

  } catch (error: any) {
    console.error('Error updating addon transaction status:', error);
    
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
