import { NextRequest, NextResponse } from 'next/server';
import { PaymentExpirationService } from '@/lib/payment-expiration';
import { verifyUserToken } from '@/lib/auth-helpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const userVerification = await verifyUserToken(req);
    
    if (!userVerification.success) {
      return NextResponse.json({ error: userVerification.error }, { status: 401 });
    }

    const userId = userVerification.userId;    const { transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Auto-expire this specific transaction before cancelling
    await PaymentExpirationService.autoExpireOnApiCall(transactionId);

    // Cancel transaction by user
    const cancelledTransaction = await PaymentExpirationService.cancelTransactionByUser(
      transactionId,
      userId
    );    return NextResponse.json({
      success: true,
      message: 'Transaction cancelled successfully',
      transaction: {
        id: cancelledTransaction.id,
        status: 'cancelled',
        updatedAt: new Date(),
        expiresAt: cancelledTransaction.expiresAt,
        originalExpiresAt: cancelledTransaction.expiresAt // Keep original expiration date for reference
      }
    });

  } catch (error) {
    console.error('Error cancelling transaction:', error);
    
    if (error instanceof Error && error.message === 'Transaction not found or unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
