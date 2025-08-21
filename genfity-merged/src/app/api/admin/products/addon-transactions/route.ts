import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const querySchema = z.object({
  page: z.string().nullable().transform(val => val || "1"),
  limit: z.string().nullable().transform(val => val || "100"),
  status: z.enum(['pending', 'in_progress', 'delivered', 'all']).nullable().transform(val => val || 'all'),
  transactionStatus: z.enum(['created', 'pending', 'in_progress', 'success', 'all']).nullable().transform(val => val || 'all'),
  search: z.string().nullable().optional(),
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
});

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}

// GET /api/admin/products/addon-transactions - Get all addon transactions with filtering
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

    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      transactionStatus: searchParams.get('transactionStatus'),
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

    const { page, limit, status, transactionStatus, search, dateFrom, dateTo } = validation.data;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where: any = {};

    // Status filter (for ServicesAddonsCustomers status)
    if (status !== 'all') {
      where.status = status;
    }

    // Transaction status filter
    if (transactionStatus !== 'all') {
      where.transaction = { status: transactionStatus };
    }

    // Search filter
    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { transaction: { id: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Date filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Fetch all ServicesAddonsCustomers records with complete details
    const [addonServices, totalCount] = await Promise.all([
      prisma.servicesAddonsCustomers.findMany({
        where,
        skip,
        take: parseInt(limit),
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.servicesAddonsCustomers.count({ where })
    ]);

    // Transform data to match frontend expectations
    const transformedData = addonServices.map(service => {
      return {
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
          amount: Number(service.transaction.payment.amount)
        } : undefined,
        user: service.customer,
        addonInfo: {
          id: service.id,
          addonDetails: service.addonDetails,
          driveUrl: service.driveUrl,
          fileAssets: service.fileAssets,
          addons: service.transaction.addonTransactions.map(at => ({
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
        }
      };
    });

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return withCORS(NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    }));

  } catch (error) {
    console.error('Error fetching addon transactions:', error);
    return withCORS(NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    ));
  }
}
