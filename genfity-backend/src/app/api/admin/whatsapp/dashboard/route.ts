import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import WhatsAppMessageTracker from '@/lib/whatsapp-message-tracker';

const prisma = new PrismaClient();

// GET /api/admin/whatsapp/dashboard - Get comprehensive WhatsApp dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get today's date for filtering today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);    // 1. Total subscribers (users with active WhatsApp services)
    const totalSubscribers = await prisma.servicesWhatsappCustomers.count({
      where: {
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

    // Total revenue from WhatsApp packages
    const totalRevenue = await prisma.transaction.aggregate({
      where: {
        whatsappTransaction: {
          isNot: null,
        },
        status: 'paid',
      },
      _sum: {
        finalAmount: true,
      },
    });

    // Average session duration (mock data for now, as we don't track this yet)
    const avgSessionDuration = 45; // minutes

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
      totalRevenue: totalRevenue._sum.finalAmount || 0,
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
        subscriberGrowthRate: '12.5%', // This would need historical data
        messageVolumeGrowth: '8.3%',   // This would need historical data
        revenueGrowth: '15.2%',        // This would need historical data
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
