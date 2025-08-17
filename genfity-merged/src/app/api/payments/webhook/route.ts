import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { TransactionStatusManager } from "@/lib/transaction-status-manager";

// Function to activate WhatsApp service after successful payment
async function activateWhatsAppService(transaction: any) {
  if (transaction.type !== 'whatsapp_service' || !transaction.whatsappTransaction?.whatsappPackageId) {
    return;
  }

  // Check if this WhatsApp transaction has already been success
  if (transaction.whatsappTransaction.status === 'success') {
    console.log(`[WHATSAPP_ACTIVATION] Transaction ${transaction.id} already success, skipping`);
    return;
  }

  const duration = transaction.whatsappTransaction.duration;
  const packageId = transaction.whatsappTransaction.whatsappPackageId;
  const userId = transaction.userId;
  // Check if user already has an active subscription for this package
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
    console.log(`[WHATSAPP_ACTIVATION] User ${userId} has active subscription until ${existingService.expiredAt}, extending duration`);
    
    newExpiredAt = new Date(existingService.expiredAt);
    if (duration === 'year') {
      newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
    } else {
      newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
    }    // Update existing service
    await prisma.servicesWhatsappCustomers.update({
      where: { id: existingService.id },
      data: { expiredAt: newExpiredAt },
    });

    console.log(`[WHATSAPP_ACTIVATION] Extended subscription for user ${userId} until ${newExpiredAt}`);
  } else {
    // No active subscription or expired - create new or update with new expiry
    newExpiredAt = new Date();
    if (duration === 'year') {
      newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
    } else {
      newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
    }

    if (existingService) {
      // Update expired service
      await prisma.servicesWhatsappCustomers.update({
        where: { id: existingService.id },
        data: { expiredAt: newExpiredAt },
      });
      console.log(`[WHATSAPP_ACTIVATION] Renewed expired subscription for user ${userId} until ${newExpiredAt}`);
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
      console.log(`[WHATSAPP_ACTIVATION] Created new subscription for user ${userId} until ${newExpiredAt}`);    }
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

  console.log(`[WHATSAPP_ACTIVATION] Marked transaction ${transaction.id} as success`);

  // Get package details for session limit validation
  const packageDetails = existingService?.package || await prisma.whatsappApiPackage.findUnique({
    where: { id: packageId },
  });

  if (packageDetails) {
    console.log(`[WHATSAPP_ACTIVATION] User ${userId} now has access to WhatsApp API with max ${packageDetails.maxSession} sessions until ${newExpiredAt}`);
  }
}

// POST /api/payments/webhook - Handle payment gateway webhooks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extract payment information from webhook
    // This would need to be adapted based on the actual payment gateway being used
    const { 
      transaction_id, 
      payment_id, 
      status, 
      payment_method,
      gateway_signature // For security verification
    } = body;

    // TODO: Verify webhook signature for security
    // Each payment gateway has their own signature verification method

    if (!transaction_id || !status) {
      return withCORS(NextResponse.json(
        { success: false, error: "Invalid webhook payload" },
        { status: 400 }
      ));
    }

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: {
        transaction: {
          id: transaction_id,
        },
      },      include: {
        transaction: {
          include: {
            productTransactions: {
              include: {
                package: true,
              },
            },
            addonTransactions: {
              include: {
                addon: true,
              },
            },
            whatsappTransaction: {
              include: {
                whatsappPackage: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return withCORS(NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      ));
    }    // Map gateway status to our status
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' = 'pending';
    switch (status.toLowerCase()) {
      case 'success':
      case 'paid':
      case 'settlement':
      case 'capture':
        paymentStatus = 'paid';
        break;
      case 'failed':
      case 'denied':
      case 'expire':
      case 'cancel':
        paymentStatus = 'failed';
        break;
      default:
        paymentStatus = 'pending';
    }    // Use PaymentExpirationService to update payment status with proper sync
    await PaymentExpirationService.updatePaymentStatus(
      payment.id,
      paymentStatus,
      `Webhook update from payment gateway`,
      undefined // No admin user for webhook updates
    );

    // Update transaction status based on payment status using our new flow
    if (paymentStatus === 'paid') {
      await TransactionStatusManager.updateTransactionOnPayment(
        payment.transactionId!,
        paymentStatus
      );
    }

    // Get updated transaction for activation check
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transaction_id },      include: {
        whatsappTransaction: {
          include: {
            whatsappPackage: true,
          },
        },
        productTransactions: {
          include: {
            package: true,
          },
        },
        addonTransactions: {
          include: {
            addon: true,
          },
        },
      },
    });

    // If payment is successful and it's a WhatsApp service, activate the service
    if (paymentStatus === 'paid' && updatedTransaction?.type === 'whatsapp_service') {
      await activateWhatsAppService(updatedTransaction);
    }

    console.log(`[WEBHOOK] Payment ${payment.id} status updated to ${paymentStatus} for transaction ${transaction_id}`);

    return withCORS(NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    }));
  } catch (error) {
    console.error("[PAYMENT_WEBHOOK]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
