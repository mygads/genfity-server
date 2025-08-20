import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const querySchema = z.object({
  page: z.string().nullable().transform(val => val || "1"),
  limit: z.string().nullable().transform(val => val || "100"),
  status: z.enum(['pending', 'in_progress', 'delivered', 'all']).nullable().transform(val => val || 'all'),
  search: z.string().nullable().optional(),
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
});

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}

// GET /api/admin/products/package-deliveries - Get all package deliveries with filtering
export async function GET(request: NextRequest) {
  try {
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

    const { page, limit, status, search, dateFrom, dateTo } = validation.data;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where: any = {
      transaction: {
        status: {
          in: ['pending', 'in_progress', 'success'] // Show transactions with payments
        }
      }
    };

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Search filter
    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { package: { name_en: { contains: search, mode: 'insensitive' } } },
        { package: { name_id: { contains: search, mode: 'insensitive' } } },
        { domainName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Date filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Fetch product services
    const [productServices, totalCount] = await Promise.all([
      prisma.servicesProductCustomers.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.servicesProductCustomers.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return withCORS(NextResponse.json({
      success: true,
      data: productServices,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }));
    
  } catch (error: any) {
    console.error('Error fetching package deliveries:', error);
    return withCORS(NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch package deliveries",
        details: error.message 
      },
      { status: 500 }
    ));
  }
}
