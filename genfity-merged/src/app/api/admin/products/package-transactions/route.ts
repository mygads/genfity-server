import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    // Fetch all ServicesProductCustomers records with complete details
    const productServices = await prisma.servicesProductCustomers.findMany({
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
                amount: true
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to match frontend expectations
    const transformedData = productServices.map(service => {
      // Get package info from either direct relation or transaction
      const packageInfo = service.package || service.transaction.productTransactions[0]?.package;
      const transactionProduct = service.transaction.productTransactions[0];
      
      return {
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
          amount: Number(service.transaction.payment.amount)
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
            price_idr: Number(packageInfo.price_idr),
            price_usd: Number(packageInfo.price_usd),
            category: packageInfo.category,
            subcategory: packageInfo.subcategory,
            features: packageInfo.features
          } : undefined,
          unitPrice: packageInfo ? {
            idr: Number(packageInfo.price_idr),
            usd: Number(packageInfo.price_usd)
          } : { idr: 0, usd: 0 },
          totalPrice: packageInfo ? {
            idr: Number(packageInfo.price_idr) * service.quantity,
            usd: Number(packageInfo.price_usd) * service.quantity
          } : { idr: 0, usd: 0 }
        },
        deliveryStatus: service.status
      };
    });

    return withCORS(NextResponse.json({
      success: true,
      data: transformedData
    }));

  } catch (error) {
    console.error("Error fetching product transactions:", error);
    return withCORS(NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product transactions"
      },
      { status: 500 }
    ));
  }
}
