import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerAuth } from '@/lib/auth-helpers';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import { PaymentExpirationService } from '@/lib/payment-expiration';

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get('origin') || undefined);
}

// Helper function to create CORS-enabled JSON responses
function createCorsResponse(data: any, options: { status?: number } = {}, request: NextRequest) {
    const response = NextResponse.json(data, options);
    return withCORS(response, request.headers.get('origin') || undefined);
}

// POST /api/customer/payment/cancel/[paymentId] - Cancel a pending payment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ paymentId: string }> }
) {
    try {
        // Check authentication
        const userAuth = await getCustomerAuth(request);
        if (!userAuth?.id) {
            return createCorsResponse(
                { success: false, error: "Authentication required" },
                { status: 401 },
                request
            );
        }

        const { paymentId } = await params;

        // Auto-expire any expired payments/transactions first
        await PaymentExpirationService.autoExpireOnApiCall(undefined, paymentId);

        // Get payment with transaction details to verify ownership and current status
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                transaction: {
                    userId: userAuth.id, // Ensure user owns this payment
                }
            },            include: {
                transaction: {
                    select: {
                        id: true,
                        status: true,
                        type: true,
                        currency: true,
                        amount: true,
                        userId: true,
                        expiresAt: true,
                    }
                }
            }
        });

        if (!payment) {
            return createCorsResponse(
                { success: false, error: "Payment not found or you don't have permission to cancel it" },
                { status: 404 },
                request
            );        }

        // Check if payment is now expired after auto-expire check
        if (payment.status === 'expired') {
            return createCorsResponse(
                { 
                    success: false, 
                    error: "Payment has expired and cannot be cancelled",
                    currentStatus: 'expired'
                },
                { status: 400 },
                request
            );
        }

        // Check if payment can be cancelled
        if (payment.status !== 'pending') {
            return createCorsResponse(
                { 
                    success: false, 
                    error: `Payment cannot be cancelled. Current status: ${payment.status}`,
                    currentStatus: payment.status
                },
                { status: 400 },
                request
            );
        }

        // Check if payment is too recent (prevent immediate cancellation spam)
        const createdTime = new Date(payment.createdAt).getTime();
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - createdTime;
        const minimumWaitTime = 1 * 10 * 1000; // 10 seconds

        if (timeDifference < minimumWaitTime) {
            return createCorsResponse(
                { 
                    success: false, 
                    error: "Please wait at least 10 seconds before cancelling a payment",
                    waitTimeRemaining: Math.ceil((minimumWaitTime - timeDifference) / 1000)
                },
                { status: 400 },
                request
            );
        }

        // Parse request body for cancellation reason (optional)
        let cancellationReason = 'Cancelled by customer';
        try {
            const body = await request.json();
            if (body.reason && typeof body.reason === 'string' && body.reason.trim().length > 0) {
                cancellationReason = body.reason.trim();
            }
        } catch (error) {
            // Body parsing failed or no body provided, use default reason
        }        // Perform the cancellation in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update payment status to cancelled
            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: { 
                    status: 'cancelled',
                    updatedAt: new Date(),
                }
            });

            // DO NOT update transaction status when cancelling payment
            // Customer should still be able to create new payments for the same transaction
            // Transaction will only be cancelled if customer explicitly cancels the transaction
            
            // Log the cancellation (using console log since paymentLog table doesn't exist)
            console.log(`[PAYMENT_CANCELLED] Payment ${paymentId} cancelled by user ${userAuth.id}`, {
                paymentId: paymentId,
                transactionId: payment.transactionId,
                userId: userAuth.id,
                reason: cancellationReason,
                cancelledAt: new Date(),
                note: "Transaction remains active - customer can create new payments"
            });

            return { updatedPayment };
        });        // Prepare response data
        const response = {
            success: true,
            message: "Payment cancelled successfully. Transaction remains active for new payments.",
            data: {
                payment: {
                    id: result.updatedPayment.id,
                    transactionId: result.updatedPayment.transactionId,
                    status: result.updatedPayment.status,
                    amount: result.updatedPayment.amount,
                    method: result.updatedPayment.method,
                    updatedAt: result.updatedPayment.updatedAt,
                    expiresAt: result.updatedPayment.expiresAt,
                },
                transaction: {
                    id: payment.transaction?.id,
                    status: payment.transaction?.status, // Transaction status unchanged
                    expiresAt: payment.transaction?.expiresAt,
                    note: "Transaction remains active - you can create new payments"
                },
                cancellation: {
                    reason: cancellationReason,
                    cancelledAt: result.updatedPayment.updatedAt,
                    cancelledBy: userAuth.id,
                }
            }
        };

        return createCorsResponse(response, {}, request);

    } catch (error) {
        console.error('Error cancelling payment:', error);
        
        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('Record to update not found')) {
                return createCorsResponse(
                    { success: false, error: "Payment not found or already processed" },
                    { status: 404 },
                    request
                );
            }
        }

        return createCorsResponse(
            { success: false, error: "Failed to cancel payment. Please try again." },
            { status: 500 },
            request
        );
    }
}

// GET /api/customer/payment/cancel/[paymentId] - Check if payment can be cancelled
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ paymentId: string }> }
) {
    try {
        // Check authentication
        const userAuth = await getCustomerAuth(request);
        if (!userAuth?.id) {
            return createCorsResponse(
                { success: false, error: "Authentication required" },
                { status: 401 },
                request
            );
        }

        const { paymentId } = await params;

        // Get payment with basic details
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                transaction: {
                    userId: userAuth.id,
                }
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
                amount: true,
                method: true,
                transaction: {
                    select: {
                        id: true,
                        status: true,
                    }
                }
            }
        });

        if (!payment) {
            return createCorsResponse(
                { success: false, error: "Payment not found" },
                { status: 404 },
                request
            );
        }

        // Check cancellation eligibility
        const canCancel = payment.status === 'pending';
        const createdTime = new Date(payment.createdAt).getTime();
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - createdTime;
        const minimumWaitTime = 2 * 60 * 1000; // 2 minutes
        const waitTimeRemaining = Math.max(0, minimumWaitTime - timeDifference);

        const response = {
            success: true,
            data: {
                paymentId: payment.id,
                currentStatus: payment.status,
                canCancel: canCancel && waitTimeRemaining === 0,
                reasons: {
                    statusCheck: payment.status === 'pending' ? 'Payment is eligible for cancellation' : `Payment status is '${payment.status}', cannot cancel`,
                    timeCheck: waitTimeRemaining === 0 ? 'Wait time requirement met' : 'Must wait before cancelling',
                },
                waitTimeRemaining: Math.ceil(waitTimeRemaining / 1000), // in seconds
                paymentDetails: {
                    amount: payment.amount,
                    method: payment.method,
                    createdAt: payment.createdAt,
                }
            }
        };

        return createCorsResponse(response, {}, request);

    } catch (error) {
        console.error('Error checking payment cancellation eligibility:', error);
        return createCorsResponse(
            { success: false, error: "Internal server error" },
            { status: 500 },
            request
        );
    }
}
