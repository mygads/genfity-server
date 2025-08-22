import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { withRoleAuthentication } from "@/lib/request-auth";

// GET /api/admin/whatsapp/subscriptions - Get all WhatsApp subscriptions
export async function GET(req: NextRequest) {
  return withRoleAuthentication(req, ['admin'], async (user) => {

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'active', 'expired', or 'all'
    const search = searchParams.get('search'); // search by user name/email

    const offset = (page - 1) * limit;
    const now = new Date();

    // Build where clause
    const where: any = {};

    if (status === 'active') {
      where.expiredAt = { gt: now };
    } else if (status === 'expired') {
      where.expiredAt = { lte: now };
    }

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [subscriptions, total] = await Promise.all([
      prisma.servicesWhatsappCustomers.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              description: true,
              maxSession: true,
              priceMonth: true,
              priceYear: true,
            },
          },
        },
        orderBy: { expiredAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.servicesWhatsappCustomers.count({ where }),
    ]);

    // Get session counts for each user
    const userIds = subscriptions.map(sub => sub.customerId).filter(id => id !== null);
    const sessionCounts = await prisma.whatsAppSession.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
    });

    const sessionCountMap = sessionCounts.reduce((acc, item) => {
      if (item.userId) {
        acc[item.userId] = item._count.id;
      }
      return acc;
    }, {} as Record<string, number>);

    // Format response data
    const formattedSubscriptions = subscriptions.map(subscription => ({
      id: subscription.id,
      user: subscription.customer,
      package: subscription.package,
      expiredAt: subscription.expiredAt,
      createdAt: subscription.createdAt,
      isActive: subscription.expiredAt > now,
      daysUntilExpiry: Math.ceil((subscription.expiredAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      currentSessions: sessionCountMap[subscription.customerId || ''] || 0,
      maxSessions: subscription.package?.maxSession || 0,
      sessionUtilization: Math.round(((sessionCountMap[subscription.customerId || ''] || 0) / (subscription.package?.maxSession || 1)) * 100),
    }));

    // Get statistics
    const activeCount = await prisma.servicesWhatsappCustomers.count({
      where: { expiredAt: { gt: now } },
    });
    const expiredCount = await prisma.servicesWhatsappCustomers.count({
      where: { expiredAt: { lte: now } },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: {
        subscriptions: formattedSubscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        statistics: {
          active: activeCount,
          expired: expiredCount,
          total: activeCount + expiredCount,
        },
      },
    }));
  });
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
