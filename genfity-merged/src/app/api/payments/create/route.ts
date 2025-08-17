import { NextRequest, NextResponse } from 'next/server';
import { PaymentExpirationService } from '@/lib/payment-expiration';
import { TransactionStatusManager } from '@/lib/transaction-status-manager';
import { verifyUserToken } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserToken(req);
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { transactionId, paymentMethod, amount, serviceFee, externalId, paymentUrl } = body;

    // Check if transaction is still valid for payment creation
    const canCreatePayment = await PaymentExpirationService.canCreatePaymentForTransaction(transactionId);
    
    if (!canCreatePayment) {
      return NextResponse.json({ 
        error: 'Cannot create payment for this transaction. Transaction may be expired, cancelled, or already paid.' 
      }, { status: 400 });
    }

    // Create payment with automatic expiration (1 day)
    const payment = await PaymentExpirationService.createPaymentWithExpiration({
      transactionId,
      amount,
      method: paymentMethod,
      serviceFee,
      externalId,
      paymentUrl
    });

    // Update transaction status to 'pending' when payment is created
    await TransactionStatusManager.updateTransactionOnPaymentCreation(transactionId);

    return NextResponse.json({
      success: true,
      message: 'Payment created successfully',
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        method: payment.method,
        expiresAt: payment.expiresAt,
        paymentUrl: payment.paymentUrl
      }
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
