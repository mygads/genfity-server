import { NextRequest, NextResponse } from 'next/server';
import { getCustomerAuth } from '@/lib/auth-helpers';
import { getWhatsAppSubscriptionStatus } from '@/lib/whatsapp-subscription';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import { prisma } from '@/lib/prisma';

// GET /api/customer/whatsapp/subscription - Get user's WhatsApp subscription details
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const customerAuth = await getCustomerAuth(request);
    if (!customerAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ));
    }

    const userId = customerAuth.id;

    // Get subscription status
    const subscriptionStatus = await getWhatsAppSubscriptionStatus(userId);

    if (!subscriptionStatus.hasActiveSubscription) {
      return withCORS(NextResponse.json({
        success: true,
        data: {
          hasActiveSubscription: false,
          packageName: null,
          maxSessions: 0,
          currentSessions: 0,
          canCreateMoreSessions: false,
          startDate: null,
          endDate: null,
          status: 'inactive'
        },
        message: 'No active WhatsApp subscription found'
      }));
    }

    // Get detailed subscription info from both systems
    const [oldSystemSub, newSystemSub] = await Promise.all([
      // Check old system (ServicesWhatsappCustomers)
      prisma.servicesWhatsappCustomers.findFirst({
        where: {
          customerId: userId,
          status: "active",
          expiredAt: {
            gt: new Date()
          }
        },
        include: {
          package: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Check new system (TransactionWhatsappService)
      prisma.transactionWhatsappService.findFirst({
        where: {
          transaction: {
            userId: userId,
            status: "paid"
          },
          endDate: {
            gt: new Date()
          }
        },
        include: {
          whatsappPackage: true,
          transaction: true
        },
        orderBy: {
          startDate: 'desc'
        }
      })
    ]);

    let subscriptionData;

    if (oldSystemSub) {
      subscriptionData = {
        hasActiveSubscription: true,
        packageName: oldSystemSub.package?.name || 'WhatsApp Package',
        maxSessions: oldSystemSub.package?.maxSession || 1,
        currentSessions: subscriptionStatus.currentSessions,
        canCreateMoreSessions: subscriptionStatus.canCreateMoreSessions,
        startDate: oldSystemSub.createdAt,
        endDate: oldSystemSub.expiredAt,
        status: oldSystemSub.status,
        system: 'legacy',
        subscriptionId: oldSystemSub.id,
        packageId: oldSystemSub.package?.id,
        price: oldSystemSub.package?.priceMonth || null
      };
    } else if (newSystemSub) {
      subscriptionData = {
        hasActiveSubscription: true,
        packageName: newSystemSub.whatsappPackage.name,
        maxSessions: newSystemSub.whatsappPackage.maxSession,
        currentSessions: subscriptionStatus.currentSessions,
        canCreateMoreSessions: subscriptionStatus.canCreateMoreSessions,
        startDate: newSystemSub.startDate,
        endDate: newSystemSub.endDate,
        status: 'active',
        system: 'new',
        subscriptionId: newSystemSub.id,
        packageId: newSystemSub.whatsappPackageId,
        price: newSystemSub.whatsappPackage.priceMonth,
        transactionId: newSystemSub.transactionId
      };
    } else {
      subscriptionData = {
        hasActiveSubscription: false,
        packageName: null,
        maxSessions: 0,
        currentSessions: subscriptionStatus.currentSessions,
        canCreateMoreSessions: false,
        startDate: null,
        endDate: null,
        status: 'inactive'
      };
    }

    return withCORS(NextResponse.json({
      success: true,
      data: subscriptionData,
      message: 'WhatsApp subscription details retrieved successfully'
    }));

  } catch (error) {
    console.error('Error getting WhatsApp subscription:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    ));
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return corsOptionsResponse();
}
