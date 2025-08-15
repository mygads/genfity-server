import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

// Function to activate WhatsApp service after successful payment
async function activateWhatsAppService(transaction: any) {
  if (transaction.type !== 'whatsapp_service' || !transaction.whatsappTransaction?.whatsappPackageId) {
    return { success: false, reason: 'Not a WhatsApp service transaction' };
  }

  // Check if this WhatsApp transaction has already been success
  if (transaction.whatsappTransaction.status === 'success') {
    console.log(`[CRON_ACTIVATION] Transaction ${transaction.id} already success, skipping`);
    return { success: true, reason: 'Already Success' };
  }

  const duration = transaction.whatsappTransaction.duration;
  const packageId = transaction.whatsappTransaction.whatsappPackageId;
  const userId = transaction.userId;

  try {// Check if user already has an active subscription for this package
    const existingService = await prisma.servicesWhatsappCustomers.findFirst({
      where: {
        customerId: userId,
        packageId: packageId,
      },
      include: {
        package: true,
      },
    });

    const now = new Date();
    let newExpiredAt: Date;

    if (existingService && existingService.expiredAt > now) {
      // User has an active subscription - extend from current expiry date
      console.log(`[CRON_ACTIVATION] User ${userId} has active subscription until ${existingService.expiredAt}, extending duration`);
      
      newExpiredAt = new Date(existingService.expiredAt);
      if (duration === 'year') {
        newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
      } else {
        newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
      }      // Update existing service
      await prisma.servicesWhatsappCustomers.update({
        where: { id: existingService.id },
        data: { expiredAt: newExpiredAt },
      });

      console.log(`[CRON_ACTIVATION] Extended subscription for user ${userId} until ${newExpiredAt}`);
    } else {
      // No active subscription or expired - create new or update with new expiry
      newExpiredAt = new Date();
      if (duration === 'year') {
        newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
      } else {
        newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
      }      if (existingService) {
        // Update expired service
        await prisma.servicesWhatsappCustomers.update({
          where: { id: existingService.id },
          data: { expiredAt: newExpiredAt },
        });
        console.log(`[CRON_ACTIVATION] Renewed expired subscription for user ${userId} until ${newExpiredAt}`);
      } else {
        // Create new service
        await prisma.servicesWhatsappCustomers.create({
          data: {
            customerId: userId,
            transactionId: transaction.id,
            packageId: packageId,
            expiredAt: newExpiredAt,
            status: 'active',
          },
        });
        console.log(`[CRON_ACTIVATION] Created new subscription for user ${userId} until ${newExpiredAt}`);      }
    }

    // Mark WhatsApp transaction as success
    await prisma.transactionWhatsappService.update({
      where: { id: transaction.whatsappTransaction.id },
      data: { 
        status: 'success',
        startDate: now,
        endDate: newExpiredAt,
      },
    });

    console.log(`[CRON_ACTIVATION] Marked transaction ${transaction.id} as success`);

    // Get package details for logging
    const packageDetails = existingService?.package || await prisma.whatsappApiPackage.findUnique({
      where: { id: packageId },
    });

    if (packageDetails) {
      console.log(`[CRON_ACTIVATION] User ${userId} now has access to WhatsApp API with max ${packageDetails.maxSession} sessions until ${newExpiredAt}`);
    }

    return { 
      success: true, 
      userId, 
      packageId, 
      expiredAt: newExpiredAt,
      action: existingService && existingService.expiredAt > now ? 'extended' : 
              existingService ? 'renewed' : 'created'    };
  } catch (error) {
    console.error(`[CRON_ACTIVATION_ERROR] Failed to activate service for user ${userId}:`, error);
    
    // Mark WhatsApp transaction as failed
    try {
      await prisma.transactionWhatsappService.update({
        where: { id: transaction.whatsappTransaction.id },
        data: { status: 'failed' },
      });
    } catch (updateError) {
      console.error('[CRON_ACTIVATION] Failed to mark transaction as failed:', updateError);
    }
    
    return { success: false, reason: 'Database error', error: error instanceof Error ? error.message : String(error) };
  }
}

// POST /api/cron/activate-subscriptions - Cron job to activate pending WhatsApp subscriptions
export async function POST(request: Request) {
  try {
    // Simple API key authentication for cron jobs
    const authHeader = request.headers.get('authorization');
    const cronApiKey = process.env.CRON_API_KEY || 'default-cron-key';
    
    if (!authHeader || authHeader !== `Bearer ${cronApiKey}`) {
      return withCORS(NextResponse.json(
        { success: false, error: "Unauthorized. Valid cron API key required." },
        { status: 401 }
      ));
    }

    const startTime = Date.now();
    console.log('[CRON_ACTIVATION] Starting subscription activation job...');

    // Find all paid WhatsApp transactions that don't have active subscriptions
    const paidTransactions = await prisma.transaction.findMany({
      where: {
        type: 'whatsapp_service',
        status: 'paid',
        whatsappTransaction: {
          isNot: null,
        },
      },
      include: {
        whatsappTransaction: {
          include: {
            whatsappPackage: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    console.log(`[CRON_ACTIVATION] Found ${paidTransactions.length} paid WhatsApp transactions`);

    let activatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const transaction of paidTransactions) {
      try {        // Check if user already has an active subscription for this package
        const existingActiveService = await prisma.servicesWhatsappCustomers.findFirst({
          where: {
            customerId: transaction.userId,
            packageId: transaction.whatsappTransaction!.whatsappPackageId,
            expiredAt: {
              gt: new Date(),
            },
          },
        });

        // Skip if user already has active subscription from a more recent transaction
        if (existingActiveService) {
          // Check if there's a more recent paid transaction for the same package
          const moreRecentTransaction = await prisma.transaction.findFirst({
            where: {
              userId: transaction.userId,
              type: 'whatsapp_service',
              status: 'paid',
              updatedAt: {
                gt: transaction.updatedAt,
              },
              whatsappTransaction: {
                whatsappPackageId: transaction.whatsappTransaction!.whatsappPackageId,
              },
            },
          });

          if (moreRecentTransaction) {
            console.log(`[CRON_ACTIVATION] Skipping transaction ${transaction.id} - user has more recent paid transaction`);
            skippedCount++;
            continue;
          }
        }

        // Activate the service
        const activationResult = await activateWhatsAppService(transaction);
        
        if (activationResult.success) {
          activatedCount++;
          console.log(`[CRON_ACTIVATION] ✓ Activated subscription for user ${transaction.user.email} (${transaction.userId})`);
        } else {
          console.log(`[CRON_ACTIVATION] ⚠ Skipped transaction ${transaction.id}: ${activationResult.reason}`);
          skippedCount++;
        }

        results.push({
          transactionId: transaction.id,
          userId: transaction.userId,
          userEmail: transaction.user.email,
          packageName: transaction.whatsappTransaction?.whatsappPackage?.name,
          result: activationResult,
        });      } catch (error) {
        errorCount++;
        console.error(`[CRON_ACTIVATION] Error processing transaction ${transaction.id}:`, error);
        results.push({
          transactionId: transaction.id,
          userId: transaction.userId,
          userEmail: transaction.user.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const summary = {
      success: true,
      summary: {
        totalTransactions: paidTransactions.length,
        activated: activatedCount,
        skipped: skippedCount,
        errors: errorCount,
        duration: `${duration}ms`,
      },
      results: results.slice(0, 50), // Limit results to prevent large responses
    };

    console.log(`[CRON_ACTIVATION] Job completed in ${duration}ms:`, {
      total: paidTransactions.length,
      activated: activatedCount,
      skipped: skippedCount,
      errors: errorCount,
    });

    return withCORS(NextResponse.json(summary));
  } catch (error) {
    console.error('[CRON_ACTIVATION] Job failed:', error);
    return withCORS(NextResponse.json(
      { 
        success: false, 
        error: "Failed to process subscription activations",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    ));
  }
}

// GET /api/cron/activate-subscriptions - Get cron job status and recent results
export async function GET(request: Request) {
  try {
    // Simple API key authentication for cron jobs
    const authHeader = request.headers.get('authorization');
    const cronApiKey = process.env.CRON_API_KEY || 'default-cron-key';
    
    if (!authHeader || authHeader !== `Bearer ${cronApiKey}`) {
      return withCORS(NextResponse.json(
        { success: false, error: "Unauthorized. Valid cron API key required." },
        { status: 401 }
      ));
    }

    // Get statistics about pending activations
    const stats = await Promise.all([
      // Count paid transactions without active subscriptions
      prisma.transaction.count({
        where: {
          type: 'whatsapp_service',
          status: 'paid',
        },
      }),      // Count active WhatsApp services
      prisma.servicesWhatsappCustomers.count({
        where: {
          expiredAt: {
            gt: new Date(),
          },
        },
      }),
      // Count recent activations (last 24 hours)
      prisma.servicesWhatsappCustomers.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return withCORS(NextResponse.json({
      success: true,
      stats: {
        totalPaidTransactions: stats[0],
        activeSubscriptions: stats[1],
        recentActivations24h: stats[2],
        lastCheck: new Date().toISOString(),
      },
      cronInfo: {
        recommendedInterval: '5 minutes',
        endpoint: '/api/cron/activate-subscriptions',
        method: 'POST',
        authRequired: 'Bearer token in Authorization header',
      },
    }));

  } catch (error) {
    console.error('[CRON_ACTIVATION_STATUS]', error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to get cron status" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
