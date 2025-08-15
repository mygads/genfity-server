import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * UNIFIED CHECKOUT API
 * 
 * This is the main checkout endpoint that handles all product types:
 * - Packages (digital products)
 * - Addons (additional services)
 * - WhatsApp API services
 * 
 * Flow:
 * 1. Customer selects products/services
 * 2. POST /api/customer/checkout (creates transaction with 'created' status)
 * 3. Returns transaction ID, pricing breakdown, and service fee previews
 * 4. Customer selects payment method
 * 5. POST /api/customer/payment/create (creates payment with selected method)
 * 6. Customer completes payment through gateway
 * 7. Payment status updates automatically via webhooks or manual verification
 * 8. For WhatsApp services: Multiple transactions are allowed - completed payments will extend service duration
 */

// Unified validation schema for comprehensive checkout
const checkoutSchema = z.object({
  // Support for items array (simple format) OR detailed format
  items: z.array(z.object({
    productId: z.string().cuid(),
    type: z.enum(['package', 'addon']),
    quantity: z.number().min(1).default(1),
  })).optional(),
  
  // Detailed format for specific product types
  packages: z.array(z.object({
    id: z.string().cuid(),
    quantity: z.number().min(1).default(1),
  })).optional().default([]),
  addons: z.array(z.object({
    id: z.string().cuid(),
    quantity: z.number().min(1).default(1),
  })).optional().default([]),
  whatsapp: z.array(z.object({
    packageId: z.string().cuid(),
    duration: z.enum(['month', 'year']),
    // WhatsApp always has quantity 1 and only 1 item allowed
  })).max(1, "Only 1 WhatsApp service allowed per transaction").optional().default([]),
  
  currency: z.enum(['idr', 'usd']).default('idr'),
  referenceLink: z.string().url().optional(),
  voucherCode: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

// Function to calculate pricing based on currency
function calculatePrice(priceIdr: number, priceUsd: number, currency: 'idr' | 'usd'): number {
  return currency === 'idr' ? priceIdr : priceUsd;
}

// Function to calculate service fee preview
function calculateServiceFeePreview(amount: number, serviceFees: any[]): any[] {
  return serviceFees.map(fee => {
    let feeAmount = 0;
    
    if (fee.type === 'percentage') {
      feeAmount = amount * (Number(fee.value) / 100);
      if (fee.minFee && feeAmount < Number(fee.minFee)) {
        feeAmount = Number(fee.minFee);
      }
      if (fee.maxFee && feeAmount > Number(fee.maxFee)) {
        feeAmount = Number(fee.maxFee);
      }
    } else {
      feeAmount = Number(fee.value);
    }

    return {
      paymentMethod: fee.paymentMethod,
      name: fee.name,
      type: fee.type,
      value: Number(fee.value),
      feeAmount: Math.round(feeAmount * 100) / 100,
      totalWithFee: Math.round((amount + feeAmount) * 100) / 100,
    };
  });
}

// POST /api/customer/checkout - Unified checkout for all product types
export async function POST(request: NextRequest) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required. Please login first." },
        { status: 401 }
      ));
    }

    // Auto-expire any existing payments/transactions for this user
    await PaymentExpirationService.autoExpireOnApiCall();

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { items, packages, addons, whatsapp, currency, referenceLink, voucherCode, notes } = validation.data;    // Convert items array to packages/addons format if provided
    const allPackages = [...packages];
    const allAddons = [...addons];
    
    if (items && items.length > 0) {
      items.forEach(item => {
        if (item.type === 'package') {
          allPackages.push({ id: item.productId, quantity: item.quantity });
        } else if (item.type === 'addon') {
          allAddons.push({ id: item.productId, quantity: item.quantity });
        }
      });
    }    // Validate that at least one item is selected
    if (allPackages.length === 0 && allAddons.length === 0 && whatsapp.length === 0) {
      return withCORS(NextResponse.json(
        { success: false, error: "At least one product, addon, or WhatsApp service must be selected" },
        { status: 400 }
      ));
    }

    // Allow multiple WhatsApp transactions - service extensions will be handled automatically
    // When payment is completed, the system will extend the existing subscription duration
    if (whatsapp.length > 0) {
      console.log(`[CHECKOUT] User ${userAuth.id} creating WhatsApp service transaction. Multiple transactions allowed for service extension.`);
    }

    // Process transaction in database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch and validate products
      const orderItems = [];
      let subtotal = new Decimal(0);

      // Process packages
      for (const pkg of allPackages) {
        const product = await tx.package.findUnique({
          where: { id: pkg.id },
          include: {
            category: true,
            subcategory: true,
            features: true,
          }
        });

        if (!product) {
          throw new Error(`Package with ID ${pkg.id} not found`);
        }

        const price = calculatePrice(Number(product.price_idr), Number(product.price_usd), currency);
        const itemTotal = price * pkg.quantity;
        subtotal = subtotal.add(itemTotal);

        orderItems.push({
          id: product.id,
          type: 'package',
          name: currency === 'idr' ? product.name_id : product.name_en,
          description: currency === 'idr' ? product.description_id : product.description_en,
          price: price,
          quantity: pkg.quantity,
          total: itemTotal,
          currency: currency,
          category: {
            id: product.category.id,
            name: currency === 'idr' ? product.category.name_id : product.category.name_en,
          },
          subcategory: {
            id: product.subcategory.id,
            name: currency === 'idr' ? product.subcategory.name_id : product.subcategory.name_en,
          },
          features: product.features?.map(f => ({
            name: currency === 'idr' ? f.name_id : f.name_en,
            included: f.included
          })) || [],
        });
      }

      // Process addons
      for (const addon of allAddons) {
        const product = await tx.addon.findUnique({
          where: { id: addon.id },
          include: {
            category: true,
          }
        });

        if (!product) {
          throw new Error(`Addon with ID ${addon.id} not found`);
        }

        const price = calculatePrice(Number(product.price_idr), Number(product.price_usd), currency);
        const itemTotal = price * addon.quantity;
        subtotal = subtotal.add(itemTotal);

        orderItems.push({
          id: product.id,
          type: 'addon',
          name: currency === 'idr' ? product.name_id : product.name_en,
          description: currency === 'idr' ? product.description_id : product.description_en,
          price: price,
          quantity: addon.quantity,
          total: itemTotal,
          currency: currency,
          category: {
            id: product.category.id,
            name: currency === 'idr' ? product.category.name_id : product.category.name_en,
          },
        });
      }      // Process WhatsApp services
      for (const wa of whatsapp) {
        const whatsappPackage = await tx.whatsappApiPackage.findUnique({
          where: { id: wa.packageId }
        });

        if (!whatsappPackage) {
          throw new Error(`WhatsApp package with ID ${wa.packageId} not found`);
        }

        const price = wa.duration === 'month' ? whatsappPackage.priceMonth : whatsappPackage.priceYear;
        subtotal = subtotal.add(price);

        orderItems.push({
          id: whatsappPackage.id,
          type: 'whatsapp',
          name: whatsappPackage.name,
          description: whatsappPackage.description,
          price: price,
          quantity: 1, // WhatsApp always quantity 1
          total: price,
          currency: 'idr', // WhatsApp services are IDR only
          duration: wa.duration,
        });
      }

      // 2. Process voucher if provided
      let voucher = null;
      let discountAmount = new Decimal(0);

      if (voucherCode) {
        voucher = await tx.voucher.findUnique({
          where: { code: voucherCode, isActive: true }
        });

        if (!voucher) {
          throw new Error("Invalid or inactive voucher code");
        }

        // Check voucher validity
        const now = new Date();
        if (voucher.startDate > now || (voucher.endDate && voucher.endDate < now)) {
          throw new Error("Voucher is not valid at this time");
        }

        // Check usage limit
        if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
          throw new Error("Voucher usage limit exceeded");
        }

        // Check minimum amount
        if (voucher.minAmount && subtotal.lt(voucher.minAmount)) {
          throw new Error(`Minimum order amount for this voucher is ${voucher.minAmount}`);
        }        // Calculate discount based on voucher type (percentage vs fixed_amount)
        // Handle both correct and swapped field scenarios
        let calculationType = voucher.type;
        
        // If type is not a calculation type, check if discountType contains the calculation type
        if (voucher.type !== 'percentage' && voucher.type !== 'fixed_amount') {
          if (voucher.discountType === 'percentage' || voucher.discountType === 'fixed_amount') {
            calculationType = voucher.discountType;
          } else {
            // Default to fixed_amount if neither field contains a valid calculation type
            calculationType = 'fixed_amount';
          }
        }
        
        if (calculationType === 'percentage') {
          discountAmount = subtotal.mul(Number(voucher.value)).div(100);
          if (voucher.maxDiscount && discountAmount.gt(Number(voucher.maxDiscount))) {
            discountAmount = new Decimal(Number(voucher.maxDiscount));
          }
        } else {
          discountAmount = new Decimal(Number(voucher.value));
        }

        // Ensure discount doesn't exceed subtotal
        if (discountAmount.gt(subtotal)) {
          discountAmount = subtotal;
        }
      }

      const totalAfterDiscount = subtotal.sub(discountAmount);      // 3. Get all available service fees for preview for the specified currency
      const serviceFees = await tx.serviceFee.findMany({
        where: { 
          isActive: true,
          currency: currency 
        },
        orderBy: { paymentMethod: 'asc' }
      });

      const serviceFeePreviews = calculateServiceFeePreview(Number(totalAfterDiscount), serviceFees);      // 4. Determine transaction type based on included items
      let transactionType = 'unknown';
      const hasPackages = allPackages.length > 0;
      const hasAddons = allAddons.length > 0;
      const hasWhatsapp = whatsapp.length > 0;
      
      // Determine transaction type based on all possible combinations
      if (hasPackages && hasAddons && hasWhatsapp) {
        transactionType = 'package_addon_whatsapp';
      } else if (hasPackages && hasAddons && !hasWhatsapp) {
        transactionType = 'package_and_addon';
      } else if (hasPackages && !hasAddons && hasWhatsapp) {
        transactionType = 'package_and_whatsapp';
      } else if (!hasPackages && hasAddons && hasWhatsapp) {
        transactionType = 'addon_and_whatsapp';
      } else if (hasPackages && !hasAddons && !hasWhatsapp) {
        transactionType = 'package';
      } else if (!hasPackages && hasAddons && !hasWhatsapp) {
        transactionType = 'addon';
      } else if (!hasPackages && !hasAddons && hasWhatsapp) {
        transactionType = 'whatsapp_service';
      }
      // 5. Create transaction record with automatic expiration (1 week)
      const transaction = await PaymentExpirationService.createTransactionWithExpiration({
        userId: userAuth.id,
        amount: Number(subtotal),
        type: transactionType,
        currency: currency,
        voucherId: voucher?.id,
        notes: notes,
        discountAmount: Number(discountAmount),
        originalAmount: Number(subtotal),
        totalAfterDiscount: Number(totalAfterDiscount),
      });      // 6. Create product transaction details if applicable
      if (allPackages.length > 0) {
        // Create separate TransactionProduct records for each package with quantity
        for (const pkg of allPackages) {
          await tx.transactionProduct.create({
            data: {
              transactionId: transaction.id,
              packageId: pkg.id,
              quantity: pkg.quantity,
              referenceLink: referenceLink,
            }
          });
        }
      }

      // 6.1. Create addon transaction details if applicable  
      if (allAddons.length > 0) {
        // Create separate TransactionAddons records for each addon with quantity
        for (const addon of allAddons) {
          await tx.transactionAddons.create({
            data: {
              transactionId: transaction.id,
              addonId: addon.id,
              quantity: addon.quantity,
            }
          });
        }
      }      // 7. Create WhatsApp transaction details if applicable (only 1 WhatsApp service per transaction)
      if (whatsapp.length > 0) {
        const wa = whatsapp[0]; // Only take the first one (validation ensures max 1)
        await tx.transactionWhatsappService.create({
          data: {
            transactionId: transaction.id,
            whatsappPackageId: wa.packageId,
            duration: wa.duration,
          }
        });
      }

      // 8. Update voucher usage count
      if (voucher) {
        await tx.voucher.update({
          where: { id: voucher.id },
          data: { usedCount: { increment: 1 } }
        });

        // Track voucher usage
        await tx.voucherUsage.create({
          data: {
            voucherId: voucher.id,
            userId: userAuth.id,
            transactionId: transaction.id,
            discountAmount: discountAmount,
          }
        });
      }

      return {
        transaction,
        orderItems,
        voucher,
        discountAmount,
        serviceFeePreviews,
        subtotal,
        totalAfterDiscount
      };
    });    // 9. Prepare response
    const response = {
      success: true,
      data: {
        transactionId: result.transaction.id,
        status: result.transaction.status,
        currency: currency,
        notes: result.transaction.notes,
        createdAt: result.transaction.createdAt,
        expiresAt: result.transaction.expiresAt,
        
        // Order summary
        items: result.orderItems,
        totalItems: result.orderItems.reduce((sum, item) => sum + item.quantity, 0),
        
        // Pricing breakdown
        subtotal: Number(result.subtotal),
        voucher: result.voucher ? {
          code: result.voucher.code,
          name: result.voucher.name,
          type: result.voucher.type,
          discountAmount: Number(result.discountAmount)
        } : null,
        totalDiscount: Number(result.discountAmount),
        totalAfterDiscount: Number(result.totalAfterDiscount),
          // Service fee previews for all available payment methods
        serviceFeePreview: result.serviceFeePreviews,
        
        // Available payment methods (based on active service fees for this currency)
        availablePaymentMethods: result.serviceFeePreviews.map(fee => ({
          paymentMethod: fee.paymentMethod,
          name: fee.name,
          description: `${fee.name} - ${fee.type === 'percentage' ? `${fee.value}%` : `${currency.toUpperCase()} ${fee.value.toLocaleString()}`} fee`,
          currency: currency
        })),
        
        // Expiration info
        expirationInfo: {
          transactionExpiresAt: result.transaction.expiresAt,
          paymentExpiresAfterCreation: "1 day",
          transactionExpiresAfterCreation: "7 days",
          timeRemaining: result.transaction.expiresAt ? Math.max(0, Math.floor((new Date(result.transaction.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + " days" : null
        },
        
        // Next steps
        nextStep: "Select payment method from availablePaymentMethods and call /api/customer/payment/create",      },
      message: "Checkout successful. Available payment methods are determined by active service fees for your selected currency."
    };

    return withCORS(NextResponse.json(response));
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process checkout";
    return withCORS(NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
