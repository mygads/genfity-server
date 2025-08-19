import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";
import { z } from "zod";
import { PaymentExpirationService } from "@/lib/payment-expiration";

const querySchema = z.object({
  page: z.string().nullable().transform(val => val || "1"),
  limit: z.string().nullable().transform(val => val || "10"),
  status: z.enum(['pending', 'paid', 'failed', 'all']).nullable().transform(val => val || 'all'),
  method: z.string().nullable().optional(),
  currency: z.enum(['idr', 'usd', 'all']).nullable().transform(val => val || 'all'),
  search: z.string().nullable().optional(),
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
});

// GET /api/admin/payments - Get all payments with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    // Auto-expire all payments and transactions
    await PaymentExpirationService.autoExpireOnApiCall();

    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      method: searchParams.get('method'),
      currency: searchParams.get('currency'),
      search: searchParams.get('search'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
    });

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { page, limit, status, method, currency, search, dateFrom, dateTo } = validation.data;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause for filtering
    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (method) {
      where.method = { contains: method, mode: 'insensitive' };
    }

    if (currency !== 'all') {
      where.transaction = {
        currency: currency
      };
    }

    if (search) {
      where.OR = [
        { externalId: { contains: search, mode: 'insensitive' } },
        { transaction: { 
          user: { 
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } }
            ]
          } 
        } }
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }    // Create separate where clause for count (without mode: 'insensitive')
    const countWhere: any = JSON.parse(JSON.stringify(where));
    
    // Remove mode from nested objects for count query
    const removeMode = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (key === 'mode') {
            delete obj[key];
          } else if (typeof obj[key] === 'object') {
            removeMode(obj[key]);
          }
        }
      }
    };
    removeMode(countWhere);

    // Get payments with pagination
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          transaction: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },              productTransactions: {
                include: {
                  package: {
                    select: { id: true, name_en: true, name_id: true }
                  }
                }
              },
              addonTransactions: {
                include: {
                  addon: {
                    select: { id: true, name_en: true, name_id: true }
                  }
                }
              },
              whatsappTransaction: {
                include: {
                  whatsappPackage: {
                    select: { id: true, name: true }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.payment.count({ where: countWhere })
    ]);

    // Get payment statistics
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { amount: true },
    });

    const statistics = {
      total: totalCount,
      pending: stats.find(s => s.status === 'pending')?._count._all || 0,
      paid: stats.find(s => s.status === 'paid')?._count._all || 0,
      failed: stats.find(s => s.status === 'failed')?._count._all || 0,
      totalAmount: stats.reduce((sum, s) => sum + (Number(s._sum.amount) || 0), 0),
      pendingAmount: Number(stats.find(s => s.status === 'pending')?._sum.amount || 0),
      paidAmount: Number(stats.find(s => s.status === 'paid')?._sum.amount || 0),
    };    // Transform payments data for frontend
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      serviceFee: Number(payment.serviceFee || 0),
      method: payment.method,
      status: payment.status,
      externalId: payment.externalId,
      paymentUrl: payment.paymentUrl,
      createdAt: payment.createdAt,
      paymentDate: payment.paymentDate,
      updatedAt: payment.updatedAt,
      expiresAt: payment.expiresAt,      
      transaction: payment.transaction ? {
        id: payment.transaction.id,
        currency: payment.transaction.currency,
        status: payment.transaction.status,
        type: payment.transaction.type,
        amount: Number(payment.transaction.amount),
        finalAmount: Number(payment.transaction.finalAmount || 0),
        expiresAt: payment.transaction.expiresAt,
        user: payment.transaction.user || null,
        items: getTransactionItems(payment.transaction),
      } : null,
      
      // Expiration info
      expirationInfo: {
        paymentExpiresAt: payment.expiresAt,
        transactionExpiresAt: payment.transaction?.expiresAt,
        paymentTimeRemaining: payment.expiresAt ? Math.max(0, Math.floor((new Date(payment.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60))) + " hours" : null,
        transactionTimeRemaining: payment.transaction?.expiresAt ? Math.max(0, Math.floor((new Date(payment.transaction.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + " days" : null,
        isPaymentExpired: payment.expiresAt ? new Date() > new Date(payment.expiresAt) : false,
        isTransactionExpired: payment.transaction?.expiresAt ? new Date() > new Date(payment.transaction.expiresAt) : false
      },
      
      canApprove: payment.status === 'pending' && (payment.method.includes('manual') || payment.method.includes('bank_transfer')),
      needsManualApproval: (payment.method.includes('manual') || payment.method.includes('bank_transfer')) && payment.status === 'pending',
    }));

    return withCORS(NextResponse.json({
      success: true,
      data: {
        payments: transformedPayments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          hasNext: skip + parseInt(limit) < totalCount,
          hasPrev: parseInt(page) > 1,
        },
        statistics,
        filters: {
          status,
          method,
          currency,
          search,
          dateFrom,
          dateTo,
        }
      }
    }));

  } catch (error) {
    console.error("[ADMIN_PAYMENTS_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    ));
  }
}

// Helper function to extract transaction items
function getTransactionItems(transaction: any) {
  const items = [];
  
  // Handle multiple products
  if (transaction.productTransactions && transaction.productTransactions.length > 0) {
    transaction.productTransactions.forEach((productTx: any) => {
      if (productTx.package) {
        items.push({
          type: 'package',
          name: productTx.package.name_en,
          category: 'Product Package',
          quantity: productTx.quantity || 1,
        });
      }
    });
  }
  
  // Add add-ons from addonTransactions
  if (transaction.addonTransactions) {
    transaction.addonTransactions.forEach((addonTx: any) => {
      items.push({
        type: 'addon',
        name: addonTx.addon.name_en,
        category: 'Product Addon',
        quantity: addonTx.quantity,
      });
    });
  }
  
  if (transaction.whatsappTransaction?.whatsappPackage) {
    items.push({
      type: 'whatsapp_service',
      name: transaction.whatsappTransaction.whatsappPackage.name,
      category: 'WhatsApp Service'
    });
  }
  
  return items;
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
