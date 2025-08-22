import { NextRequest, NextResponse } from 'next/server';
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { withRoleAuthentication } from "@/lib/request-auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/whatsapp/analytics - Get WhatsApp analytics for admin
export async function GET(req: NextRequest) {
  return withRoleAuthentication(req, ['admin'], async (user) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const days = parseInt(url.searchParams.get('days') || '30');

    try {
      // Calculate totals
      const totalMessageStats = await prisma.whatsAppMessageStats.count();
      const totalSessions = await prisma.whatsAppSession.count();
      const totalUsers = await prisma.user.count();

      // Get total messages sent across all users
      const totalMessagesSent = await prisma.whatsAppMessageStats.aggregate({
        _sum: {
          totalMessagesSent: true
        }
      });

      // Get total messages failed across all users
      const totalMessagesFailed = await prisma.whatsAppMessageStats.aggregate({
        _sum: {
          totalMessagesFailed: true
        }
      });

      // Get top users by message count
      const topUsersStats = await prisma.whatsAppMessageStats.groupBy({
        by: ['userId'],
        _sum: {
          totalMessagesSent: true,
          totalMessagesFailed: true
        },
        orderBy: {
          _sum: {
            totalMessagesSent: 'desc'
          }
        },
        take: 10
      });

      // Get user details for top users
      const userIds = topUsersStats.map(u => u.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, phone: true }
      });

      const topUsersWithDetails = topUsersStats.map(stat => {
        const userDetail = users.find(u => u.id === stat.userId);
        return {
          userId: stat.userId,
          totalSent: stat._sum.totalMessagesSent || 0,
          totalFailed: stat._sum.totalMessagesFailed || 0,
          user: userDetail
        };
      });

      // Get session statistics
      const sessionStats = await prisma.whatsAppSession.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = await prisma.whatsAppMessageStats.findMany({
        where: {
          lastMessageSentAt: {
            gte: thirtyDaysAgo
          }
        },
        select: {
          userId: true,
          totalMessagesSent: true,
          totalMessagesFailed: true,
          lastMessageSentAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          lastMessageSentAt: 'desc'
        },
        take: 20
      });

      const result = {
        totalUsers,
        totalSessions,
        totalMessageStats,
        totalMessagesSent: totalMessagesSent._sum.totalMessagesSent || 0,
        totalMessagesFailed: totalMessagesFailed._sum.totalMessagesFailed || 0,
        sessionStats: sessionStats.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        topUsers: topUsersWithDetails,
        recentActivity
      };

      return withCORS(NextResponse.json({
        success: true,
        data: result
      }));

    } catch (error) {
      console.error('Error fetching WhatsApp analytics:', error);
      return withCORS(NextResponse.json({
        success: false,
        error: 'Failed to fetch analytics'
      }, { status: 500 }));
    }
  });
}

export async function OPTIONS(req: NextRequest) {
  return corsOptionsResponse();
}
