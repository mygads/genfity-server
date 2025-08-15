import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const paymentMethodsQuerySchema = z.object({
  currency: z.enum(['idr', 'usd']).optional().default('idr'),
});

// GET /api/customer/payment/method - Get available payment methods for a currency
export async function GET(request: NextRequest) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    const { searchParams } = new URL(request.url);
    const validation = paymentMethodsQuerySchema.safeParse({
      currency: searchParams.get('currency'),
    });

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { currency } = validation.data;

    // Get all active service fees for the specified currency
    const serviceFees = await prisma.serviceFee.findMany({
      where: { 
        isActive: true,
        currency: currency 
      },
      orderBy: { paymentMethod: 'asc' }
    });

    // Transform service fees into payment method information
    const paymentMethods = serviceFees.map(fee => {
      const currencySymbol = currency === 'idr' ? 'Rp' : '$';
      
      let feeDescription = '';
      if (fee.type === 'percentage') {
        feeDescription = `${Number(fee.value)}% fee`;
        if (fee.minFee) {
          feeDescription += ` (min ${currencySymbol} ${Number(fee.minFee).toLocaleString()})`;
        }
        if (fee.maxFee) {
          feeDescription += ` (max ${currencySymbol} ${Number(fee.maxFee).toLocaleString()})`;
        }
      } else {
        feeDescription = `Fixed fee ${currencySymbol} ${Number(fee.value).toLocaleString()}`;
      }

      return {
        paymentMethod: fee.paymentMethod,
        name: fee.name,
        currency: fee.currency,
        type: fee.type,
        value: Number(fee.value),
        minFee: fee.minFee ? Number(fee.minFee) : null,
        maxFee: fee.maxFee ? Number(fee.maxFee) : null,
        description: feeDescription,
        isActive: fee.isActive,
      };
    });

    return withCORS(NextResponse.json({
      success: true,
      data: {
        currency: currency,
        availablePaymentMethods: paymentMethods,
        totalMethods: paymentMethods.length,
        note: "These payment methods are configured through the admin service fees panel. Only active service fees for the selected currency are shown."
      }
    }));
  } catch (error) {
    console.error("[CUSTOMER_PAYMENT_METHODS_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch payment methods" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
