import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { PaymentExpirationService } from "@/lib/payment-expiration";

// Function to activate WhatsApp service after successful payment
async function activateWhatsAppService(transaction: any) {
  if (transaction.type !== 'whatsapp_service' || !transaction.whatsappTransaction?.whatsappPackageId) {
    return { success: false, reason: 'Not a WhatsApp service transaction' };
  }

  // Check if this WhatsApp transaction has already been success
  if (transaction.whatsappTransaction.status === 'success') {
    console.log(`[STATUS_ACTIVATION] Transaction ${transaction.id} already success, skipping`);
    return { success: true, reason: 'Already success' };
  }

  const duration = transaction.whatsappTransaction.duration;
  const packageId = transaction.whatsappTransaction.whatsappPackageId;
  const userId = transaction.userId;

  try {    // Check if user already has an active subscription for this package
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
      console.log(`[STATUS_ACTIVATION] User ${userId} has active subscription until ${existingService.expiredAt}, extending duration`);
      
      newExpiredAt = new Date(existingService.expiredAt);
      if (duration === 'year') {
        newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
      } else {
        newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
      }      // Update existing service
      await prisma.servicesWhatsappCustomers.update({
        where: { id: existingService.id },
        data: { expiredAt: newExpiredAt },
      });

      console.log(`[STATUS_ACTIVATION] Extended subscription for user ${userId} until ${newExpiredAt}`);
    } else {
      // No active subscription or expired - create new or update with new expiry
      newExpiredAt = new Date();
      if (duration === 'year') {
        newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
      } else {
        newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
      }

      if (existingService) {        // Update expired service
        await prisma.servicesWhatsappCustomers.update({
          where: { id: existingService.id },
          data: { 
            expiredAt: newExpiredAt,
            status: 'active',
            activatedAt: new Date()
          },
        });
        console.log(`[STATUS_ACTIVATION] Renewed expired subscription for user ${userId} until ${newExpiredAt}`);
      } else {        // Create new service
        await prisma.servicesWhatsappCustomers.create({
          data: {
            transactionId: transaction.id,
            customerId: userId,
            packageId: packageId,
            expiredAt: newExpiredAt,
            status: 'active',
            activatedAt: new Date()
          },
        });
        console.log(`[STATUS_ACTIVATION] Created new subscription for user ${userId} until ${newExpiredAt}`);
      }    }

    // Mark WhatsApp transaction as success
    await prisma.transactionWhatsappService.update({
      where: { id: transaction.whatsappTransaction.id },
      data: { 
        status: 'success',
        startDate: now,
        endDate: newExpiredAt,
      },
    });

    console.log(`[STATUS_ACTIVATION] Marked transaction ${transaction.id} as success`);

    // Get package details for logging
    const packageDetails = existingService?.package || await prisma.whatsappApiPackage.findUnique({
      where: { id: packageId },
    });

    if (packageDetails) {
      console.log(`[STATUS_ACTIVATION] User ${userId} now has access to WhatsApp API with max ${packageDetails.maxSession} sessions until ${newExpiredAt}`);
    }

    return { 
      success: true, 
      userId, 
      packageId, 
      expiredAt: newExpiredAt,
      action: existingService && existingService.expiredAt > now ? 'extended' : 
              existingService ? 'renewed' : 'created'    };  } catch (error) {
    console.error(`[STATUS_ACTIVATION_ERROR] Failed to activate service for user ${userId}:`, error);
    
    // Mark WhatsApp transaction as failed
    try {
      await prisma.transactionWhatsappService.update({
        where: { id: transaction.whatsappTransaction.id },
        data: { status: 'failed' },
      });
    } catch (updateError) {
      console.error('[STATUS_ACTIVATION] Failed to mark transaction as failed:', updateError);
    }
    
    return { success: false, reason: 'Database error', error: error instanceof Error ? error.message : String(error) };
  }
}

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
  
  // Fallback to default bank details
  return {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "1234567890",
    accountName: "PT Genfity Indonesia",
    swiftCode: currency === 'usd' ? 'CENAIDJA' : undefined,
    currency: currency
  };
}

// Generate payment instructions based on method and amount
function generatePaymentInstructions(method: string, amount: number, currency: string, paymentId: string, bankDetails?: any) {
  const currencySymbol = currency === 'idr' ? 'Rp' : '$';
  const formattedAmount = currency === 'idr' 
    ? `Rp ${amount.toLocaleString('id-ID')}`
    : `$${amount.toFixed(2)}`;
  
  let instructions = '';
  let additionalInfo = {};
  
  switch (method.toLowerCase()) {
    case 'manual_bank_transfer':
    case 'bank_transfer':
      instructions = `Please transfer exactly ${formattedAmount} to our bank account.`;
      additionalInfo = {
        bankDetails: bankDetails,
        note: "Manual verification required. Processing time: 1-24 hours.",
        steps: [
          "Open your banking app or visit the bank",
          `Transfer ${formattedAmount} to the account details below`,
          "Keep your transfer receipt for verification",
          "Payment will be confirmed within 1-24 hours"
        ]
      };
      break;
      
    case 'qris':
      instructions = `Scan the QR code using any e-wallet app (GoPay, OVO, DANA, etc.) to pay ${formattedAmount}.`;
      additionalInfo = {
        supportedApps: ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'],
        note: "QR code valid for 15 minutes",
        steps: [
          "Open your e-wallet app",
          "Select 'Scan QR' or 'QRIS'",
          "Scan the QR code provided",
          `Confirm payment of ${formattedAmount}`,
          "Complete payment in your app"
        ]
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
        note: "You will be redirected to the app to complete payment",
        steps: [
          `Open your ${walletName} app`,
          "Check for payment notification",
          `Confirm payment of ${formattedAmount}`,
          "Complete payment authorization",
          "Return to our app after completion"
        ]
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

// GET /api/customer/payment/status/[paymentId] - Get payment status with instructions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Auto-expire this specific payment and its transaction
    await PaymentExpirationService.autoExpireOnApiCall(undefined, paymentId);

    // Allow public access - no authentication required for status checking
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
      },
      include: {
        transaction: {
          include: {
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
                },
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
    );    // AUTO-ACTIVATION LOGIC: Only run once when payment is paid and transaction is in_progress
    let servicesActivated = false;
    
    if (payment.status === 'paid' && payment.transaction?.status === 'in_progress') {
      try {
        // Check if services have already been activated by looking for delivery records
        const existingProductRecord = await prisma.servicesProductCustomers.findFirst({
          where: { transactionId: payment.transaction.id }
        });
        
        const existingAddonRecord = await prisma.servicesAddonsCustomers.findFirst({
          where: { transactionId: payment.transaction.id }
        });

        const existingWhatsappRecord = await prisma.servicesWhatsappCustomers.findFirst({
          where: { transactionId: payment.transaction.id }
        });

        // Only auto-activate if services haven't been activated yet
        const hasProductTx = payment.transaction.productTransactions && payment.transaction.productTransactions.length > 0;
        const hasAddonTx = payment.transaction.addonTransactions && payment.transaction.addonTransactions.length > 0;
        const hasWhatsappTx = payment.transaction.whatsappTransaction;

        const needsProductActivation = hasProductTx && !existingProductRecord;
        const needsAddonActivation = hasAddonTx && !existingAddonRecord;
        const needsWhatsappActivation = hasWhatsappTx && !existingWhatsappRecord;

        if (needsProductActivation || needsAddonActivation || needsWhatsappActivation) {
          // Get full transaction details for activation
          const fullTransaction = await prisma.transaction.findUnique({
            where: { id: payment.transaction.id },
            include: {
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
              console.log(`[STATUS_CHECK_ACTIVATION] Successfully activated services for payment ${payment.id}`);
            } else {
              console.log(`[STATUS_CHECK_ACTIVATION] ${activationResult.reason || 'Failed to activate services'} for payment ${payment.id}`);
            }
          }
        } else {
          console.log(`[STATUS_CHECK_ACTIVATION] Services already activated for payment ${payment.id}, skipping`);
        }
      } catch (error) {
        console.error(`[STATUS_CHECK_ACTIVATION] Error during activation for payment ${payment.id}:`, error);
      }
    }// Calculate pricing information
    const calculatePrice = (priceIdr: number | undefined, priceUsd: number | undefined, currency: string) => {
      if (currency === 'usd') {
        return Number(priceUsd || 0);
      }
      return Number(priceIdr || 0);
    };

    // Calculate unique code for manual payments
    // uniqueCode = total payment - (biaya product/whatsapp - voucher + payment fee)
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
    }

    // Format transaction items with prices
    const items = [];
      // Add product packages/addons
    if (payment.transaction?.productTransactions && payment.transaction.productTransactions.length > 0) {
      payment.transaction.productTransactions.forEach(productTx => {        if (productTx.package) {
          const price = calculatePrice(Number(productTx.package.price_idr), Number(productTx.package.price_usd), payment.transaction!.currency);
          const quantity = productTx.quantity || 1;
          
          items.push({
            type: 'package',
            name: productTx.package.name_en,
            category: productTx.package.category?.name_en,
            subcategory: productTx.package.subcategory?.name_en,
            price: price,
            quantity: quantity,
            totalPrice: price * quantity,
            originalPriceIdr: Number(productTx.package.price_idr),
            originalPriceUsd: Number(productTx.package.price_usd),
          });
        }
      });
    }
    
    // Add add-ons from addonTransactions
    if (payment.transaction?.addonTransactions) {
      payment.transaction.addonTransactions.forEach(addonTx => {        const addon = addonTx.addon;
        const price = calculatePrice(Number(addon.price_idr), Number(addon.price_usd), payment.transaction!.currency);
        const quantity = addonTx.quantity;
        
        items.push({
          type: 'addon',
          name: addon.name_en,
          category: addon.category?.name_en,
          price: price,
          quantity: quantity,
          totalPrice: price * quantity,
          originalPriceIdr: Number(addon.price_idr),
          originalPriceUsd: Number(addon.price_usd),
        });
      });
    }
    
    // Add WhatsApp services
    if (payment.transaction?.whatsappTransaction?.whatsappPackage) {      const whatsappPkg = payment.transaction.whatsappTransaction.whatsappPackage;
      const duration = payment.transaction.whatsappTransaction.duration;
      const price = duration === 'year' ? whatsappPkg.priceYear : whatsappPkg.priceMonth;
      const quantity = 1; // WhatsApp services are single quantity
      
      items.push({
        type: 'whatsapp_service',
        name: whatsappPkg.name,
        duration: duration,
        price: price,
        quantity: quantity,
        totalPrice: price * quantity,
        priceMonth: whatsappPkg.priceMonth,
        priceYear: whatsappPkg.priceYear,
      });}    // Calculate total price of all items (individual item price * quantity)
    const totalPrice = items.reduce((total, item) => {
      const itemPrice = Number(item.price || 0);
      // WhatsApp services don't have quantity property, default to 1
      const itemQuantity = 'quantity' in item ? Number(item.quantity || 1) : 1;
      return total + (itemPrice * itemQuantity);
    }, 0);

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
          currency: payment.transaction?.currency || 'idr',        },
        items: items,
        voucher: payment.transaction?.voucher ? {
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
        },        // Add service activation info for relevant transaction types
        ...(transactionType === 'whatsapp_service' || 
            transactionType === 'package_and_whatsapp' || 
            transactionType === 'addon_and_whatsapp' || 
            transactionType === 'package_addon_whatsapp' ||
            transactionType === 'package' ||
            transactionType === 'addon' ||
            transactionType === 'package_and_addon' ? {
          subscriptionInfo: {
            activated: servicesActivated,
            message: servicesActivated 
              ? 'Your services have been activated successfully!' 
              : payment.status === 'paid' && payment.transaction?.status === 'in_progress'
                ? 'Service activation in progress...' 
                : 'Services will be activated once payment is completed'
          }
        } : {})
      },
      message: "Status and payment instructions retrieved successfully."
    };

    return createCorsResponse(response, {}, request);

  } catch (error) {
    console.error('Error fetching payment status:', error);
    return createCorsResponse(
      { success: false, error: "Internal server error" },
      { status: 500 },
      request
    );
  }
}
