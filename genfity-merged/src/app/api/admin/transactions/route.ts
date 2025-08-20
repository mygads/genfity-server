import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserToken, getAdminAuth } from '@/lib/auth-helpers';
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { PaymentExpirationService } from "@/lib/payment-expiration";
import { z } from "zod";

function getTransactionStatusText(status: string) {
  switch (status) {
    case 'created':
      return 'Created';
    case 'pending':
      return 'Payment Pending';
    case 'in-progress':
      return 'In Progress';
    case 'success':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
}

function getPaymentStatusText(status: string) {
  switch (status) {
    case 'pending':
      return 'Pending Payment';
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Payment Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

const createTransactionSchema = z.object({
  // Product transaction fields
  packageId: z.string().cuid().optional(),
  addonId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  referenceLink: z.string().url().optional(),
  
  // WhatsApp service transaction fields
  whatsappPackageId: z.string().cuid().optional(),
  duration: z.enum(['month', 'year']).optional(),
  
  // Transaction type
  type: z.enum(['product', 'whatsapp_service']),
}).refine((data) => {
  if (data.type === 'product') {
    // For product transactions, either packageId or addonId is required
    return (data.packageId || data.addonId) && data.startDate && data.endDate;
  } else if (data.type === 'whatsapp_service') {
    // For WhatsApp transactions, whatsappPackageId and duration are required
    return data.whatsappPackageId && data.duration;
  }
  return false;
}, {
  message: "Invalid transaction data for the specified type",
});

// GET /api/admin/transactions - Get all transactions for admin (admin only)
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 401 }
      ));
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'product' | 'whatsapp_service' | null (all)
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const whereCondition: any = {};

    // Admin can see all transactions (no userId filter)

    if (type) {
      whereCondition.type = type;
    }

    if (status) {
      whereCondition.status = status;
    }    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereCondition,
        include: {
          payment: true,
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where: whereCondition }),
    ]);    const formattedTransactions = transactions.map(trx => {
      // Get item names from product and addon transactions
      const productNames = trx.productTransactions?.map(pt => pt.package?.name_en).filter(Boolean) || [];
      const addonNames = trx.addonTransactions?.map(at => at.addon?.name_en).filter(Boolean) || [];
      const allNames = [...productNames, ...addonNames];
      
      return {
        ...trx,
        amount: Number(trx.amount),
        item_name: trx.type === 'whatsapp_service'
          ? trx.whatsappTransaction?.whatsappPackage?.name
          : allNames.length > 0 ? allNames.join(', ') : 'No items',
        canRetryPayment: trx.status === 'created' || trx.status === 'pending' || trx.status === 'expired',
        canConfirmTransaction: trx.type === 'product' && trx.status === 'in-progress',      
        durationText: trx.type === 'whatsapp_service' && trx.whatsappTransaction?.duration
          ? `${trx.whatsappTransaction.duration === 'year' ? '1 Year' : '1 Month'}`
          : null,
        transactionStatusText: getTransactionStatusText(trx.status),
        paymentStatusText: getPaymentStatusText(trx.payment?.status || 'pending'),
      };
    });

    return withCORS(NextResponse.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }));
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    ));
  }
}

// POST /api/transactions - Create new transaction (unified)
export async function POST(request: NextRequest) {
  try {
    const userVerification = await verifyUserToken(request);
    if (!userVerification.success) {
      return withCORS(NextResponse.json(
        { success: false, error: userVerification.error },
        { status: 401 }
      ));
    }

    const userId = userVerification.userId;

    const body = await request.json();
    const validation = createTransactionSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { 
      packageId, 
      addonId, 
      whatsappPackageId, 
      duration, 
      startDate, 
      endDate, 
      referenceLink, 
      type 
    } = validation.data;

    let amount = 0;

    if (type === 'product') {
      // Calculate amount for product transaction
      if (packageId) {
        const pkg = await prisma.package.findUnique({
          where: { id: packageId },
        });
        if (!pkg) {
          return withCORS(NextResponse.json(
            { success: false, error: "Package not found" },
            { status: 404 }
          ));
        }
        amount = Number(pkg.price_idr);
      } else if (addonId) {
        const addon = await prisma.addon.findUnique({
          where: { id: addonId },
        });
        if (!addon) {
          return withCORS(NextResponse.json(
            { success: false, error: "Addon not found" },
            { status: 404 }
          ));
        }
        amount = Number(addon.price_idr);
      }
    } else if (type === 'whatsapp_service') {
      // Calculate amount for WhatsApp service transaction
      const pkg = await prisma.whatsappApiPackage.findUnique({
        where: { id: whatsappPackageId },
      });
      if (!pkg) {
        return withCORS(NextResponse.json(
          { success: false, error: "WhatsApp package not found" },
          { status: 404 }
        ));
      }
      amount = duration === 'year' ? pkg.priceYear : pkg.priceMonth;
    }    // Create transaction with nested details in a transaction block
    const result = await prisma.$transaction(async (tx) => {
      // Create main transaction with automatic expiration (1 week)
      const transaction = await PaymentExpirationService.createTransactionWithExpiration({
        userId: userId,
        amount: amount,
        type: type,
        currency: 'idr',
      });      // Create type-specific transaction details
      if (type === 'product') {
        // Create product transaction if packageId is provided
        if (packageId) {
          await tx.transactionProduct.create({
            data: {
              transactionId: transaction.id,
              packageId,
              startDate: startDate ? new Date(startDate) : null,
              endDate: endDate ? new Date(endDate) : null,
              referenceLink,
            },
          });
        }        // Create addon transaction if addonId is provided
        if (addonId) {
          await tx.transactionAddons.create({
            data: {
              transactionId: transaction.id,
              addonId,
              startDate: startDate ? new Date(startDate) : null,
              endDate: endDate ? new Date(endDate) : null,
            },
          });
        }
      } else if (type === 'whatsapp_service') {
        await tx.transactionWhatsappService.create({
          data: {
            transactionId: transaction.id,
            whatsappPackageId: whatsappPackageId!,
            duration: duration!,
            startDate: null, // Will be set when payment is confirmed
            endDate: null,   // Will be calculated when payment is confirmed
          },
        });
      }      // Return transaction with details
      return await tx.transaction.findUnique({
        where: { id: transaction.id },
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
      });
    });

    const transaction = result!;    return withCORS(NextResponse.json({
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount),
        item_name: type === 'whatsapp_service' 
          ? transaction.whatsappTransaction?.whatsappPackage?.name 
          : (() => {
              const productNames = transaction.productTransactions?.map(pt => pt.package?.name_en).filter(Boolean) || [];
              const addonNames = transaction.addonTransactions?.map(at => at.addon?.name_en).filter(Boolean) || [];
              const allNames = [...productNames, ...addonNames];
              return allNames.length > 0 ? allNames.join(', ') : 'No items';
            })(),
        item_type: type,        
        transactionStatusText: getTransactionStatusText(transaction.status),
        paymentStatusText: getPaymentStatusText('pending'), // No payment created yet
        canRetryPayment: transaction.status === 'created',
        canConfirmTransaction: false, // Will be true once payment is completed for product type
      },
      message: "Transaction created successfully. Proceed with payment.",
    }));
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to create transaction" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
