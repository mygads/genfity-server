import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { PaymentExpirationService } from "@/lib/payment-expiration";

// GET /api/customer/payment - Get all payments for authenticated customer
export async function GET(request: NextRequest) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required. Please login first." },
        { status: 401 }
      ));
    }

    // Auto-expire payments and transactions
    await PaymentExpirationService.autoExpireOnApiCall();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // pending, paid, failed, cancelled
    const method = searchParams.get('method');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      transaction: {
        userId: userAuth.id
      }
    };

    if (status) {
      whereClause.status = status;
    }

    if (method) {
      whereClause.method = method;
    }

    // Get payments with pagination
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,        include: {
          transaction: {
            include: {
              productTransactions: {
                include: {
                  package: {
                    select: {
                      id: true,
                      name_en: true,
                      name_id: true
                    }
                  }
                }
              },
              addonTransactions: {
                include: {
                  addon: {
                    select: {
                      id: true,
                      name_en: true,
                      name_id: true
                    }
                  }
                }
              },
              whatsappTransaction: {
                include: {
                  whatsappPackage: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              },
              voucher: {
                select: {
                  id: true,
                  code: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.payment.count({
        where: whereClause
      })
    ]);    // Format response
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      transactionId: payment.transactionId,
      amount: Number(payment.amount),
      serviceFee: Number(payment.serviceFee || 0),
      method: payment.method,
      status: payment.status,
      paymentUrl: payment.paymentUrl,
      externalId: payment.externalId,
      paymentDate: payment.paymentDate,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      expiresAt: payment.expiresAt,      
      transaction: payment.transaction ? {
        id: payment.transaction.id,
        type: payment.transaction.type,
        currency: payment.transaction.currency,
        status: payment.transaction.status,
        originalAmount: Number(payment.transaction.originalAmount),
        discountAmount: Number(payment.transaction.discountAmount || 0),
        totalAfterDiscount: Number(payment.transaction.totalAfterDiscount || payment.transaction.amount),
        finalAmount: Number(payment.transaction.finalAmount || payment.transaction.amount),
        expiresAt: payment.transaction.expiresAt,
        items: [] as Array<{type: string, name: string, id: string, duration?: string}>
      } : null,
      voucher: payment.transaction?.voucher ? {
        code: payment.transaction.voucher.code,
        name: payment.transaction.voucher.name
      } : null
    }));    // Add items to each payment that has a transaction
    formattedPayments.forEach(payment => {
      if (payment.transaction && payment.transaction.type === 'product') {
        const paymentData = payments.find(p => p.id === payment.id);
        const productTransactions = paymentData?.transaction?.productTransactions || [];
        const addonTransactions = paymentData?.transaction?.addonTransactions || [];
        
        // Add product packages
        productTransactions.forEach((productTx: any) => {
          if (productTx?.package && payment.transaction?.items) {
            payment.transaction.items.push({
              type: 'package',
              name: productTx.package.name_en,
              id: productTx.package.id
            });
          }
        });
        
        // Add add-ons
        addonTransactions.forEach((addonTx: any) => {
          if (addonTx?.addon && payment.transaction?.items) {
            payment.transaction.items.push({
              type: 'addon',
              name: addonTx.addon.name_en,
              id: addonTx.addon.id
            });
          }
        });
      } else if (payment.transaction && payment.transaction.type === 'whatsapp_service') {
        const paymentData = payments.find(p => p.id === payment.id);
        const whatsappTx = paymentData?.transaction?.whatsappTransaction;
        if (whatsappTx?.whatsappPackage && payment.transaction?.items) {
          payment.transaction.items.push({
            type: 'whatsapp_service',
            name: whatsappTx.whatsappPackage.name,
            id: whatsappTx.whatsappPackage.id,
            duration: whatsappTx.duration
          });
        }
      }
    });

    const totalPages = Math.ceil(totalCount / limit);

    return withCORS(NextResponse.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      },
      message: "Payments retrieved successfully"
    }));

  } catch (error) {
    console.error("[CUSTOMER_PAYMENTS_LIST_ERROR]", error);
    
    if (error instanceof Error) {
      return withCORS(NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      ));
    }

    return withCORS(NextResponse.json(
      { success: false, error: "Failed to retrieve payments" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
