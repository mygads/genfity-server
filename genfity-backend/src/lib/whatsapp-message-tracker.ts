import { prisma } from '@/lib/prisma';

export interface MessageTrackingData {
  userId: string;
  sessionId: string;
  isSuccess: boolean; // true = berhasil kirim, false = gagal kirim
}

export class WhatsAppMessageTracker {
    /**
   * Update message counters when a message is sent or fails
   */
  static async updateMessageCounter(data: MessageTrackingData) {
    try {
      console.log('Updating message counter:', data);
      const now = new Date();
      
      // Upsert WhatsAppMessageStats record
      const result = await prisma.whatsAppMessageStats.upsert({
        where: {
          userId_sessionId: {
            userId: data.userId,
            sessionId: data.sessionId,
          },
        },
        create: {
          userId: data.userId,
          sessionId: data.sessionId,
          totalMessagesSent: data.isSuccess ? 1 : 0,
          totalMessagesFailed: data.isSuccess ? 0 : 1,
          lastMessageSentAt: data.isSuccess ? now : null,
          lastMessageFailedAt: data.isSuccess ? null : now,
        },
        update: {
          totalMessagesSent: data.isSuccess 
            ? { increment: 1 } 
            : undefined,
          totalMessagesFailed: data.isSuccess 
            ? undefined 
            : { increment: 1 },
          lastMessageSentAt: data.isSuccess ? now : undefined,
          lastMessageFailedAt: data.isSuccess ? undefined : now,
          updatedAt: now,
        },
      });

      console.log('Message counter updated successfully:', result);
      return true;
    } catch (error) {
      console.error('Error updating message counter:', error);
      throw error;
    }
  }

  /**
   * Get user's total message statistics across all sessions
   */
  static async getUserTotalStats(userId: string) {
    try {
      const stats = await prisma.whatsAppMessageStats.aggregate({
        where: { userId },
        _sum: {
          totalMessagesSent: true,
          totalMessagesFailed: true,
        },
      });

      // Get last message sent timestamp across all sessions
      const lastMessageRecord = await prisma.whatsAppMessageStats.findFirst({
        where: { 
          userId,
          lastMessageSentAt: { not: null },
        },
        orderBy: { lastMessageSentAt: 'desc' },
        select: { lastMessageSentAt: true },
      });

      // Get last failed message timestamp
      const lastFailedRecord = await prisma.whatsAppMessageStats.findFirst({
        where: { 
          userId,
          lastMessageFailedAt: { not: null },
        },
        orderBy: { lastMessageFailedAt: 'desc' },
        select: { lastMessageFailedAt: true },
      });

      const totalSent = stats._sum.totalMessagesSent || 0;
      const totalFailed = stats._sum.totalMessagesFailed || 0;
      const totalMessages = totalSent + totalFailed;

      return {
        totalMessagesSent: totalSent,
        totalMessagesFailed: totalFailed,
        totalMessages,
        successRate: totalMessages > 0 
          ? ((totalSent / totalMessages) * 100).toFixed(2)
          : '0.00',
        lastMessageSentAt: lastMessageRecord?.lastMessageSentAt,
        lastMessageFailedAt: lastFailedRecord?.lastMessageFailedAt,
      };
    } catch (error) {
      console.error('Error getting user total stats:', error);
      throw error;
    }
  }

  /**
   * Get session-specific message statistics
   */
  static async getSessionStats(sessionId: string) {
    try {
      const stats = await prisma.whatsAppMessageStats.findUnique({
        where: {
          userId_sessionId: {
            userId: '', // Will be updated in actual usage
            sessionId,
          },
        },
      });

      if (!stats) {
        return {
          totalMessagesSent: 0,
          totalMessagesFailed: 0,
          totalMessages: 0,
          successRate: '0.00',
          lastMessageSentAt: null,
          lastMessageFailedAt: null,
        };
      }

      const totalMessages = stats.totalMessagesSent + stats.totalMessagesFailed;

      return {
        totalMessagesSent: stats.totalMessagesSent,
        totalMessagesFailed: stats.totalMessagesFailed,
        totalMessages,
        successRate: totalMessages > 0 
          ? ((stats.totalMessagesSent / totalMessages) * 100).toFixed(2)
          : '0.00',
        lastMessageSentAt: stats.lastMessageSentAt,
        lastMessageFailedAt: stats.lastMessageFailedAt,
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      throw error;
    }
  }

  /**
   * Get session statistics with userId
   */
  static async getSessionStatsWithUserId(userId: string, sessionId: string) {
    try {
      const stats = await prisma.whatsAppMessageStats.findUnique({
        where: {
          userId_sessionId: {
            userId,
            sessionId,
          },
        },
      });

      if (!stats) {
        return {
          totalMessagesSent: 0,
          totalMessagesFailed: 0,
          totalMessages: 0,
          successRate: '0.00',
          lastMessageSentAt: null,
          lastMessageFailedAt: null,
        };
      }

      const totalMessages = stats.totalMessagesSent + stats.totalMessagesFailed;

      return {
        totalMessagesSent: stats.totalMessagesSent,
        totalMessagesFailed: stats.totalMessagesFailed,
        totalMessages,
        successRate: totalMessages > 0 
          ? ((stats.totalMessagesSent / totalMessages) * 100).toFixed(2)
          : '0.00',
        lastMessageSentAt: stats.lastMessageSentAt,
        lastMessageFailedAt: stats.lastMessageFailedAt,
      };
    } catch (error) {
      console.error('Error getting session stats with userId:', error);
      throw error;
    }
  }

  /**
   * Get all user's sessions with their message statistics
   */
  static async getUserSessionsStats(userId: string) {
    try {
      const sessionsStats = await prisma.whatsAppMessageStats.findMany({
        where: { userId },
        include: {
          session: {
            select: {
              sessionId: true,
              sessionName: true,
              status: true,
              isTerminated: true,
              createdAt: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return sessionsStats.map(stats => {
        const totalMessages = stats.totalMessagesSent + stats.totalMessagesFailed;
        return {
          sessionId: stats.sessionId,
          sessionName: stats.session.sessionName,
          sessionStatus: stats.session.status,
          isTerminated: stats.session.isTerminated,
          sessionCreatedAt: stats.session.createdAt,
          totalMessagesSent: stats.totalMessagesSent,
          totalMessagesFailed: stats.totalMessagesFailed,
          totalMessages,
          successRate: totalMessages > 0 
            ? ((stats.totalMessagesSent / totalMessages) * 100).toFixed(2)
            : '0.00',
          lastMessageSentAt: stats.lastMessageSentAt,
          lastMessageFailedAt: stats.lastMessageFailedAt,
          lastActivity: stats.updatedAt,
        };
      });
    } catch (error) {
      console.error('Error getting user sessions stats:', error);
      throw error;
    }
  }

  /**
   * Reset session message counters (when session is reset/deleted)
   */
  static async resetSessionCounters(userId: string, sessionId: string) {
    try {
      await prisma.whatsAppMessageStats.upsert({
        where: {
          userId_sessionId: {
            userId,
            sessionId,
          },
        },
        create: {
          userId,
          sessionId,
          totalMessagesSent: 0,
          totalMessagesFailed: 0,
          lastMessageSentAt: null,
          lastMessageFailedAt: null,
        },
        update: {
          totalMessagesSent: 0,
          totalMessagesFailed: 0,
          lastMessageSentAt: null,
          lastMessageFailedAt: null,
          updatedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error resetting session counters:', error);
      throw error;
    }
  }

  /**
   * Get analytics data for admin dashboard
   */
  static async getAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  } = {}) {
    try {
      const { startDate, endDate, userId } = options;
      
      const where: any = {};
      if (startDate || endDate) {
        where.updatedAt = {};
        if (startDate) where.updatedAt.gte = startDate;
        if (endDate) where.updatedAt.lte = endDate;
      }
      if (userId) where.userId = userId;

      // Total messages across all users/sessions
      const totalStats = await prisma.whatsAppMessageStats.aggregate({
        where,
        _sum: {
          totalMessagesSent: true,
          totalMessagesFailed: true,
        },
      });

      // Top users by message count
      const topUsers = await prisma.whatsAppMessageStats.groupBy({
        by: ['userId'],
        where,
        _sum: {
          totalMessagesSent: true,
          totalMessagesFailed: true,
        },
        orderBy: {
          _sum: {
            totalMessagesSent: 'desc',
          },
        },
        take: 10,
      });

      // Get user details for top users
      const topUsersWithDetails = await Promise.all(
        topUsers.map(async (userStat) => {
          const user = await prisma.user.findUnique({
            where: { id: userStat.userId },
            select: { id: true, name: true, email: true },
          });
          return {
            user,
            totalMessagesSent: userStat._sum.totalMessagesSent || 0,
            totalMessagesFailed: userStat._sum.totalMessagesFailed || 0,
            totalMessages: (userStat._sum.totalMessagesSent || 0) + (userStat._sum.totalMessagesFailed || 0),
          };
        })
      );

      // Active sessions count
      const activeSessions = await prisma.whatsAppSession.count({
        where: {
          status: 'connected',
          isTerminated: false,
        },
      });

      return {
        totalMessagesSent: totalStats._sum.totalMessagesSent || 0,
        totalMessagesFailed: totalStats._sum.totalMessagesFailed || 0,
        totalMessages: (totalStats._sum.totalMessagesSent || 0) + (totalStats._sum.totalMessagesFailed || 0),
        topUsers: topUsersWithDetails,
        activeSessions,
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Get daily message statistics for charts
   */
  static async getDailyStats(userId?: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where: any = {
        updatedAt: { gte: startDate },
      };
      if (userId) where.userId = userId;

      // For daily stats, we need to group by date
      // Since we don't store individual messages, we'll get the cumulative data
      const stats = await prisma.whatsAppMessageStats.findMany({
        where,
        select: {
          updatedAt: true,
          totalMessagesSent: true,
          totalMessagesFailed: true,
        },
        orderBy: { updatedAt: 'asc' },
      });

      // Group by date and sum the messages
      const dailyStats = stats.reduce((acc, stat) => {
        const date = stat.updatedAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            totalMessagesSent: 0,
            totalMessagesFailed: 0,
          };
        }
        acc[date].totalMessagesSent += stat.totalMessagesSent;
        acc[date].totalMessagesFailed += stat.totalMessagesFailed;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(dailyStats);
    } catch (error) {
      console.error('Error getting daily stats:', error);
      throw error;
    }
  }
}

export default WhatsAppMessageTracker;
