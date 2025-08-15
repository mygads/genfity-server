import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper function to get date range filters
function getDateRangeFilter(period: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return {
        gte: weekAgo,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      return {
        gte: monthAgo,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    default:
      return {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
  }
}

// Helper function to format currency
function formatCurrency(amount: number, currency: string): string {
  if (currency === 'idr') {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  } else {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
}

// GET /api/admin/dashboard/analytics - Get comprehensive dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month
    const currency = searchParams.get('currency') || 'idr'; // idr, usd
    
    const dateFilter = getDateRangeFilter(period);    // 1. Transaction Analytics
    const [
      totalTransactionsRaw,
      completedTransactionsRaw,
      pendingTransactionsRaw,
      failedTransactionsRaw,
      revenueData,
      topProducts,
      categoryStats,
      paymentMethodBreakdown,
      hourlyDistribution,
      topUsers,
      serviceFeeAnalytics,
      conversionFunnel,
      monthlyGrowth,
      avgProcessingTime,
      // Addon delivery analytics
      totalAddonDeliveries,
      awaitingAddonDelivery,
      inProgressAddonDelivery,
      deliveredAddonDelivery,
      addonDeliveryTimes
    ] = await Promise.all([
      // Total transactions count
      prisma.transaction.count({
        where: {
          createdAt: dateFilter,
          currency: currency
        }
      }),
      
      // Completed transactions
      prisma.transaction.count({
        where: {
          status: 'paid',
          createdAt: dateFilter,
          currency: currency
        }
      }),
      
      // Pending transactions
      prisma.transaction.count({
        where: {
          status: 'pending',
          createdAt: dateFilter,
          currency: currency
        }
      }),
      
      // Failed transactions
      prisma.transaction.count({
        where: {
          status: 'failed',
          createdAt: dateFilter,
          currency: currency
        }
      }),
      
      // Revenue analytics
      prisma.transaction.aggregate({
        where: {
          status: 'paid',
          createdAt: dateFilter,
          currency: currency
        },
        _sum: {
          finalAmount: true,
          originalAmount: true,
          serviceFeeAmount: true,
          discountAmount: true
        },
        _avg: {
          finalAmount: true
        }
      }),
        // Top performing products
      prisma.transaction.findMany({
        where: {
          status: 'paid',
          createdAt: dateFilter,
          currency: currency,
          productTransactions: {
            some: {}
          }
        },
        include: {
          productTransactions: {
            include: {
              package: {
                select: {
                  id: true,
                  name_en: true,
                  name_id: true,                  price_idr: true,
                  price_usd: true
                }
              }
            }
          }
        },
        take: 10,
        orderBy: {
          finalAmount: 'desc'
        }
      }),      // Category performance stats
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          status: 'paid',
          createdAt: dateFilter,
          currency: currency
        },
        _count: {
          id: true
        },
        _sum: {
          finalAmount: true
        }
      }),

      // Payment method revenue breakdown
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          status: 'success',
          transaction: {
            status: 'paid',
            createdAt: dateFilter,
            currency: currency
          }
        },
        _count: {
          id: true
        },
        _sum: {
          amount: true
        }
      }),      // Hourly transaction distribution
      prisma.$queryRaw<{hour: number, count: number}[]>`
        SELECT 
          EXTRACT(HOUR FROM createdAt) as hour,
          COUNT(*) as count
        FROM Transaction 
        WHERE status = 'paid' 
          AND createdAt >= ${dateFilter.gte}
          AND createdAt < ${dateFilter.lt}
          AND currency = ${currency}
        GROUP BY EXTRACT(HOUR FROM createdAt)
        ORDER BY hour
      `,// Top performing users by revenue
      prisma.transaction.groupBy({
        by: ['userId'],
        where: {
          status: 'paid',
          createdAt: dateFilter,
          currency: currency
        },
        _count: {
          id: true
        },
        _sum: {
          finalAmount: true
        },
        orderBy: {
          _sum: {
            finalAmount: 'desc'
          }
        },
        take: 5
      }),

      // Service fee analytics
      prisma.payment.aggregate({
        where: {
          status: 'success',
          transaction: {
            status: 'paid',
            createdAt: dateFilter,
            currency: currency
          }
        },
        _sum: {
          serviceFee: true
        }
      }),

      // Conversion funnel analytics
      prisma.transaction.groupBy({
        by: ['status'],
        where: {
          createdAt: dateFilter,
          currency: currency
        },
        _count: {
          id: true
        }
      }),

      // Monthly growth comparison
      prisma.transaction.aggregate({
        where: {
          status: 'paid',
          currency: currency,
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            lt: dateFilter.gte
          }
        },
        _sum: {
          finalAmount: true
        },
        _count: {
          id: true
        }
      }),      // Average processing time for completed transactions
      prisma.$queryRaw<Array<{ avgMinutes: number }>>`
        SELECT AVG(TIMESTAMPDIFF(MINUTE, createdAt, updatedAt)) as avgMinutes
        FROM Transaction 
        WHERE 
          status = 'paid' 
          AND currency = ${currency}
          AND createdAt >= ${dateFilter.gte}
          AND createdAt < ${dateFilter.lt}      `,

      // Addon delivery analytics
      // Total addon deliveries
      prisma.servicesAddonsCustomers.count({
        where: {
          transaction: {
            createdAt: dateFilter,
            currency: currency
          }
        }
      }),
      
      // Awaiting delivery
      prisma.servicesAddonsCustomers.count({
        where: {
          status: 'awaiting_delivery',
          transaction: {
            createdAt: dateFilter,
            currency: currency
          }
        }
      }),
      
      // In progress
      prisma.servicesAddonsCustomers.count({
        where: {
          status: 'in_progress',
          transaction: {
            createdAt: dateFilter,
            currency: currency
          }
        }
      }),
      
      // Delivered
      prisma.servicesAddonsCustomers.count({
        where: {
          status: 'delivered',
          transaction: {
            createdAt: dateFilter,
            currency: currency
          }
        }
      }),      // Average delivery time for completed deliveries
      prisma.servicesAddonsCustomers.findMany({
        where: {
          status: 'delivered',
          transaction: {
            createdAt: dateFilter,
            currency: currency
          }
        },
        select: {
          createdAt: true,
          updatedAt: true
        }
      })
    ]);    // Convert BigInt counts to numbers to avoid mathematical operation errors
    const totalTransactions = Number(totalTransactionsRaw);
    const completedTransactions = Number(completedTransactionsRaw);
    const pendingTransactions = Number(pendingTransactionsRaw);
    const failedTransactions = Number(failedTransactionsRaw);

    // Calculate addon delivery metrics
    const totalAddonDeliveriesCount = Number(totalAddonDeliveries);
    const awaitingAddonDeliveryCount = Number(awaitingAddonDelivery);
    const inProgressAddonDeliveryCount = Number(inProgressAddonDelivery);
    const deliveredAddonDeliveryCount = Number(deliveredAddonDelivery);
    
    // Calculate delivery rate
    const deliveryRate = totalAddonDeliveriesCount > 0 
      ? Math.round((deliveredAddonDeliveryCount / totalAddonDeliveriesCount) * 100)
      : 0;
    
    // Calculate average delivery time in hours
    const avgDeliveryTimeHours = addonDeliveryTimes.length > 0
      ? addonDeliveryTimes.reduce((sum, delivery) => {
          const hours = (delivery.updatedAt.getTime() - delivery.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / addonDeliveryTimes.length
      : 0;

    // 2. Payment Method Analytics
    const paymentMethodStats = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        status: 'paid',
        createdAt: dateFilter,
        transaction: {
          currency: currency
        }
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });    // 3. Daily/Hourly Revenue Trend (for charts)
    const revenueTrend = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as transactions,
        SUM(CAST(finalAmount AS DECIMAL(10,2))) as revenue
      FROM Transaction 
      WHERE 
        status = 'paid' 
        AND currency = ${currency}
        AND createdAt >= ${dateFilter.gte}
        AND createdAt < ${dateFilter.lt}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    ` as Array<{
      date: string;
      transactions: number;
      revenue: number;
    }>;

    // 4. User Growth Analytics
    const [newUsers, totalActiveUsers] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: dateFilter,
          role: 'customer'
        }
      }),
      
      prisma.user.count({
        where: {
          isActive: true,
          role: 'customer'
        }
      })    ]);

    // Convert user counts to numbers
    const newUsersCount = Number(newUsers);
    const totalActiveUsersCount = Number(totalActiveUsers);

    // 6. Voucher Usage Analytics
    const voucherStats = await prisma.voucherUsage.aggregate({
      where: {
        usedAt: dateFilter,
        transaction: {
          currency: currency
        }
      },
      _sum: {
        discountAmount: true
      },
      _count: {
        _all: true
      }
    });    // 7. Recent Transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        currency: currency
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        payment: {
          select: {
            method: true,
            status: true
          }
        },        productTransactions: {
          include: {
            package: {
              select: {
                name_en: true,
                name_id: true
              }
            }          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });    // Calculate conversion rate
    const conversionRate = totalTransactions > 0 
      ? ((completedTransactions / totalTransactions) * 100) 
      : 0;

    // Calculate average order value
    const avgOrderValue = Number(revenueData._avg.finalAmount || 0);    // Calculate growth rates
    const prevMonthRevenue = Number(monthlyGrowth._sum.finalAmount || 0);
    const currentRevenue = Number(revenueData._sum.finalAmount || 0);
    const revenueGrowthRate = prevMonthRevenue > 0 
      ? ((currentRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
      : 0;    const prevMonthTransactions = Number(monthlyGrowth._count.id || 0);
    const transactionGrowthRate = prevMonthTransactions > 0 
      ? ((completedTransactions - prevMonthTransactions) / prevMonthTransactions) * 100 
      : 0;

    // Calculate average processing time
    const avgProcessingTimeMinutes = avgProcessingTime[0]?.avgMinutes || 0;    // Calculate total service fee revenue from multiple sources
    const serviceFeeFromTransactions = Number(revenueData._sum.serviceFeeAmount || 0);
    const serviceFeeFromPayments = Number(serviceFeeAnalytics._sum.serviceFee || 0);
    const totalServiceFeeRevenue = serviceFeeFromTransactions + serviceFeeFromPayments;    // Process payment method breakdown
    const processedPaymentMethodBreakdown = paymentMethodBreakdown.map(method => ({
      method: method.method,
      count: Number(method._count.id || 0),
      revenue: Number(method._sum.amount || 0),
      percentage: completedTransactions > 0 
        ? Math.round(((Number(method._count.id || 0)) / completedTransactions) * 10000) / 100 
        : 0
    }));// Process hourly distribution for better insights
    const processedHourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourData = hourlyDistribution.find(h => h.hour === hour);
      return {
        hour,
        count: Number(hourData?.count || 0),
        percentage: completedTransactions > 0 
          ? Math.round(((Number(hourData?.count || 0)) / completedTransactions) * 10000) / 100 
          : 0
      };
    });// Get top users with names
    const topUsersWithNames = await Promise.all(
      topUsers.map(async (userStat) => {
        if (!userStat.userId) return null;
        const user = await prisma.user.findUnique({
          where: { id: userStat.userId },
          select: { name: true, email: true }
        });
        return {
          userId: userStat.userId,
          name: user?.name || user?.email || 'Unknown User',
          transactionCount: (userStat._count as any)?.id || 0,
          totalRevenue: Number((userStat._sum as any)?.finalAmount || 0)
        };
      })
    ).then(results => results.filter(Boolean));    // Process conversion funnel
    const processedConversionFunnel = conversionFunnel.map(status => ({
      status: status.status,
      count: Number(status._count.id),
      percentage: totalTransactions > 0 
        ? Math.round((Number(status._count.id) / totalTransactions) * 10000) / 100 
        : 0
    }));

    // Calculate peak hour
    const peakHour = processedHourlyDistribution.reduce((max, curr) => 
      curr.count > max.count ? curr : max, { hour: 0, count: 0 }
    );    // Process top products data
    const processedTopProducts = topProducts.map(transaction => {
      let productName = 'Unknown Product';
      let productType = 'unknown';
      
      // Handle multiple products - take the first one for display
      if (transaction.productTransactions && transaction.productTransactions.length > 0) {
        const firstProduct = transaction.productTransactions[0];
        if (firstProduct.package) {
          productName = currency === 'idr' 
            ? firstProduct.package.name_id 
            : firstProduct.package.name_en;
          productType = 'package';
        }
      }

      return {
        id: transaction.id,
        productName,
        productType,
        amount: Number(transaction.finalAmount || transaction.originalAmount || 0),
        currency: transaction.currency,
        date: transaction.createdAt
      };
    });    // Process recent transactions for display
    const processedRecentTransactions = recentTransactions.map(transaction => {
      let itemName = 'Unknown Item';
      
      // Handle multiple products - take the first one for display  
      if (transaction.productTransactions && transaction.productTransactions.length > 0) {
        const firstProduct = transaction.productTransactions[0];
        if (firstProduct.package) {
          itemName = currency === 'idr' 
            ? firstProduct.package.name_id 
            : firstProduct.package.name_en;
        }
      }

      return {
        id: transaction.id,
        customer: transaction.user?.name || transaction.user?.email || 'Unknown Customer',
        item: itemName,
        amount: Number(transaction.finalAmount || transaction.originalAmount || 0),
        status: transaction.status,
        paymentMethod: transaction.payment?.method || 'unknown',
        currency: transaction.currency,
        date: transaction.createdAt
      };
    });return withCORS(NextResponse.json({
      success: true,
      data: {
        period,
        currency,        overview: {
          totalTransactions,
          completedTransactions,
          pendingTransactions,
          failedTransactions,
          conversionRate: Math.round(conversionRate * 100) / 100,
          newUsers: newUsersCount,
          totalActiveUsers: totalActiveUsersCount,
          avgProcessingTime: Math.round(avgProcessingTimeMinutes || 0),
          revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
          transactionGrowthRate: Math.round(transactionGrowthRate * 100) / 100,
          peakHour: peakHour.hour,
          totalServiceFeeRevenue
        },
        addonDeliveries: {
          totalDeliveries: totalAddonDeliveriesCount,
          awaitingDelivery: awaitingAddonDeliveryCount,
          inProgress: inProgressAddonDeliveryCount,
          delivered: deliveredAddonDeliveryCount,
          deliveryRate: deliveryRate,
          avgDeliveryTime: Math.round(avgDeliveryTimeHours * 10) / 10
        },revenue: {
          totalRevenue: Number(revenueData._sum.finalAmount || 0),
          grossRevenue: Number(revenueData._sum.originalAmount || 0),
          serviceFeeRevenue: totalServiceFeeRevenue,
          totalDiscountGiven: Number(voucherStats._sum.discountAmount || 0),
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          formattedRevenue: formatCurrency(Number(revenueData._sum.finalAmount || 0), currency),
          prevMonthRevenue: prevMonthRevenue,
          revenueGrowth: Math.round(revenueGrowthRate * 100) / 100
        },
        paymentMethods: processedPaymentMethodBreakdown,
        trends: {
          daily: revenueTrend.map(item => ({
            date: item.date,
            transactions: Number(item.transactions),
            revenue: Number(item.revenue)
          })),
          hourly: processedHourlyDistribution
        },
        vouchers: {
          totalUsages: voucherStats._count._all || 0,
          totalDiscount: Number(voucherStats._sum.discountAmount || 0),
          formattedDiscount: formatCurrency(Number(voucherStats._sum.discountAmount || 0), currency)
        },
        categoryStats: categoryStats.map(cat => ({
          type: cat.type,
          _count: { id: cat._count.id },
          _sum: { finalAmount: cat._sum.finalAmount }
        })),
        topProducts: processedTopProducts,
        recentTransactions: processedRecentTransactions,
        topUsers: topUsersWithNames,
        conversionFunnel: processedConversionFunnel,
        analytics: {
          totalServiceFeeRevenue,
          peakTransactionHour: peakHour.hour,
          conversionRate: Math.round(conversionRate * 100) / 100,
          avgProcessingTime: Math.round(avgProcessingTimeMinutes || 0),
          hourlyDistribution: processedHourlyDistribution,
          statusDistribution: processedConversionFunnel
        }
      }
    }));

  } catch (error) {
    console.error("[DASHBOARD_ANALYTICS_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch dashboard analytics" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
