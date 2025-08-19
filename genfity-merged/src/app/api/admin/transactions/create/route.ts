import { NextRequest, NextResponse } from 'next/server';
import { PaymentExpirationService } from '@/lib/payment-expiration';
import { verifyUserToken } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const userVerification = await verifyUserToken(req);
    
    if (!userVerification.success) {
      return NextResponse.json({ error: userVerification.error }, { status: 401 });
    }

    const userId = userVerification.userId;

    const body = await req.json();
    const { 
      amount, 
      type, 
      currency = 'idr', 
      voucherId, 
      notes, 
      discountAmount,
      originalAmount,
      finalAmount,
      serviceFeeAmount,
      totalAfterDiscount 
    } = body;

    if (!amount || !type) {
      return NextResponse.json({ 
        error: 'Amount and type are required' 
      }, { status: 400 });
    }

    // Create transaction with automatic expiration (1 week)
    const transaction = await PaymentExpirationService.createTransactionWithExpiration({
      userId: userId,
      amount,
      type,
      currency,
      voucherId,
      notes,
      discountAmount,
      originalAmount,
      finalAmount,
      serviceFeeAmount,
      totalAfterDiscount
    });

    return NextResponse.json({
      success: true,
      message: 'Transaction created successfully',
      transaction: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        type: transaction.type,
        currency: transaction.currency,
        expiresAt: transaction.expiresAt,
        createdAt: transaction.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
