import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserToken } from '@/lib/auth-helpers';
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { z } from "zod";

const purchaseWhatsappSchema = z.object({
  whatsappPackageId: z.string().cuid(),
  duration: z.enum(['month', 'year']),
});

// POST /api/whatsapp-api/purchase - Create WhatsApp service transaction
export async function POST(request: Request) {
  try {
    const user = await verifyUserToken(request as any);
    if (!user) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    const body = await request.json();
    const validation = purchaseWhatsappSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { whatsappPackageId, duration } = validation.data;

    // Get WhatsApp package details
    const whatsappPackage = await prisma.whatsappApiPackage.findUnique({
      where: { id: whatsappPackageId },
    });

    if (!whatsappPackage) {
      return withCORS(NextResponse.json(
        { success: false, error: "WhatsApp package not found" },
        { status: 404 }
      ));
    }

    // Calculate amount based on duration
    const amount = duration === 'year' ? whatsappPackage.priceYear : whatsappPackage.priceMonth;

    // Create transaction with nested WhatsApp service details
    const result = await prisma.$transaction(async (tx) => {
      // Create main transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'whatsapp_service',
          amount,
          status: 'pending',
        },
      });

      // Create WhatsApp service transaction details
      await tx.transactionWhatsappService.create({
        data: {
          transactionId: transaction.id,
          whatsappPackageId,
          duration,
          startDate: null, // Will be set when payment is confirmed
          endDate: null,   // Will be calculated when payment is confirmed
        },
      });

      // Return transaction with details
      return await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          whatsappTransaction: {
            include: {
              whatsappPackage: true,
            },
          },
        },
      });
    });

    const transaction = result!;

    return withCORS(NextResponse.json({
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount),
        item_name: transaction.whatsappTransaction?.whatsappPackage?.name,
        item_type: 'whatsapp_service',
        duration_text: duration === 'year' ? '1 Year' : '1 Month',
        package_details: transaction.whatsappTransaction?.whatsappPackage,
      },
      message: "WhatsApp service transaction created successfully. Proceed with payment.",
    }));
  } catch (error) {
    console.error("[WHATSAPP_PURCHASE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to create WhatsApp service transaction" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
