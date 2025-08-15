import { prisma } from "@/lib/prisma";

/**
 * Check if a user has an active WhatsApp subscription
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user has active subscription, false otherwise
 */
export async function hasActiveWhatsAppSubscription(userId: string): Promise<boolean> {
  try {
    // Check old system (ServicesWhatsappCustomers) first since it's the primary active system
    const oldSystemSubscription = await prisma.servicesWhatsappCustomers.findFirst({
      where: {
        customerId: userId,
        status: "active",
        expiredAt: {
          gt: new Date() // End date is in the future
        }
      }
    });

    if (oldSystemSubscription) {
      return true;
    }

    // Check new system (TransactionWhatsappService)
    const newSystemSubscription = await prisma.transactionWhatsappService.findFirst({
      where: {
        transaction: {
          userId: userId,
          status: "paid"
        },
        status: "success",
        endDate: {
          gt: new Date() // End date is in the future
        }
      }
    });

    if (newSystemSubscription) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('[WHATSAPP_SUBSCRIPTION] Error checking subscription:', error);
    return false;
  }
}

/**
 * Get user's active WhatsApp subscription details
 * @param userId - The user ID to check
 * @returns Promise<object | null> - Subscription details or null if no active subscription
 */
export async function getActiveWhatsAppSubscription(userId: string) {
  try {
    // Check new system first (TransactionWhatsappService)
    const newSystemSubscription = await prisma.transactionWhatsappService.findFirst({
      where: {
        transaction: {
          userId: userId,
          status: "paid"
        },
        status: "success",
        endDate: {
          gt: new Date() // End date is in the future
        }
      },
      include: {
        whatsappPackage: true,
        transaction: true
      },
      orderBy: {
        endDate: 'desc' // Get the latest subscription
      }
    });

    if (newSystemSubscription) {
      return newSystemSubscription;
    }

    // Check old system (ServicesWhatsappCustomers)
    const oldSystemSubscription = await prisma.servicesWhatsappCustomers.findFirst({
      where: {
        customerId: userId,
        status: "active",
        expiredAt: {
          gt: new Date() // End date is in the future
        }
      },
      include: {
        package: true,
        transaction: true
      },
      orderBy: {
        expiredAt: 'desc' // Get the latest subscription
      }
    });

    return oldSystemSubscription;
  } catch (error) {
    console.error('[WHATSAPP_SUBSCRIPTION] Error getting subscription:', error);
    return null;
  }
}

/**
 * Get user's WhatsApp subscription status and limits
 * @param userId - The user ID to check
 * @returns Promise<object> - Subscription status and session limits
 */
export async function getWhatsAppSubscriptionStatus(userId: string) {
  try {
    const subscription = await getActiveWhatsAppSubscription(userId);
    
    if (!subscription) {
      return {
        hasActiveSubscription: false,
        maxSessions: 0,
        packageName: null,
        endDate: null
      };
    }

    // Count current sessions
    const currentSessions = await prisma.whatsAppSession.count({
      where: { userId }
    });

    // Handle both systems
    let maxSessions: number;
    let packageName: string;
    let endDate: Date | null;

    if ('whatsappPackage' in subscription) {
      // New system
      maxSessions = subscription.whatsappPackage.maxSession;
      packageName = subscription.whatsappPackage.name;
      endDate = subscription.endDate;
    } else {
      // Old system
      maxSessions = subscription.package.maxSession;
      packageName = subscription.package.name;
      endDate = subscription.expiredAt;
    }

    return {
      hasActiveSubscription: true,
      maxSessions,
      currentSessions,
      packageName,
      endDate,
      canCreateMoreSessions: currentSessions < maxSessions
    };
  } catch (error) {
    console.error('[WHATSAPP_SUBSCRIPTION] Error getting subscription status:', error);
    return {
      hasActiveSubscription: false,
      maxSessions: 0,
      packageName: null,
      endDate: null
    };
  }
}
