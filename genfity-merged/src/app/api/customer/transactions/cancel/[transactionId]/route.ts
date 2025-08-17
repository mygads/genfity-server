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

// POST /api/customer/transaction/cancel/[transactionId] - Cancel a transaction
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ transactionId: string }> }
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
        }        const { transactionId } = await params;

        // Auto-expire this specific transaction before proceeding
        await PaymentExpirationService.autoExpireOnApiCall(transactionId);

        // Get transaction with payment details to verify ownership and current status
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId: userAuth.id, // Ensure user owns this transaction
            },
            include: {
                payment: {
                    select: {
                        id: true,
                        status: true,
                        amount: true,
                        method: true,
                        expiresAt: true,
                    }
                }
            }
        });

        if (!transaction) {
            return createCorsResponse(
                { success: false, error: "Transaction not found or you don't have permission to cancel it" },
                { status: 404 },
                request
            );
        }        // Check if transaction can be cancelled
        if (transaction.status === 'success') {
            return createCorsResponse(
                { success: false, error: "Cannot cancel a completed transaction" },
                { status: 400 },
                request
            );
        }

        if (transaction.status === 'cancelled') {
            return createCorsResponse(
                { success: false, error: "Transaction is already cancelled" },
                { status: 400 },
                request
            );
        }

        if (transaction.status === 'expired') {
            return createCorsResponse(
                { success: false, error: "Transaction has already expired" },
                { status: 400 },
                request
            );
        }

        // Get cancellation reason from request body
        let cancellationReason = "Cancelled by customer";
        try {
            const body = await request.json();
            if (body.reason && typeof body.reason === 'string' && body.reason.trim().length > 0) {
                cancellationReason = body.reason.trim();
            }
        } catch (error) {
            // Body parsing failed or no body provided, use default reason
        }

        // Perform the cancellation in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update transaction status to cancelled
            const updatedTransaction = await tx.transaction.update({
                where: { id: transactionId },
                data: { 
                    status: 'cancelled',
                    updatedAt: new Date(),
                }
            });

            // Cancel all pending payments for this transaction
            const cancelledPayments = await tx.payment.updateMany({
                where: {
                    transactionId: transactionId,
                    status: 'pending'
                },
                data: {
                    status: 'cancelled',
                    updatedAt: new Date(),
                }
            });

            // Log the cancellation
            console.log(`[TRANSACTION_CANCELLED] Transaction ${transactionId} cancelled by user ${userAuth.id}`, {
                transactionId: transactionId,
                userId: userAuth.id,
                reason: cancellationReason,
                cancelledAt: new Date(),
                cancelledPayments: cancelledPayments.count,
                note: "All pending payments also cancelled"
            });

            return { updatedTransaction, cancelledPaymentsCount: cancelledPayments.count };
        });

        // Prepare response data
        const response = {
            success: true,
            message: `Transaction cancelled successfully. ${result.cancelledPaymentsCount} pending payments also cancelled.`,
            data: {
                transaction: {
                    id: result.updatedTransaction.id,
                    status: result.updatedTransaction.status,
                    type: result.updatedTransaction.type,
                    amount: result.updatedTransaction.amount,
                    currency: result.updatedTransaction.currency,
                    updatedAt: result.updatedTransaction.updatedAt,
                    expiresAt: result.updatedTransaction.expiresAt,
                },
                payments: {
                    cancelledCount: result.cancelledPaymentsCount,
                    note: "All pending payments for this transaction have been cancelled"
                },
                cancellation: {
                    reason: cancellationReason,
                    cancelledAt: result.updatedTransaction.updatedAt,
                    cancelledBy: userAuth.id,
                }
            }
        };

        return createCorsResponse(response, {}, request);

    } catch (error) {
        console.error('Error cancelling transaction:', error);
        
        // Handle specific database errors
        if (error instanceof Error) {
            if (error.message.includes('Record to update not found')) {
                return createCorsResponse(
                    { success: false, error: "Transaction not found or already processed" },
                    { status: 404 },
                    request
                );
            }
        }

        return createCorsResponse(
            { success: false, error: "Failed to cancel transaction. Please try again." },
            { status: 500 },
            request
        );
    }
}
