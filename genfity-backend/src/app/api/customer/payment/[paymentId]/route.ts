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

// Helper function to get bank details for manual payments
async function getBankDetailsForPayment(method: string, currency: string) {
  try {
    // Try to get from database first
    const bankDetail = await prisma.bankDetail.findFirst({
      where: {
        currency: currency,
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
    
    if (bankDetail) {
      return bankDetail;
    }
  } catch (error) {
    console.log('No bank details found in database, using fallback');
  }
}

// Generate payment instructions based on method and amount
function generatePaymentInstructions(method: string, amount: number, currency: string, paymentId: string, bankDetails?: any) {
  const formattedAmount = currency === 'idr' 
    ? `Rp ${amount.toLocaleString('id-ID')}` 
    : `$${amount.toLocaleString('en-US')}`;
    
  let instructions = '';
  let additionalInfo: any = {};
  
  switch (method.toLowerCase()) {
    case 'manual_bank_transfer':
    case 'bank_transfer':
      instructions = `Transfer exactly ${formattedAmount} to the bank account below`;
      additionalInfo = {
        bankDetails: bankDetails,
        note: "Include the unique code in your transfer to ensure quick verification",
        steps: [
          "Transfer the exact amount including the unique code",
          "Take a screenshot of your transfer receipt",
          "Wait for verification (usually within 1-24 hours)",
          "Your transaction will be processed once verified"
        ]
      };
      break;
      
    case 'midtrans':
    case 'xendit':
    case 'credit_card':
    case 'debit_card':
      instructions = `Complete payment of ${formattedAmount} using your ${method.replace('_', ' ')} via secure payment gateway.`;
      additionalInfo = {
        gateway: "Secure SSL encryption",
        acceptedCards: ['Visa', 'Mastercard', 'JCB', 'AMEX'],
        note: "3D Secure authentication required",
        steps: [
          "Enter your card details securely",
          "Verify payment amount",
          "Complete 3D Secure authentication",
          "Confirm payment",
          "Wait for payment confirmation"
        ]
      };
      break;
      
    default:
      instructions = `Complete payment of ${formattedAmount} using ${method}.`;
      additionalInfo = {
        note: "Follow the payment provider's instructions"
      };
  }
  
  return { instructions, additionalInfo };
}

// GET /api/customer/payment/[paymentId] - Get payment details
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
      );    }
    
    const { paymentId } = await params;

    // Auto-expire payments and transactions for this specific payment
    await PaymentExpirationService.autoExpireOnApiCall(undefined, paymentId);

    // First, let's check if the payment exists at all
    const paymentExists = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { 
        id: true, 
        transactionId: true,
        transaction: {
          select: {
            id: true,
            userId: true
          }
        }
      }    });

    if (!paymentExists) {
      return createCorsResponse(
        { success: false, error: "Payment not found" },
        { status: 404 },
        request
      );
    }    // Check if user owns this payment
    if (paymentExists.transactionId && paymentExists.transaction?.userId !== userAuth.id) {
      return createCorsResponse(
        { success: false, error: "Payment not found" },
        { status: 404 },
        request
      );
    }    // Get payment with full transaction details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        transaction: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            },
            voucher: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
                value: true,
              },
            },            productTransactions: {
              include: {
                package: {
                  select: {
                    name_en: true,
                    price_idr: true,
                    price_usd: true,
                    category: {
                      select: {
                        name_en: true,
                      },
                    },
                    subcategory: {
                      select: {
                        name_en: true,
                      },
                    },
                  },
                }
              },
            },
            addonTransactions: {
              include: {
                addon: {
                  select: {
                    name_en: true,
                    price_idr: true,
                    price_usd: true,
                    category: {
                      select: {
                        name_en: true,
                      },
                    },
                  },
                }
              },
            },
            whatsappTransaction: {
              include: {
                whatsappPackage: {
                  select: {
                    name: true,
                    priceMonth: true,
                    priceYear: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return createCorsResponse(
        { success: false, error: "Payment not found" },
        { status: 404 },
        request
      );
    }

    // Get bank details if it's a manual payment method
    let bankDetails = null;
    const isManualPayment = ['manual_bank_transfer', 'bank_transfer'].includes(payment.method?.toLowerCase() || '');
    if (isManualPayment && payment.transaction?.currency) {
      bankDetails = await getBankDetailsForPayment(payment.method || '', payment.transaction.currency);
    }    // Get service fee configuration with payment instructions
    let serviceFeeInfo = null;
    if (payment.method && payment.transaction?.currency) {
      const serviceFee = await prisma.serviceFee.findFirst({
        where: {
          paymentMethod: payment.method,
          currency: payment.transaction.currency,
          isActive: true
        },
        select: {
          paymentInstructions: true,
          instructionType: true,
          instructionImageUrl: true,
          type: true,
          value: true,
          minFee: true,
          maxFee: true,
        }
      });
      
      if (serviceFee) {
        serviceFeeInfo = {
          instructions: serviceFee.paymentInstructions,
          instructionType: serviceFee.instructionType,
          instructionImageUrl: serviceFee.instructionImageUrl,
          feeType: serviceFee.type,
          feeValue: serviceFee.value,
          minFee: serviceFee.minFee,
          maxFee: serviceFee.maxFee,
        };
      }
    }

    // Generate payment instructions
    const paymentInstructions = generatePaymentInstructions(
      payment.method || '',
      Number(payment.amount),
      payment.transaction?.currency || 'idr',
      payment.id,
      bankDetails
    );    // Calculate unique code for manual payments
    let uniqueCode = null;
    if (isManualPayment) {
      const totalPayment = Number(payment.amount);
      const productCost = payment.transaction?.originalAmount ? Number(payment.transaction.originalAmount) : 0;
      const discountAmount = payment.transaction?.discountAmount ? Number(payment.transaction.discountAmount) : 0;
      const serviceFeeAmount = payment.serviceFee ? Number(payment.serviceFee) : 0;
      
      // uniqueCode = totalPayment - (productCost - discountAmount + serviceFeeAmount)
      uniqueCode = totalPayment - (productCost - discountAmount + serviceFeeAmount);
      
      // Ensure uniqueCode is a positive 3-digit number
      if (uniqueCode <= 0 || uniqueCode > 999) {
        // Fallback: generate based on payment ID for consistency
        const paymentIdNum = parseInt(payment.id.replace(/\D/g, '').slice(-3)) || 123;
        uniqueCode = 100 + (paymentIdNum % 900);
      }
    }    // Determine transaction type based on what's included
    let transactionType = 'unknown';
    const hasProduct = payment.transaction?.productTransactions && payment.transaction.productTransactions.length > 0;
    const hasAddons = payment.transaction?.addonTransactions && payment.transaction.addonTransactions.length > 0;
    const hasWhatsapp = payment.transaction?.whatsappTransaction?.whatsappPackage;
    
    // Determine transaction type based on all possible combinations
    if (hasProduct && hasAddons && hasWhatsapp) {
      transactionType = 'package_addon_whatsapp';
    } else if (hasProduct && hasAddons && !hasWhatsapp) {
      transactionType = 'package_and_addon';
    } else if (hasProduct && !hasAddons && hasWhatsapp) {
      transactionType = 'package_and_whatsapp';
    } else if (!hasProduct && hasAddons && hasWhatsapp) {
      transactionType = 'addon_and_whatsapp';
    } else if (hasProduct && !hasAddons && !hasWhatsapp) {
      transactionType = 'package';
    } else if (!hasProduct && hasAddons && !hasWhatsapp) {
      transactionType = 'addon';
    } else if (!hasProduct && !hasAddons && hasWhatsapp) {
      transactionType = 'whatsapp_service';
    }// Format transaction items with prices
    const calculatePrice = (priceIdr: any, priceUsd: any, currency: string) => {
      if (currency === 'usd') {
        return Number(priceUsd || 0);
      }
      return Number(priceIdr || 0);
    };    const items = [];
    
    // Add product packages
    if (payment.transaction?.productTransactions && payment.transaction.productTransactions.length > 0) {
      payment.transaction.productTransactions.forEach(productTx => {
        if (productTx.package) {
          const price = calculatePrice(productTx.package.price_idr, productTx.package.price_usd, payment.transaction!.currency || 'idr');
          
          items.push({
            type: 'package',
            name: productTx.package.name_en,
            price: price,
            category: productTx.package.category?.name_en,
            subcategory: productTx.package.subcategory?.name_en,
            quantity: productTx.quantity || 1,
          });
        }
      });
    }
    
    // Add product addons
    if (payment.transaction?.addonTransactions && payment.transaction.addonTransactions.length > 0) {
      payment.transaction.addonTransactions.forEach(addonTx => {
        if (addonTx.addon) {
          const price = calculatePrice(addonTx.addon.price_idr, addonTx.addon.price_usd, payment.transaction!.currency || 'idr');
          
          items.push({
            type: 'addon',
            name: addonTx.addon.name_en,
            price: price,
            category: addonTx.addon.category?.name_en,
            quantity: addonTx.quantity,
          });
        }
      });
    }
    
    // Add WhatsApp services
    if (payment.transaction?.whatsappTransaction?.whatsappPackage) {
      const whatsappPkg = payment.transaction.whatsappTransaction.whatsappPackage;
      const duration = payment.transaction.whatsappTransaction.duration;
      const price = duration === 'year' ? whatsappPkg.priceYear : whatsappPkg.priceMonth;
      
      items.push({
        type: 'whatsapp_service',
        name: whatsappPkg.name,
        duration: duration,
        price: price,
        priceMonth: whatsappPkg.priceMonth,
        priceYear: whatsappPkg.priceYear,
      });    }

    // NEW ACTIVATION LOGIC: Auto-activate services when payment is paid and transaction is in-progress
    let servicesActivated = false;
    
    if (payment.status === 'paid' && payment.transaction?.status === 'in_progress') {
      try {
        // Get full transaction details for activation
        const fullTransaction = await prisma.transaction.findUnique({
          where: { id: payment.transaction.id },          include: {
            whatsappTransaction: {
              include: { whatsappPackage: true }
            },
            productTransactions: {
              include: { package: true }
            },
            addonTransactions: {
              include: { addon: true }
            }
          }
        });

        if (fullTransaction) {
          // Use manual activation method which respects lock mechanism
          const activationResult = await PaymentExpirationService.activateServicesAfterPaymentUpdate(fullTransaction.id);
          if (activationResult.success) {
            servicesActivated = true;
            console.log(`[PAYMENT_DETAILS_ACTIVATION] Successfully activated services for payment ${payment.id}`);
          } else {
            console.log(`[PAYMENT_DETAILS_ACTIVATION] ${activationResult.reason || 'Failed to activate services'} for payment ${payment.id}`);
          }
        }
      } catch (error) {
        console.error(`[PAYMENT_DETAILS_ACTIVATION] Error during activation for payment ${payment.id}:`, error);
      }
    }

    const response = {
      success: true,
      data: {        payment: {
          id: payment.id,
          transactionId: payment.transactionId,
          amount: Number(payment.amount),
          method: payment.method,
          status: payment.status,
          paymentUrl: payment.paymentUrl,
          externalId: payment.externalId,
          createdAt: payment.createdAt,
          expiresAt: payment.expiresAt,
          instructions: paymentInstructions.instructions,
          paymentDetails: paymentInstructions.additionalInfo,
          uniqueCode: uniqueCode,
          paymentInstructions: serviceFeeInfo?.instructions || "",
          instructionType: serviceFeeInfo?.instructionType || "text",
          instructionImageUrl: serviceFeeInfo?.instructionImageUrl || null,
        },
        transaction: {
          id: payment.transaction?.id,
          currency: payment.transaction?.currency,
          status: payment.transaction?.status,
          type: transactionType,
          notes: payment.transaction?.notes,
          expiresAt: payment.transaction?.expiresAt,
        },
        pricing: {
          subtotal: Number(payment.transaction?.originalAmount || payment.transaction?.amount || 0),
          discountAmount: Number(payment.transaction?.discountAmount || 0),
          totalAfterDiscount: Number(payment.transaction?.totalAfterDiscount || payment.transaction?.originalAmount || payment.transaction?.amount || 0),
          serviceFee: serviceFeeInfo ? {
            paymentMethod: payment.method,
            method: serviceFeeInfo.feeType || payment.method,
            type: serviceFeeInfo.feeType || "fixed_amount",
            value: Number(serviceFeeInfo.feeValue || 0),
            amount: Number(payment.serviceFee || 0),
            currency: payment.transaction?.currency || 'idr',
            description: serviceFeeInfo.feeType === 'percentage' 
              ? `${Number(serviceFeeInfo.feeValue || 0)}% fee` 
              : `Fixed fee ${(payment.transaction?.currency || 'idr').toUpperCase()} ${Number(serviceFeeInfo.feeValue || 0).toLocaleString()}`
          } : null,
          finalAmount: Number(payment.amount),
          currency: payment.transaction?.currency || 'idr',
        },
        items: items,        voucher: payment.transaction?.voucher ? {
          code: payment.transaction.voucher.code,
          name: payment.transaction.voucher.name,
          discountAmount: Number(payment.transaction.discountAmount || 0),
        } : null,
        
        // Expiration info
        expirationInfo: {
          paymentExpiresAt: payment.expiresAt,
          transactionExpiresAt: payment.transaction?.expiresAt,
          paymentTimeRemaining: payment.expiresAt ? Math.max(0, Math.floor((new Date(payment.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60))) + " hours" : null,
          transactionTimeRemaining: payment.transaction?.expiresAt ? Math.max(0, Math.floor((new Date(payment.transaction.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + " days" : null,
          isPaymentExpired: payment.expiresAt ? new Date() > new Date(payment.expiresAt) : false,
          isTransactionExpired: payment.transaction?.expiresAt ? new Date() > new Date(payment.transaction.expiresAt) : false
        },
        
        // Legacy fields for backward compatibility
        instructions: paymentInstructions.instructions,
        additionalInfo: paymentInstructions.additionalInfo,
        bankDetails: bankDetails,
        serviceFeeInfo: serviceFeeInfo,
        uniqueCode: uniqueCode,        statusInfo: {
          isPending: payment.status === 'pending',
          isCompleted: payment.status === 'paid',
          isFailed: payment.status === 'failed',
          isCancelled: payment.status === 'cancelled',
          canCancel: payment.status === 'pending',
          nextAction: payment.status === 'pending' ? 'Complete payment using the instructions above' : null
        },
          // Add service activation info for relevant transaction types
        ...(transactionType === 'whatsapp_service' || 
            transactionType === 'package_and_whatsapp' || 
            transactionType === 'addon_and_whatsapp' || 
            transactionType === 'package_addon_whatsapp' ||
            transactionType === 'package' ||
            transactionType === 'addon' ||
            transactionType === 'package_and_addon' ? {
          activationInfo: {
            activated: servicesActivated,
            message: servicesActivated 
              ? 'Your services have been activated successfully!' 
              : payment.status === 'paid' && payment.transaction?.status === 'in_progress'
                ? 'Service activation in progress...' 
                : 'Services will be activated once payment is completed'
          }
        } : {}),
      },
      message: "Payment details retrieved successfully."
    };

    return createCorsResponse(response, {}, request);

  } catch (error) {
    console.error('Error fetching payment details:', error);
    return createCorsResponse(
      { success: false, error: "Internal server error" },
      { status: 500 },
      request
    );
  }
}
