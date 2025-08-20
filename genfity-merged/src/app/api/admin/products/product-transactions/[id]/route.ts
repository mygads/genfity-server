import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}

// GET /api/admin/products/product-transactions/[id] - Get product transaction details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Find the service record with all related data
    const service = await prisma.servicesProductCustomers.findUnique({
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
            productTransactions: {
              include: {
                package: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name_en: true,
                        name_id: true,
                        icon: true
                      }
                    },
                    subcategory: {
                      select: {
                        id: true,
                        name_en: true,
                        name_id: true
                      }
                    },
                    features: true
                  }
                }
              }
            },
            // Include other services in this transaction
            whatsappTransaction: true,
            addonTransactions: {
              include: {
                addon: true
              }
            }
          }
        },
        package: {
          include: {
            category: {
              select: {
                id: true,
                name_en: true,
                name_id: true,
                icon: true
              }
            },
            subcategory: {
              select: {
                id: true,
                name_en: true,
                name_id: true
              }
            },
            features: true
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

    // Get package info from either direct relation or transaction
    const packageInfo = service.package || service.transaction.productTransactions[0]?.package;
    const transactionProduct = service.transaction.productTransactions.find(
      (tp: any) => tp.packageId === service.packageId
    );

    // Transform data for frontend
    const transformedData = {
      id: service.id,
      transactionId: service.transactionId,
      userId: service.customerId,
      amount: Number(service.transaction.amount),
      status: transactionProduct?.status || 'created',
      currency: service.transaction.currency,
      type: 'product',
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
      productInfo: {
        id: service.id,
        packageId: service.packageId,
        quantity: service.quantity,
        referenceLink: transactionProduct?.referenceLink,
        package: packageInfo ? {
          id: packageInfo.id,
          name_en: packageInfo.name_en,
          name_id: packageInfo.name_id,
          description_en: packageInfo.description_en,
          description_id: packageInfo.description_id,
          price: Number((packageInfo as any).price || 0),
          category: packageInfo.category,
          subcategory: packageInfo.subcategory,
          features: packageInfo.features
        } : null
      },
      // Include other services in the same transaction (simplified)
      relatedServices: {
        hasWhatsappService: !!service.transaction.whatsappTransaction,
        hasAddonServices: service.transaction.addonTransactions.length > 0
      }
    };

    return withCORS(NextResponse.json({
      success: true,
      data: transformedData
    }));

  } catch (error) {
    console.error('Error fetching product transaction details:', error);
    return withCORS(NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    ));
  }
}
