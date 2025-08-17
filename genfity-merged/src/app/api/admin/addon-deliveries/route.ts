import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import jwt from 'jsonwebtoken';

// Helper function to verify admin JWT token
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    // Check if user has admin role
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/admin/addon-deliveries - Get addon deliveries with stats
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminToken(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {};
    
    if (search) {
      whereConditions.OR = [
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          transactionId: { contains: search, mode: 'insensitive' }
        }
      ];
    }
    
    if (status !== 'all') {
      whereConditions.status = status;
    }

    // Get deliveries with pagination
    const [deliveries, total] = await Promise.all([
      prisma.servicesAddonsCustomers.findMany({
        where: whereConditions,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          transaction: {
            select: {
              id: true,
              finalAmount: true,
              currency: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.servicesAddonsCustomers.count({
        where: whereConditions
      })
    ]);

    // Get stats
    const stats = await prisma.servicesAddonsCustomers.aggregate({
      _count: {
        id: true
      },
      where: {}
    });

    const statusCounts = await prisma.servicesAddonsCustomers.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const deliveryStats = {
      totalDeliveries: stats._count.id,
      pendingDeliveries: statusStats['pending'] || 0,
      inProgressDeliveries: statusStats['in_progress'] || 0,
      completedDeliveries: statusStats['delivered'] || 0,
      completionRate: stats._count.id > 0 
        ? ((statusStats['delivered'] || 0) / stats._count.id) * 100 
        : 0
    };

    return withCORS(NextResponse.json({
      deliveries,
      stats: deliveryStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }));

  } catch (error) {
    console.error('Error fetching addon deliveries:', error);
    return withCORS(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
