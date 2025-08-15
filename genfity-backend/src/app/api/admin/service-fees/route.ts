import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Validation schema for service fee
const serviceFeeSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
  name: z.string().min(1, "Display name is required"),
  currency: z.enum(['idr', 'usd'], {
    required_error: "Currency is required",
    invalid_type_error: "Currency must be either 'idr' or 'usd'"
  }),
  type: z.enum(['percentage', 'fixed_amount'], {
    required_error: "Type is required",
    invalid_type_error: "Type must be either 'percentage' or 'fixed_amount'"
  }),
  value: z.number().positive("Value must be positive"),  minFee: z.number().positive().optional().nullable().transform(val => val === null ? undefined : val),
  maxFee: z.number().positive().optional().nullable().transform(val => val === null ? undefined : val),
  isActive: z.boolean().default(true),
  requiresManualApproval: z.boolean().default(false),
  paymentInstructions: z.string().optional(),
  instructionType: z.enum(['text', 'image']).default('text').optional(),
  instructionImageUrl: z.string().optional(),
}).refine((data) => {
  // For percentage fees: validate value is between 0 and 100 (SAME for both IDR and USD)
  if (data.type === 'percentage') {
    if (data.value > 100) {
      return false;
    }
    // For percentage, minFee and maxFee should be currency-appropriate if provided
    if (data.minFee && data.currency === 'usd' && data.minFee < 0.01) {
      return false; // USD minimum should be at least 1 cent
    }
    if (data.minFee && data.currency === 'idr' && data.minFee < 100) {
      return false; // IDR minimum should be at least 100 rupiah
    }
  }
  
  // For fixed amount fees: validate amounts are reasonable for the specific currency (DIFFERENT for IDR vs USD)
  if (data.type === 'fixed_amount') {
    if (data.currency === 'idr') {
      if (data.value > 1000000) { // Max 1M IDR
        return false;
      }
      if (data.value < 100) { // Min 100 IDR
        return false;
      }
    }
    if (data.currency === 'usd') {
      if (data.value > 1000) { // Max 1000 USD
        return false;
      }
      if (data.value < 0.01) { // Min 1 cent USD
        return false;
      }
    }
  }
  
  // Ensure minFee < maxFee if both are provided
  if (data.minFee && data.maxFee && data.minFee >= data.maxFee) {
    return false;
  }
  
  return true;
}, {
  message: "Invalid configuration: For percentage fees, value must be ≤100% (same rule for IDR/USD). For fixed amount fees, IDR: 100-1,000,000, USD: 0.01-1,000. Min fee must be less than max fee."
});

// GET /api/admin/service-fees - Get all service fees
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const serviceFees = await prisma.serviceFee.findMany({
      orderBy: { paymentMethod: 'asc' }
    });

    return withCORS(NextResponse.json({
      success: true,
      data: serviceFees
    }));
  } catch (error) {
    console.error("[SERVICE_FEES_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch service fees" },
      { status: 500 }
    ));
  }
}

// POST /api/admin/service-fees - Create new service fee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const body = await request.json();
    const validation = serviceFeeSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }    const { paymentMethod, name, currency, type, value, minFee, maxFee, isActive, requiresManualApproval, paymentInstructions, instructionType, instructionImageUrl } = validation.data;

    // Check payment method limit: max 2 fees per method (1 IDR + 1 USD)
    const existingFeesForMethod = await prisma.serviceFee.findMany({
      where: { paymentMethod },
      select: { currency: true }
    });

    // Check if payment method already has both currencies
    const existingCurrencies = existingFeesForMethod.map(fee => fee.currency);
    
    if (existingFeesForMethod.length >= 2) {
      return withCORS(NextResponse.json(
        { success: false, error: `Payment method ${paymentMethod} already has maximum number of fees (1 IDR + 1 USD)` },
        { status: 409 }
      ));
    }

    // Check if this currency already exists for this payment method
    if (existingCurrencies.includes(currency)) {
      return withCORS(NextResponse.json(
        { success: false, error: `Service fee for ${paymentMethod} (${currency.toUpperCase()}) already exists` },
        { status: 409 }
      ));
    }    const serviceFee = await prisma.serviceFee.create({
      data: {
        paymentMethod,
        name,
        currency,
        type,
        value,
        minFee,
        maxFee,
        isActive,
        requiresManualApproval,
        paymentInstructions,
        instructionType,
        instructionImageUrl,
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      data: serviceFee,
      message: "Service fee created successfully"
    }));
  } catch (error) {
    console.error("[SERVICE_FEES_POST]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to create service fee" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
