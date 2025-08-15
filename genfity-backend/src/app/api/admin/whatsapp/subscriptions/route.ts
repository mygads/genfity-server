import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/admin/whatsapp/subscriptions - Get all WhatsApp subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const { searchParams } = new URL(request.url);
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
    }    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
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
    ]);    // Get session counts for each user
    const userIds = subscriptions.map(sub => sub.customerId);
    const sessionCounts = await prisma.whatsAppSession.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
    });

    const sessionCountMap = sessionCounts.reduce((acc, item) => {
      acc[item.userId] = item._count.id;
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
      currentSessions: sessionCountMap[subscription.customerId] || 0,
      maxSessions: subscription.package.maxSession,
      sessionUtilization: Math.round(((sessionCountMap[subscription.customerId] || 0) / subscription.package.maxSession) * 100),
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
  } catch (error) {
    console.error("[ADMIN_WHATSAPP_SUBSCRIPTIONS_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch subscriptions" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
