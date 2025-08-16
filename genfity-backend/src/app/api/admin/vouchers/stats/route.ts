import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Get voucher usage statistics
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const voucherId = searchParams.get('voucherId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause for voucher usage
    const where: any = {};

    if (voucherId) {
      where.voucherId = voucherId;
    }

    if (startDate || endDate) {
      where.usedAt = {};
      if (startDate) {
        where.usedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.usedAt.lte = new Date(endDate);
      }
    }

    // Get usage statistics
    const [
      totalUsage,
      usageByVoucher,
      recentUsage,
      topUsers,
      dailyUsage,
    ] = await Promise.all([
      // Total usage count and discount amount
      prisma.voucherUsage.aggregate({
        where,
        _count: true,
        _sum: {
          discountAmount: true,
        },
      }),

      // Usage grouped by voucher
      prisma.voucherUsage.groupBy({
        by: ['voucherId'],
        where,
        _count: true,
        _sum: {
          discountAmount: true,
        },
        orderBy: {
          _count: {
            voucherId: 'desc',
          },
        },
        take: 10,
      }),

      // Recent usage (last 10)
      prisma.voucherUsage.findMany({
        where,
        include: {
          voucher: {
            select: {
              code: true,
              name: true,
              type: true,
              discountType: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          transaction: {
            select: {
              id: true,
              amount: true,
              transactionDate: true,
            },
          },
        },
        orderBy: { usedAt: 'desc' },
        take: 10,
      }),

      // Top users by voucher usage
      prisma.voucherUsage.groupBy({
        by: ['userId'],
        where,
        _count: true,
        _sum: {
          discountAmount: true,
        },
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),      // Daily usage for the last 30 days
      prisma.voucherUsage.findMany({
        where: {
          ...where,
          usedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: {
          usedAt: true,
          discountAmount: true,
        },
        orderBy: { usedAt: 'desc' },
      }),
    ]);

    // Get voucher details for usage by voucher
    const voucherIds = usageByVoucher.map(usage => usage.voucherId);
    const voucherDetails = await prisma.voucher.findMany({
      where: {
        id: { in: voucherIds },
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        discountType: true,
      },
    });

    // Merge voucher details with usage data
    const usageWithDetails = usageByVoucher.map(usage => ({
      ...usage,
      voucher: voucherDetails.find(v => v.id === usage.voucherId),
    }));

    // Get user details for top users
    const userIds = topUsers.map(user => user.userId);
    const userDetails = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Merge user details with usage data
    const topUsersWithDetails = topUsers.map(usage => ({
      ...usage,
      user: userDetails.find(u => u.id === usage.userId),
    }));    // Process daily usage data
    const dailyUsageMap = new Map();
    dailyUsage.forEach(usage => {
      const date = usage.usedAt.toISOString().split('T')[0];
      if (!dailyUsageMap.has(date)) {
        dailyUsageMap.set(date, {
          date,
          usage_count: 0,
          total_discount: 0,
        });
      }
      const dayData = dailyUsageMap.get(date);
      dayData.usage_count += 1;
      dayData.total_discount += Number(usage.discountAmount);
    });
    
    const processedDailyUsage = Array.from(dailyUsageMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        totalUsage: {
          count: totalUsage._count,
          totalDiscount: totalUsage._sum.discountAmount || 0,
        },
        usageByVoucher: usageWithDetails,
        recentUsage,
        topUsers: topUsersWithDetails,
        dailyUsage: processedDailyUsage,
      },
    });
  } catch (error) {
    console.error('Error fetching voucher statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voucher statistics' },
      { status: 500 }
    );
  }
}
