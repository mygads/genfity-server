import { NextRequest, NextResponse } from 'next/server';
import { PaymentExpirationService } from '@/lib/payment-expiration';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (you can adjust this based on your auth system)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }    const { paymentId } = await params;
    const body = await req.json();
    const { status, adminNotes } = body;

    // Auto-expire this specific payment before updating status
    await PaymentExpirationService.autoExpireOnApiCall(undefined, paymentId);

    // Validate status
    const validStatuses = ['pending', 'paid', 'failed', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    // Update payment status
    const updatedPayment = await PaymentExpirationService.updatePaymentStatus(
      paymentId,
      status,
      adminNotes,
      session.user.id
    );    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        paymentDate: updatedPayment.paymentDate,
        adminNotes: updatedPayment.adminNotes,
        actionDate: updatedPayment.actionDate,
        expiresAt: updatedPayment.expiresAt,
        updatedAt: updatedPayment.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    
    if (error instanceof Error && error.message === 'Payment not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
