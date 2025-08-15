import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

// GET /api/customer/service-fees - Get active service fees for payment methods
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency') || 'idr';

    // Validate currency parameter
    if (!['idr', 'usd'].includes(currency)) {
      return withCORS(NextResponse.json(
        { success: false, error: "Invalid currency. Must be 'idr' or 'usd'" },
        { status: 400 }
      ));
    }

    const serviceFees = await prisma.serviceFee.findMany({
      where: { 
        isActive: true,
        currency: currency 
      },
      orderBy: { paymentMethod: 'asc' },
      select: {
        paymentMethod: true,
        name: true,
        currency: true,
        type: true,
        value: true,
        minFee: true,
        maxFee: true,
      }
    });    // Transform the data to include fee calculation examples
    const serviceFeesWithExamples = serviceFees.map(fee => {
      const examples: Array<{
        amount: number;
        fee: number;
        total: number;
      }> = [];
      
      // Use appropriate example amounts based on currency
      const amounts = currency === 'idr' 
        ? [50000, 100000, 500000, 1000000] 
        : [5, 10, 50, 100]; // USD examples

      amounts.forEach(amount => {
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

        examples.push({
          amount: amount,
          fee: Math.round(feeAmount * 100) / 100, // Round to 2 decimal places for USD
          total: Math.round((amount + feeAmount) * 100) / 100,
        });
      });

      const currencySymbol = currency.toUpperCase();
      const localeString = currency === 'idr' ? 'id-ID' : 'en-US';

      return {
        paymentMethod: fee.paymentMethod,
        name: fee.name,
        currency: fee.currency,
        type: fee.type,
        value: Number(fee.value),
        minFee: fee.minFee ? Number(fee.minFee) : null,
        maxFee: fee.maxFee ? Number(fee.maxFee) : null,
        examples: examples,
        description: fee.type === 'percentage' 
          ? `${Number(fee.value)}% fee${fee.minFee ? ` (min ${currencySymbol} ${Number(fee.minFee).toLocaleString(localeString)})` : ''}${fee.maxFee ? ` (max ${currencySymbol} ${Number(fee.maxFee).toLocaleString(localeString)})` : ''}`
          : `Fixed fee ${currencySymbol} ${Number(fee.value).toLocaleString(localeString)}`
      };
    });

    return withCORS(NextResponse.json({
      success: true,
      data: serviceFeesWithExamples
    }));
  } catch (error) {
    console.error("[SERVICE_FEES_CUSTOMER_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch service fees" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
