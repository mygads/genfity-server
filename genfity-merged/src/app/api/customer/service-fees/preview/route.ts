import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { z } from "zod";

const serviceFeePreviewSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(['idr', 'usd']).default('idr'),
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

// POST /api/customer/service-fees/preview - Calculate service fees for given amount
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = serviceFeePreviewSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { amount, currency } = validation.data;    // Get all active service fees for the specified currency
    const serviceFees = await prisma.serviceFee.findMany({
      where: { 
        isActive: true,
        currency: currency 
      },
      orderBy: { paymentMethod: 'asc' }
    });

    // Calculate fees for each payment method
    const feePreviews = serviceFees.map(fee => {
      const feeAmount = calculateServiceFee(amount, fee);
      const totalWithFee = amount + feeAmount;

      return {
        paymentMethod: fee.paymentMethod,
        name: fee.name,
        type: fee.type,
        value: Number(fee.value),
        feeAmount: feeAmount,
        totalWithFee: totalWithFee,
        currency: currency,
        description: fee.type === 'percentage' 
          ? `${Number(fee.value)}% fee${fee.minFee ? ` (min ${currency.toUpperCase()} ${Number(fee.minFee).toLocaleString()})` : ''}${fee.maxFee ? ` (max ${currency.toUpperCase()} ${Number(fee.maxFee).toLocaleString()})` : ''}`
          : `Fixed fee ${currency.toUpperCase()} ${Number(fee.value).toLocaleString()}`
      };
    });

    return withCORS(NextResponse.json({
      success: true,
      data: {
        amount: amount,
        currency: currency,
        serviceFees: feePreviews,
        summary: {
          baseAmount: amount,
          lowestFee: Math.min(...feePreviews.map(f => f.feeAmount)),
          highestFee: Math.max(...feePreviews.map(f => f.feeAmount)),
          lowestTotal: Math.min(...feePreviews.map(f => f.totalWithFee)),
          highestTotal: Math.max(...feePreviews.map(f => f.totalWithFee)),
        }
      }
    }));
  } catch (error) {
    console.error("[SERVICE_FEE_PREVIEW_ERROR]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to calculate service fee preview" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
