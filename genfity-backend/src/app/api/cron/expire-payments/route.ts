import { NextRequest, NextResponse } from 'next/server';
import { PaymentExpirationService } from '@/lib/payment-expiration';

// This endpoint should be called by a cron job every hour or few hours  
// It processes BOTH expired payments AND expired transactions
export async function POST(req: NextRequest) {
  try {
    // Verify cron job authorization (you can add your own auth method)
    const cronSecret = req.headers.get('authorization');
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting payment and transaction expiration cron job...');    // Process both expired payments and transactions
    const [expiredPayments, expiredTransactions] = await Promise.all([
      PaymentExpirationService.processExpiredPayments(),
      PaymentExpirationService.processExpiredTransactions()
    ]);

    console.log(`Successfully expired ${expiredPayments.length} payments and ${expiredTransactions.length} transactions`);

    return NextResponse.json({
      success: true,
      message: `Expired ${expiredPayments.length} payments and ${expiredTransactions.length} transactions`,
      processedAt: new Date(),
      summary: {
        totalProcessed: expiredPayments.length + expiredTransactions.length,
        expiredPaymentsCount: expiredPayments.length,
        expiredTransactionsCount: expiredTransactions.length
      },
      expiredPayments: expiredPayments.map(p => ({
        id: p.id,
        transactionId: p.transactionId,
        amount: p.amount,
        method: p.method,
        originalExpiresAt: p.expiresAt,
        expiredAt: new Date(),
        status: 'expired'
      })),
      expiredTransactions: expiredTransactions.map(t => ({
        id: t.id,
        userId: t.userId,
        amount: t.amount,
        type: t.type,
        originalExpiresAt: t.expiresAt,
        expiredAt: new Date(),
        status: 'expired'
      }))
    });

  } catch (error) {
    console.error('Error in expire-payments cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also allow GET for testing purposes
export async function GET(req: NextRequest) {
  return POST(req);
}
