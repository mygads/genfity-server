import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import jwt from 'jsonwebtoken';
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { z } from "zod";

// Helper function to verify admin JWT token
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

const approvePaymentSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminNotes: z.string().optional(),
});

// PATCH /api/admin/payments/[id] - Approve or reject manual payment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const { id } = await params;
    const body = await request.json();
    const validation = approvePaymentSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { action, adminNotes } = validation.data;    // Get payment with transaction details
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            whatsappTransaction: {
              include: {
                whatsappPackage: true,
              },
            },            productTransactions: {
              include: {
                package: true,
              },
            },
            addonTransactions: {
              include: {
                addon: true,
              },
            },
          }
        }
      }
    });if (!payment) {
      return withCORS(NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      ));
    }

    if (!payment.transaction) {
      return withCORS(NextResponse.json(
        { success: false, error: "Transaction not found for this payment" },
        { status: 404 }
      ));
    }

    // Check if payment can be approved/rejected
    if (payment.status !== 'pending') {
      return withCORS(NextResponse.json(
        { success: false, error: `Payment is already ${payment.status}` },
        { status: 400 }
      ));
    }    // Check if payment method requires manual approval
    if (!(payment.method.includes('manual') || payment.method.includes('bank_transfer'))) {
      return withCORS(NextResponse.json(
        { success: false, error: "This payment method does not require manual approval" },
        { status: 400 }
      ));
    }    const newStatus = action === 'approve' ? 'paid' : 'failed';

    // Use PaymentExpirationService to update payment status with proper sync
    const updatedPayment = await PaymentExpirationService.updatePaymentStatus(
      id,
      newStatus,
      adminNotes,
      adminUser.id
    );

    // Log admin action for audit
    console.log(`[ADMIN_PAYMENT_${action.toUpperCase()}] Payment ${id} ${action}ed by admin ${adminUser.email}`, {
      paymentId: id,
      transactionId: payment.transaction.id,
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action,      
      adminNotes,
      userId: payment.transaction.user?.id || null,
      amount: Number(payment.amount),
      method: payment.method,
    });

    // Get updated transaction info
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: payment.transaction.id },
      include: {
        whatsappTransaction: {
          include: {
            whatsappPackage: true,
          },
        },
      }
    });

    // Manually activate services after payment update is complete (prevents double activation)
    if (action === 'approve' && updatedTransaction?.status === 'in_progress') {
      // Use async activation to prevent blocking the response
      setImmediate(async () => {
        try {
          const activationResult = await PaymentExpirationService.activateServicesAfterPaymentUpdate(updatedTransaction.id);
          console.log(`[STATUS_CHECK_ACTIVATION] ${activationResult.success ? 'Successfully activated' : 'Failed to activate'} services for payment ${id}`, activationResult);
        } catch (error) {
          console.error(`[STATUS_CHECK_ACTIVATION] Error activating services for payment ${id}:`, error);
        }
      });
    }    return withCORS(NextResponse.json({
      success: true,
      data: {
        payment: {
          id: updatedPayment.id,
          status: updatedPayment.status,
          paymentDate: updatedPayment.paymentDate,
          method: payment.method,
          amount: Number(payment.amount),
          expiresAt: updatedPayment.expiresAt,
          updatedAt: updatedPayment.updatedAt,
        },
        transaction: {
          id: updatedTransaction?.id,
          status: updatedTransaction?.status,
          expiresAt: updatedTransaction?.expiresAt,
        },
        adminAction: {
          action,
          adminNotes,
          processedBy: adminUser.email,
          processedAt: new Date(),
        }
      },
      message: `Payment ${action}ed successfully`
    }));

  } catch (error) {
    console.error("[ADMIN_PAYMENT_APPROVE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to process payment action" },
      { status: 500 }
    ));
  }
}

// GET /api/admin/payments/[id] - Get single payment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },            productTransactions: {
              include: {
                package: {
                  select: { id: true, name_en: true, name_id: true, price_idr: true, price_usd: true }
                }
              }
            },
            addonTransactions: {
              include: {
                addon: {
                  select: { id: true, name_en: true, name_id: true, price_idr: true, price_usd: true }
                }
              }
            },
            whatsappTransaction: {
              include: {
                whatsappPackage: {
                  select: { id: true, name: true, priceMonth: true, priceYear: true }
                }
              }
            },
            voucher: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
                value: true,
              }
            }
          }
        }
      }
    });    if (!payment) {
      return withCORS(NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      ));
    }

    if (!payment.transaction) {
      return withCORS(NextResponse.json(
        { success: false, error: "Transaction not found for this payment" },
        { status: 404 }
      ));
    }    // Transform payment data with detailed information
    const paymentDetails = {
      id: payment.id,
      amount: Number(payment.amount),
      serviceFee: Number(payment.serviceFee || 0),
      method: payment.method,
      status: payment.status,
      externalId: payment.externalId,
      paymentUrl: payment.paymentUrl,
      createdAt: payment.createdAt,
      paymentDate: payment.paymentDate,
      updatedAt: payment.updatedAt,
      expiresAt: payment.expiresAt,        transaction: {
        id: payment.transaction.id,
        currency: payment.transaction.currency,
        status: payment.transaction.status,
        type: getActualTransactionType(payment.transaction), // Use corrected transaction type
        originalType: payment.transaction.type, // Keep original type for reference
        amount: Number(payment.transaction.amount),
        originalAmount: Number(payment.transaction.originalAmount || 0),
        discountAmount: Number(payment.transaction.discountAmount || 0),
        serviceFeeAmount: Number(payment.transaction.serviceFeeAmount || 0),
        finalAmount: Number(payment.transaction.finalAmount || 0),
        transactionDate: payment.transaction.transactionDate,
        expiresAt: payment.transaction.expiresAt,
        user: payment.transaction.user || null,
        voucher: payment.transaction.voucher,
        items: getTransactionItems(payment.transaction),
      },
      
      // Expiration info
      expirationInfo: {
        paymentExpiresAt: payment.expiresAt,
        transactionExpiresAt: payment.transaction.expiresAt,
        paymentTimeRemaining: payment.expiresAt ? Math.max(0, Math.floor((new Date(payment.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60))) + " hours" : null,
        transactionTimeRemaining: payment.transaction.expiresAt ? Math.max(0, Math.floor((new Date(payment.transaction.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + " days" : null,
        isPaymentExpired: payment.expiresAt ? new Date() > new Date(payment.expiresAt) : false,
        isTransactionExpired: payment.transaction.expiresAt ? new Date() > new Date(payment.transaction.expiresAt) : false
      },
      
      adminActions: {
        canApprove: payment.status === 'pending' && (payment.method.includes('manual') || payment.method.includes('bank_transfer')),
        needsManualApproval: (payment.method.includes('manual') || payment.method.includes('bank_transfer')) && payment.status === 'pending',
        requiresAdminReview: payment.status === 'pending',
      },

      paymentInstructions: getPaymentInstructions(payment.method, payment.transaction.currency),
    };

    return withCORS(NextResponse.json({
      success: true,
      data: paymentDetails
    }));

  } catch (error) {
    console.error("[ADMIN_PAYMENT_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch payment details" },
      { status: 500 }
    ));
  }
}

// Helper function to get payment instructions
function getPaymentInstructions(method: string, currency: string) {
  const currencySymbol = currency === 'idr' ? 'Rp' : '$';
  
  switch (method) {
    case 'manual_bank_transfer':
      return {
        type: 'manual_bank_transfer',
        description: 'Manual bank transfer - requires customer to transfer funds',
        instructions: [
          'Customer opens their banking app or visits the bank',
          'Customer transfers exact amount to provided bank account',
          'Customer keeps transfer receipt for verification',
          'Admin reviews and verifies the payment manually',
          'Payment status updated to approved/rejected by admin'
        ],
        processingTime: '1-24 hours',
        requiresManualApproval: true,
        note: 'Payment includes unique code for identification'
      };

    case 'qris':
      return {
        type: 'qris',
        description: 'QRIS payment - usually automatic verification',
        instructions: [
          'Customer scans QR code with e-wallet app',
          'Customer confirms payment amount',
          'Payment processed automatically',
          'Status updated in real-time'
        ],
        processingTime: 'Instant',
        requiresManualApproval: false,
        supportedApps: ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja']
      };
      
    default:
      return {
        type: 'automatic',
        description: 'Automatic payment gateway verification',
        instructions: [
          'Payment processed through secure gateway',
          'Customer completes payment on provider platform',
          'Payment status updated automatically',
          'Confirmation sent immediately'
        ],
        processingTime: 'Instant',
        requiresManualApproval: false
      };
  }
}

// Helper function to extract transaction items (same as in main route)
function getTransactionItems(transaction: any) {
  const items = [];
    // Handle multiple products
  if (transaction.productTransactions && transaction.productTransactions.length > 0) {
    transaction.productTransactions.forEach((productTx: any) => {
      if (productTx.package) {
        items.push({
          type: 'package',
          name: productTx.package.name_en,
          category: 'Product Package',
          price_idr: Number(productTx.package.price_idr || 0),
          price_usd: Number(productTx.package.price_usd || 0),
          quantity: productTx.quantity || 1,
        });
      }
    });
  }
  
  // Add add-ons from addonTransactions
  if (transaction.addonTransactions && transaction.addonTransactions.length > 0) {
    transaction.addonTransactions.forEach((addonTx: any) => {
      items.push({
        type: 'addon',
        name: addonTx.addon.name_en,
        category: 'Product Addon',
        price_idr: Number(addonTx.addon.price_idr || 0),
        price_usd: Number(addonTx.addon.price_usd || 0),
        quantity: addonTx.quantity || 1,
      });
    });
  }
  
  // Add WhatsApp services with proper pricing
  if (transaction.whatsappTransaction?.whatsappPackage) {
    const whatsappPackage = transaction.whatsappTransaction.whatsappPackage;
    const duration = transaction.whatsappTransaction.duration;
    
    // Get pricing based on duration
    let price_idr = 0;
    if (duration === 'month') {
      price_idr = Number(whatsappPackage.priceMonth || 0);
    } else if (duration === 'year') {
      price_idr = Number(whatsappPackage.priceYear || 0);
    }
    
    items.push({
      type: 'whatsapp_service',
      name: whatsappPackage.name,
      category: 'WhatsApp Service',
      price_idr: price_idr,
      price_usd: 0, // WhatsApp services are IDR only
      quantity: 1,
      duration: duration,
    });
  }
  
  return items;
}

// Helper function to determine actual transaction type based on items
function getActualTransactionType(transaction: any) {
  const hasProducts = transaction.productTransactions && transaction.productTransactions.length > 0;
  const hasAddons = transaction.addonTransactions && transaction.addonTransactions.length > 0;
  const hasWhatsapp = transaction.whatsappTransaction && transaction.whatsappTransaction.whatsappPackage;
    
  // Determine transaction type based on all possible combinations
  if (hasProducts && hasAddons && hasWhatsapp) {
    return 'package_addon_whatsapp';
  } else if (hasProducts && hasAddons && !hasWhatsapp) {
    return 'package_and_addon';
  } else if (hasProducts && !hasAddons && hasWhatsapp) {
    return 'package_and_whatsapp';
  } else if (!hasProducts && hasAddons && hasWhatsapp) {
    return 'addon_and_whatsapp';
  } else if (hasProducts && !hasAddons && !hasWhatsapp) {
    return 'package';
  } else if (!hasProducts && hasAddons && !hasWhatsapp) {
    return 'addon';
  } else if (!hasProducts && !hasAddons && hasWhatsapp) {
    return 'whatsapp_service';
  } else {
    return transaction.type || 'unknown'; // Fallback to original type
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
