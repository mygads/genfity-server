import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { z } from "zod";

const processPaymentSchema = z.object({
  transactionId: z.string().cuid(),
  method: z.enum(['manual', 'test']), 
  amount: z.number().positive(),
});

// Simulate payment gateway responses
function simulatePaymentGateway(method: string, transactionId: string, amount: number) {
  const paymentResponse: any = {
    payment_id: `${method}_${Date.now()}`,
    gateway_transaction_id: `gw_${Date.now()}`,
  };

  switch (method) {
      
    case 'manual':
      return {
        ...paymentResponse,
        bank_account: {
          bank_name: "Bank Central Asia",
          account_number: "1234567890",
          account_name: "PT Genfity Indonesia",
        },
        payment_code: `PAY_${transactionId.slice(-8).toUpperCase()}`,
        instructions: "Transfer exact amount to the bank account with payment code in description",
      };      
    default:
      return paymentResponse;
  }
}

// Function to activate WhatsApp service after successful payment
async function activateWhatsAppService(transaction: any, whatsappTransaction: any) {
  if (transaction.type !== 'whatsapp_service' || !whatsappTransaction?.whatsappPackageId) {
    return;
  }

  // Check if this WhatsApp transaction has already been success
  if (whatsappTransaction.status === 'success') {
    console.log(`[PAYMENT_PROCESS] Transaction ${transaction.id} already success, skipping`);
    return;
  }

  try {
    const duration = whatsappTransaction.duration;
    const expiredAt = new Date();
    
    if (duration === 'year') {
      expiredAt.setFullYear(expiredAt.getFullYear() + 1);
    } else {
      expiredAt.setMonth(expiredAt.getMonth() + 1);
    }
    
    // Create or update WhatsApp service
    await prisma.servicesWhatsappCustomers.upsert({
      where: {
        customerId_packageId: {
          customerId: transaction.userId,
          packageId: whatsappTransaction.whatsappPackageId,
        },
      },
      update: {
        expiredAt: expiredAt,
      },
      create: {
        customerId: transaction.userId,
        transactionId: transaction.id,
        packageId: whatsappTransaction.whatsappPackageId,
        expiredAt: expiredAt,
        status: 'active',
      },
    });

    // Mark WhatsApp transaction as success
    await prisma.transactionWhatsappService.update({
      where: { id: whatsappTransaction.id },
      data: { 
        status: 'success',
        startDate: new Date(),
        endDate: expiredAt,
      },
    });

    console.log(`[PAYMENT_PROCESS] WhatsApp service activated and marked as success for transaction ${transaction.id}`);
  } catch (error) {
    console.error(`[PAYMENT_PROCESS] Error activating WhatsApp service:`, error);
    
    // Mark WhatsApp transaction as failed
    try {
      await prisma.transactionWhatsappService.update({
        where: { id: whatsappTransaction.id },
        data: { status: 'failed' },
      });
    } catch (updateError) {
      console.error('[PAYMENT_PROCESS] Failed to mark transaction as failed:', updateError);
    }
    
    throw error;
  }
}

// Function to activate all services for mixed transactions
async function activateMixedTransactionServices(transaction: any) {
  try {
    await prisma.$transaction(async (tx) => {
      // Activate WhatsApp services
      const whatsappTransactions = await tx.transactionWhatsappService.findMany({
        where: { transactionId: transaction.id },
        include: { whatsappPackage: true },
      });    for (const whatsappTrx of whatsappTransactions) {
      if (whatsappTrx.duration && whatsappTrx.whatsappPackage) {
        // Check if this WhatsApp transaction has already been success
        if (whatsappTrx.status === 'success') {
          console.log(`[MIXED_ACTIVATION] WhatsApp transaction ${whatsappTrx.id} already success, skipping`);
          continue;
        }

        const startDate = new Date();
        const endDate = new Date();
        
        if (whatsappTrx.duration === 'year') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        // Update transaction with start/end dates and mark as processed
        await tx.transactionWhatsappService.update({
          where: { id: whatsappTrx.id },
          data: {
            status: 'success',
            startDate,
            endDate,
          },
        });// Create or update WhatsApp service
        await tx.servicesWhatsappCustomers.upsert({
          where: {
            customerId_packageId: {
              customerId: transaction.userId,
              packageId: whatsappTrx.whatsappPackageId,
            },
          },
          update: {
            expiredAt: endDate,
          },
          create: {
            customerId: transaction.userId,
            transactionId: transaction.id,
            packageId: whatsappTrx.whatsappPackageId,
            expiredAt: endDate,
            status: 'active',
          },
        });
      }
    }

    // Activate product services (packages/addons)
    const productTransactions = await tx.transactionProduct.findMany({
      where: { transactionId: transaction.id },
    });

    for (const productTrx of productTransactions) {
      // Set start and end dates for product transaction
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // Default 1 year for products

      await tx.transactionProduct.update({
        where: { id: productTrx.id },
        data: {
          startDate,
          endDate,
        },
      });
    }    console.log(`[SERVICE_ACTIVATION] All services activated for transaction ${transaction.id}`);
    });
  } catch (error) {
    console.error(`[MIXED_ACTIVATION] Error activating services for transaction ${transaction.id}:`, error);
    
    // Mark failed WhatsApp transactions
    try {
      await prisma.transactionWhatsappService.updateMany({
        where: { 
          transactionId: transaction.id,
          status: 'pending'
        },
        data: { status: 'failed' },
      });
    } catch (updateError) {
      console.error('[MIXED_ACTIVATION] Failed to mark WhatsApp transactions as failed:', updateError);
    }
    
    throw error;
  }
}

// Function to process successful payment
async function processSuccessfulPayment(transactionId: string, paymentId: string) {
  // Use PaymentExpirationService to update payment status with proper sync
  await PaymentExpirationService.updatePaymentStatus(
    paymentId,
    'paid',
    'Payment verified successfully'
  );
  // Get transaction details for activation
  const updatedTransaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      productTransactions: {
        include: {
          package: true,
        },
      },
      whatsappTransaction: {
        include: {
          whatsappPackage: true,
        },
      },
    },
  });

  if (!updatedTransaction) {
    throw new Error("Transaction not found");
  }
  // Activate services based on transaction type
  if (updatedTransaction.type === 'whatsapp_service' && updatedTransaction.whatsappTransaction) {
    await activateWhatsAppService(updatedTransaction, updatedTransaction.whatsappTransaction);
  } else if (updatedTransaction.type === 'mixed_checkout') {
    await activateMixedTransactionServices(updatedTransaction);
  }
}

// POST /api/payments/process - Unified payment processing for all transaction types
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    const body = await request.json();
    const validation = processPaymentSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { transactionId, method, amount } = validation.data;    // Verify transaction belongs to user and is eligible for payment
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: session.user.id,
        status: { in: ['created', 'pending'] }, // Allow payment for both created and pending
      },
      include: {
        payment: true,        productTransactions: {
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
    });

    if (!transaction) {
      return withCORS(NextResponse.json(
        { success: false, error: "Transaction not found or not eligible for payment" },
        { status: 404 }
      ));
    }    // Verify amount matches transaction amount
    const expectedAmount = Number(transaction.amount);
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return withCORS(NextResponse.json(
        { success: false, error: `Amount mismatch. Expected: ${expectedAmount}, received: ${amount}` },
        { status: 400 }
      ));
    }

    // Generate payment gateway response
    const paymentResponse = simulatePaymentGateway(method, transactionId, amount);    // Create or update payment record with expiration
    let payment;
    if (transaction.payment) {
      payment = await PaymentExpirationService.updatePaymentStatus(
        transaction.payment.id,
        'pending',
        `Updated payment method to ${method}`,
        session.user.id
      );
      
      // Update method and amount separately since updatePaymentStatus doesn't handle these
      payment = await prisma.payment.update({
        where: { id: transaction.payment.id },
        data: {
          method,
          amount: amount,
        },
      });
    } else {
      payment = await PaymentExpirationService.createPaymentWithExpiration({
        transactionId,
        amount: amount,
        method,
      });
    }

    // For test method, simulate automatic payment verification after 3 seconds
    if (method === 'test') {
      setTimeout(async () => {
        try {
          await processSuccessfulPayment(transactionId, payment.id);
          console.log(`[PAYMENT_VERIFIED] Transaction ${transactionId} automatically verified after 3 seconds`);
        } catch (error) {
          console.error(`[PAYMENT_VERIFICATION_ERROR] Failed to verify payment for transaction ${transactionId}:`, error);
        }
      }, 3000); // 3 second cooldown
    }    return withCORS(NextResponse.json({
      success: true,
      data: {
        transaction_id: transactionId,
        payment_id: payment.id,
        method,
        amount,
        status: 'pending',
        payment_expires_at: payment.expiresAt,
        transaction_expires_at: transaction.expiresAt,
        transaction_type: transaction.type,        item_name: transaction.type === 'whatsapp_service' 
          ? transaction.whatsappTransaction?.whatsappPackage?.name
          : transaction.productTransactions?.[0]?.package?.name_en || 'Product',
        ...paymentResponse,
      },
      message: method === 'test' 
        ? "Payment initiated. Will be automatically verified in 3 seconds."
        : "Payment processing initiated",
    }));
  } catch (error) {
    console.error("[PAYMENT_PROCESS]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to process payment" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
