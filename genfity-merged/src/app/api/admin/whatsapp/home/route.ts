import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import WhatsAppMessageTracker from '@/lib/whatsapp-message-tracker';

// GET /api/admin/whatsapp/dashboard - Get comprehensive WhatsApp dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date for filtering today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);    // 1. Total subscribers (users with active WhatsApp services)
    const totalSubscribers = await prisma.servicesWhatsappCustomers.count({
      where: {
        status: 'active',
        expiredAt: {
          gte: new Date(), // Not expired
        },
      },
    });

    // 2. Total messages sent overall (across all time)
    const totalMessagesStats = await prisma.whatsAppMessageStats.aggregate({
      _sum: {
        totalMessagesSent: true,
        totalMessagesFailed: true,
      },
    });

    const totalMessagesSent = totalMessagesStats._sum.totalMessagesSent || 0;
    const totalMessagesFailed = totalMessagesStats._sum.totalMessagesFailed || 0;
    const totalMessages = totalMessagesSent + totalMessagesFailed;

    // 3. Active sessions count
    const activeSessions = await prisma.whatsAppSession.count({
      where: {
        status: 'connected',
        isTerminated: false,
      },
    });

    // 4. Most purchased WhatsApp packages
    const topPackages = await prisma.transactionWhatsappService.groupBy({
      by: ['whatsappPackageId'],
      _count: {
        whatsappPackageId: true,
      },
      orderBy: {
        _count: {
          whatsappPackageId: 'desc',
        },
      },
      take: 5,
    });

    // Get package details for top packages
    const topPackagesWithDetails = await Promise.all(
      topPackages.map(async (pkg) => {
        const packageDetails = await prisma.whatsappApiPackage.findUnique({
          where: { id: pkg.whatsappPackageId },
          select: {
            id: true,
            name: true,
            description: true,
            priceMonth: true,
            priceYear: true,
            maxSession: true,
          },
        });
        return {
          ...packageDetails,
          purchaseCount: pkg._count.whatsappPackageId,
        };
      })
    );

    // 5. Messages sent today
    const todayMessagesStats = await prisma.whatsAppMessageStats.findMany({
      where: {
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        totalMessagesSent: true,
        totalMessagesFailed: true,
      },
    });

    const todayMessagesSent = todayMessagesStats.reduce(
      (sum, stat) => sum + stat.totalMessagesSent, 
      0
    );
    const todayMessagesFailed = todayMessagesStats.reduce(
      (sum, stat) => sum + stat.totalMessagesFailed, 
      0
    );
    const todayTotalMessages = todayMessagesSent + todayMessagesFailed;

    // 6. Additional statistics
    const totalUsers = await prisma.user.count();
    
    const totalWhatsAppUsers = await prisma.user.count({
      where: {
        whatsAppSessions: {
          some: {},
        },
      },
    });

    // Success rate calculation
    const overallSuccessRate = totalMessages > 0 
      ? ((totalMessagesSent / totalMessages) * 100).toFixed(2)
      : '0.00';

    const todaySuccessRate = todayTotalMessages > 0
      ? ((todayMessagesSent / todayTotalMessages) * 100).toFixed(2)
      : '0.00';

    // Total revenue from WhatsApp packages (only successful transactions)
    const revenueResult = await prisma.transaction.aggregate({
      where: {
        whatsappTransaction: {
          isNot: null,
        },
        status: 'success', // Only completed transactions
      },
      _sum: {
        finalAmount: true,
      },
    });

    // Calculate growth metrics (comparing with last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    // Subscriber growth (active services this month vs last month)
    const lastMonthSubscribers = await prisma.servicesWhatsappCustomers.count({
      where: {
        status: 'active',
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
    });

    const subscriberGrowthRate = lastMonthSubscribers > 0 
      ? (((totalSubscribers - lastMonthSubscribers) / lastMonthSubscribers) * 100).toFixed(1)
      : totalSubscribers > 0 ? '100.0' : '0.0';

    // Message volume growth (this month vs last month)
    const lastMonthMessages = await prisma.whatsAppMessageStats.aggregate({
      where: {
        updatedAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
      _sum: {
        totalMessagesSent: true,
      },
    });

    const lastMonthMessagesSent = lastMonthMessages._sum.totalMessagesSent || 0;
    const messageVolumeGrowth = lastMonthMessagesSent > 0
      ? (((totalMessagesSent - lastMonthMessagesSent) / lastMonthMessagesSent) * 100).toFixed(1)
      : totalMessagesSent > 0 ? '100.0' : '0.0';

    // Revenue growth (this month vs last month)
    const lastMonthRevenue = await prisma.transaction.aggregate({
      where: {
        whatsappTransaction: {
          isNot: null,
        },
        status: 'success',
        updatedAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
      _sum: {
        finalAmount: true,
      },
    });

    const lastMonthRevenueAmount = Number(lastMonthRevenue._sum.finalAmount || 0);
    const currentRevenue = Number(revenueResult._sum.finalAmount || 0);
    const revenueGrowth = lastMonthRevenueAmount > 0
      ? (((currentRevenue - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100).toFixed(1)
      : currentRevenue > 0 ? '100.0' : '0.0';

    // Average session duration - not tracked yet in database schema
    // When we implement session duration tracking, this should be calculated from:
    // (endTime - startTime) for completed sessions
    const avgSessionDuration = 0; // minutes - no data available yet

    const dashboardData = {
      // Overall Statistics
      totalSubscribers,
      totalMessagesSent,
      totalMessagesFailed,
      totalMessages,
      overallSuccessRate,
      activeSessions,
      totalWhatsAppUsers,
      totalUsers,
      totalRevenue: Number(revenueResult._sum.finalAmount || 0),
      avgSessionDuration,

      // Today's Statistics
      todayMessagesSent,
      todayMessagesFailed,
      todayTotalMessages,
      todaySuccessRate,

      // Top Products
      topPackages: topPackagesWithDetails,

      // Additional metrics
      metrics: {
        subscriberGrowthRate: `${subscriberGrowthRate}%`,
        messageVolumeGrowth: `${messageVolumeGrowth}%`,
        revenueGrowth: `${revenueGrowth}%`,
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });

  } catch (error) {
    console.error('Error getting WhatsApp dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
