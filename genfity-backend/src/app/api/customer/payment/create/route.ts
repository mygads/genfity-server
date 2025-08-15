import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// Validation schema for payment request
const paymentRequestSchema = z.object({
  transactionId: z.string().cuid("Invalid transaction ID"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

// Function to calculate service fee
function calculateServiceFee(amount: number, serviceFee: any): number {
  if (!serviceFee || !serviceFee.isActive) return 0;
  
  let fee = 0;
  if (serviceFee.type === 'percentage') {
    fee = amount * (Number(serviceFee.value) / 100);
    if (serviceFee.minFee && fee < Number(serviceFee.minFee)) {
      fee = Number(serviceFee.minFee);
    }
    if (serviceFee.maxFee && fee > Number(serviceFee.maxFee)) {
      fee = Number(serviceFee.maxFee);
    }
  } else {
    fee = Number(serviceFee.value);
  }
  
  return Math.round(fee * 100) / 100; // Round to 2 decimal places
}

// Generate payment URL and instructions based on method
function generatePaymentDetails(paymentId: string, method: string, amount: number, currency: string, bankDetails?: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.genfity.com';
  
  // Generate 3-digit unique code for manual payments
  const uniqueCode = Math.floor(100 + Math.random() * 900);
  const isManualPayment = ['manual_bank_transfer', 'bank_transfer'].includes(method.toLowerCase());
  
  const finalAmount = isManualPayment ? amount + uniqueCode : amount;
  const currencySymbol = currency === 'idr' ? 'Rp' : '$';
  const formattedAmount = currency === 'idr' 
    ? `Rp ${finalAmount.toLocaleString('id-ID')}`
    : `$${finalAmount.toFixed(2)}`;
  
  let instructions = '';
  let additionalInfo = {};
  
  switch (method.toLowerCase()) {
    case 'manual_bank_transfer':
    case 'bank_transfer':
      instructions = `Please transfer exactly ${formattedAmount} to our bank account. Include payment ID ${paymentId} in the transfer description for faster processing.`;
      additionalInfo = {
        paymentUrl: null, // No payment URL for manual
        externalId: null, // No external ID for manual
        uniqueCode: uniqueCode,
        finalAmountWithCode: finalAmount,
        bankDetails: bankDetails || {
          bankName: "Bank Central Asia (BCA)",
          accountNumber: "1234567890",
          accountName: "PT Genfity Indonesia",
          swiftCode: currency === 'usd' ? 'CENAIDJA' : undefined
        },
        note: "Manual verification required. Processing time: 1-24 hours."
      };
      break;      
    case 'qris':
      instructions = `Scan the QR code using any e-wallet app (GoPay, OVO, DANA, etc.) to pay ${formattedAmount}.`;
      additionalInfo = {
        paymentUrl: `${baseUrl}/payment/${paymentId}`,
        qrCodeUrl: `${baseUrl}/qr/${paymentId}`,
        supportedApps: ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'],
        note: "QR code valid for 15 minutes"
      };
      break;
      
    case 'gopay':
    case 'ovo':
    case 'dana':
    case 'shopeepay':
    case 'e_wallet':
      const walletName = method === 'e_wallet' ? 'your e-wallet' : method.toUpperCase();
      instructions = `Complete payment of ${formattedAmount} using ${walletName} app.`;
      additionalInfo = {
        deepLink: `${method}://pay?amount=${amount}&merchant=genfity&ref=${paymentId}`,
        note: "You will be redirected to the app to complete payment"
      };
      break;
      
    case 'credit_card':
    case 'debit_card':
    case 'visa':
    case 'mastercard':
      instructions = `Complete payment of ${formattedAmount} using your ${method.replace('_', ' ')} via secure payment gateway.`;
      additionalInfo = {
        gateway: "Secure SSL encryption",
        acceptedCards: ['Visa', 'Mastercard', 'JCB', 'AMEX'],
        note: "3D Secure authentication required"
      };
      break;
      
    case 'virtual_account':
    case 'bca':
    case 'mandiri':
    case 'bni':
    case 'bri':
      const bankName = method === 'virtual_account' ? 'your selected bank' : method.toUpperCase();
      instructions = `Pay ${formattedAmount} using ${bankName} virtual account number provided.`;
      additionalInfo = {
        virtualAccount: `${method.toUpperCase()}${Date.now().toString().slice(-10)}`,
        bankCode: method.toUpperCase(),
        note: "Virtual account expires in 24 hours"
      };
      break;
      
    case 'paypal':
      instructions = `Complete payment of ${formattedAmount} via PayPal secure checkout.`;
      additionalInfo = {
        redirectUrl: `https://paypal.com/checkoutnow?token=${paymentId}`,
        note: "PayPal account required"
      };
      break;
      
    case 'stripe':
      instructions = `Complete payment of ${formattedAmount} via Stripe secure checkout.`;
      additionalInfo = {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.slice(0, 20) + '...',
        note: "International cards supported"
      };
      break;
      
    default:
      instructions = `Complete payment of ${formattedAmount} using ${method}.`;
      additionalInfo = {
        method: method,
        note: "Follow the payment instructions provided"
      };
  }
    return {
    paymentUrl: isManualPayment ? null : `${baseUrl}/payment/${paymentId}`,
    instructions,
    ...additionalInfo
  };
}

// POST /api/customer/payment/create - Create payment request
export async function POST(request: NextRequest) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required. Please login first." },
        { status: 401 }
      ));
    }

    const body = await request.json();
    const validation = paymentRequestSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }    const { transactionId, paymentMethod } = validation.data;

    // Auto-expire this specific transaction before proceeding
    await PaymentExpirationService.autoExpireOnApiCall(transactionId);

    // Check if transaction is still valid for payment creation
    const canCreatePayment = await PaymentExpirationService.canCreatePaymentForTransaction(transactionId);
    
    if (!canCreatePayment) {
      return withCORS(NextResponse.json({ 
        success: false, 
        error: 'Cannot create payment for this transaction. Transaction may be expired, cancelled, or already paid.',
        code: 'TRANSACTION_INVALID'
      }, { status: 400 }));
    }

    // Process payment creation in database transaction
    const result = await prisma.$transaction(async (tx) => {      // 1. Get transaction details with security check
      const transaction = await tx.transaction.findFirst({        where: {
          id: transactionId,
          userId: userAuth.id, // Security: ensure user owns this transaction
          status: { in: ['created', 'pending'] }, // Allow payment for created and pending transactions
        },        include: {
          voucher: true,          productTransactions: {
            include: {
              package: {
                include: {
                  category: true,
                  subcategory: true,
                }
              }
            }
          },
          addonTransactions: {
            include: {
              addon: {
                include: {
                  category: true,
                }
              }
            }
          },
          whatsappTransaction: {
            include: {
              whatsappPackage: true,
            }
          }
        }
      });

      if (!transaction) {
        throw new Error("Transaction not found or not available for payment");
      }      // 2. Check if there's an active payment for this transaction
      const existingPayment = await tx.payment.findUnique({
        where: { transactionId: transaction.id }
      });

      // Only prevent creation if there's a pending payment
      // Allow new payment if previous payment was cancelled, failed, or expired
      if (existingPayment && existingPayment.status === 'pending') {
        throw new Error("A pending payment already exists for this transaction. Please cancel the existing payment first.");
      }// 3. Get service fee configuration with payment instructions
      const serviceFee = await tx.serviceFee.findFirst({
        where: { 
          paymentMethod: paymentMethod,
          currency: transaction.currency,
          isActive: true
        },
        select: {
          id: true,
          paymentMethod: true,
          name: true,
          type: true,
          value: true,
          minFee: true,
          maxFee: true,
          currency: true,
          isActive: true,
          requiresManualApproval: true,
          paymentInstructions: true,
          instructionType: true,
          instructionImageUrl: true,
        }
      });

      if (!serviceFee) {
        throw new Error(`Payment method '${paymentMethod}' not available or inactive for currency '${transaction.currency}'`);
      }      // 4. Calculate final amounts
      const baseAmount = Number(transaction.totalAfterDiscount || transaction.amount);
      const serviceFeeAmount = calculateServiceFee(baseAmount, serviceFee);
      
      // Generate unique code for manual payments
      const isManualPayment = ['manual_bank_transfer', 'bank_transfer'].includes(paymentMethod.toLowerCase());
      const uniqueCode = isManualPayment ? Math.floor(100 + Math.random() * 900) : 0;
      const finalAmount = baseAmount + serviceFeeAmount + uniqueCode;      // 5. Update transaction with service fee, final amount, and status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          serviceFeeAmount: new Decimal(serviceFeeAmount),
          finalAmount: new Decimal(finalAmount),
          status: 'pending', // Update status to pending after payment is created
        }
      });

      // 5.1. Update child transaction statuses to pending when payment is created
      await tx.transactionProduct.updateMany({
        where: { transactionId: transaction.id },
        data: { status: 'pending' }
      });

      await tx.transactionAddons.updateMany({
        where: { transactionId: transaction.id },
        data: { status: 'pending' }
      });// 6. Get bank details for manual payments
      let bankDetails = null;
      if (isManualPayment) {
        try {
          bankDetails = await tx.bankDetail.findFirst({
            where: {
              currency: transaction.currency,
              isActive: true,
            },
            select: {
              bankName: true,
              accountNumber: true,
              accountName: true,
              swiftCode: true,
              currency: true,
            }
          });
        } catch (error) {
          console.log('No bank details found in database, using fallback');
        }
      }

      // 7. Generate payment details with instructions
      const paymentDetails = generatePaymentDetails(
        `payment_${Date.now()}`, 
        paymentMethod, 
        finalAmount, 
        transaction.currency,
        bankDetails
      );      // 6. Create or update payment record with expiration (1 day from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // 1 day expiration
      
      let payment;
      
      if (existingPayment && existingPayment.status !== 'pending') {
        // Update existing inactive payment
        payment = await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: new Decimal(finalAmount),
            method: paymentMethod,
            status: 'pending',
            serviceFee: new Decimal(serviceFeeAmount),
            expiresAt: expiresAt,
            externalId: isManualPayment ? null : `dummy_payment_${Date.now()}`,
            paymentUrl: isManualPayment ? null : paymentDetails.paymentUrl,
            createdAt: new Date(), // Reset creation time for new payment attempt
            updatedAt: new Date(),
            paymentDate: null, // Reset payment date
            adminNotes: null, // Clear previous admin notes
            adminAction: null, // Clear previous admin action
            adminUserId: null, // Clear previous admin user
            actionDate: null, // Clear previous action date
          }
        });
      } else {
        // Create new payment
        payment = await tx.payment.create({
          data: {
            transactionId: transaction.id,
            amount: new Decimal(finalAmount),
            method: paymentMethod,
            status: 'pending',
            serviceFee: new Decimal(serviceFeeAmount),
            expiresAt: expiresAt,
            externalId: isManualPayment ? null : `dummy_payment_${Date.now()}`, // Manual payments don't have external ID
            paymentUrl: isManualPayment ? null : paymentDetails.paymentUrl, // Manual payments don't have payment URL
          }
        });
      }return {
        transaction: updatedTransaction,
        payment,
        serviceFee,
        originalTransaction: transaction,
        paymentDetails,
        uniqueCode,
        isManualPayment
      };
    });

    // 7. Prepare payment response
    const response = {
      success: true,
      data: {        payment: {
          id: result.payment.id,
          transactionId: result.transaction.id,
          amount: Number(result.payment.amount),
          method: result.payment.method,
          status: result.payment.status,
          paymentUrl: result.payment.paymentUrl,
          externalId: result.payment.externalId,
          createdAt: result.payment.createdAt,
          expiresAt: result.payment.expiresAt,
          instructions: result.paymentDetails.instructions,
          paymentDetails: result.paymentDetails,
          uniqueCode: result.uniqueCode,
          // Add payment instructions from serviceFee
          paymentInstructions: result.serviceFee.paymentInstructions,
          instructionType: result.serviceFee.instructionType,
          instructionImageUrl: result.serviceFee.instructionImageUrl,
        },
        transaction: {
          id: result.transaction.id,
          currency: result.transaction.currency,
          status: result.transaction.status,
          type: result.transaction.type,
          notes: result.transaction.notes,
          expiresAt: result.transaction.expiresAt,
        },
        pricing: {
          subtotal: Number(result.transaction.originalAmount),
          discountAmount: Number(result.transaction.discountAmount || 0),
          totalAfterDiscount: Number(result.transaction.totalAfterDiscount || result.transaction.amount),          
          serviceFee: {
            paymentMethod: result.serviceFee.paymentMethod,
            method: result.serviceFee.name,
            type: result.serviceFee.type,
            value: Number(result.serviceFee.value),
            amount: Number(result.payment.serviceFee),
            currency: result.serviceFee.currency,
            description: result.serviceFee.type === 'percentage' 
              ? `${Number(result.serviceFee.value)}% fee` 
              : `Fixed fee ${result.serviceFee.currency.toUpperCase()} ${Number(result.serviceFee.value).toLocaleString()}`
          },finalAmount: Number(result.payment.amount),
          currency: result.transaction.currency,
        },        
        items: [] as Array<{
          type: string;
          name: string;
          category?: string;
          subcategory?: string;
          duration?: string;
          quantity: number;
        }>, // Will be populated based on transaction type
        voucher: result.originalTransaction.voucher ? {
          code: result.originalTransaction.voucher.code,
          name: result.originalTransaction.voucher.name,
          discountAmount: Number(result.transaction.discountAmount || 0),
        } : null,
        
        // Expiration info
        expirationInfo: {
          paymentExpiresAt: result.payment.expiresAt,
          transactionExpiresAt: result.transaction.expiresAt,
          paymentTimeRemaining: result.payment.expiresAt ? Math.max(0, Math.floor((new Date(result.payment.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60))) + " hours" : null,
          transactionTimeRemaining: result.transaction.expiresAt ? Math.max(0, Math.floor((new Date(result.transaction.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + " days" : null
        },
      },
      message: `Payment created successfully using ${result.serviceFee.name}. Service fee has been applied based on admin configuration. Please complete payment using the provided URL.`
    };    // 8. Add items based on transaction type
    if (result.originalTransaction.productTransactions && result.originalTransaction.productTransactions.length > 0) {
      result.originalTransaction.productTransactions.forEach(productTx => {
        if (productTx.package) {
          response.data.items.push({
            type: 'package',
            name: productTx.package.name_en,
            category: productTx.package.category.name_en,
            subcategory: productTx.package.subcategory?.name_en,
            quantity: productTx.quantity,
          });
        }
      });
    }

    // Add add-ons from addonTransactions
    if (result.originalTransaction.addonTransactions) {
      result.originalTransaction.addonTransactions.forEach((addonTx: any) => {
        response.data.items.push({
          type: 'addon',
          name: addonTx.addon.name_en,
          category: addonTx.addon.category.name_en,
          quantity: addonTx.quantity,
        });
      });
    }

    if (result.originalTransaction.whatsappTransaction) {
      const whatsappTx = result.originalTransaction.whatsappTransaction;
      response.data.items.push({
        type: 'whatsapp_service',
        name: whatsappTx.whatsappPackage.name,
        duration: whatsappTx.duration,
        quantity: 1, // WhatsApp services are typically single quantity
      });
    }

    return withCORS(NextResponse.json(response));

  } catch (error) {
    console.error("[PAYMENT_CREATE_ERROR]", error);
    
    if (error instanceof Error) {
      return withCORS(NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      ));
    }

    return withCORS(NextResponse.json(
      { success: false, error: "Failed to create payment" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
