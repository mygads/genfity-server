import { NextRequest, NextResponse } from 'next/server';
import { PaymentExpirationService } from '@/lib/payment-expiration';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      userId: session.user.id,
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
