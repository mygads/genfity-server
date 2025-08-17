import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import jwt from 'jsonwebtoken';
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

const updateServiceFeeSchema = z.object({
  name: z.string().min(1, "Display name is required").optional(),
  paymentMethod: z.string().min(1, "Payment method is required").optional(),
  currency: z.enum(['idr', 'usd'], {
    invalid_type_error: "Currency must be either 'idr' or 'usd'"
  }).optional(),
  type: z.enum(['percentage', 'fixed_amount'], {
    invalid_type_error: "Type must be either 'percentage' or 'fixed_amount'"
  }).optional(),
  value: z.number().positive("Value must be positive").optional(),  minFee: z.number().positive().optional().nullable().transform(val => val === null ? undefined : val),
  maxFee: z.number().positive().optional().nullable().transform(val => val === null ? undefined : val),
  isActive: z.boolean().optional(),
  requiresManualApproval: z.boolean().optional(),
  paymentInstructions: z.string().optional(),
  instructionType: z.enum(['text', 'image']).optional(),
  instructionImageUrl: z.string().optional(),
}).refine((data) => {
  // For percentage fees: validate value is between 0 and 100 (SAME for both IDR and USD)
  if (data.type === 'percentage' && data.value) {
    if (data.value > 100) {
      return false;
    }
  }
  
  // For fixed amount fees: validate amounts are reasonable for the specific currency (DIFFERENT for IDR vs USD)
  if (data.type === 'fixed_amount' && data.value && data.currency) {
    if (data.currency === 'idr') {
      if (data.value > 1000000 || data.value < 100) { // IDR: 100 - 1M
        return false;
      }
    }
    if (data.currency === 'usd') {
      if (data.value > 1000 || data.value < 0.01) { // USD: 0.01 - 1000
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

// GET /api/admin/service-fees/[id] - Get specific service fee
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

    const serviceFee = await prisma.serviceFee.findUnique({
      where: { id }
    });

    if (!serviceFee) {
      return withCORS(NextResponse.json(
        { success: false, error: "Service fee not found" },
        { status: 404 }
      ));
    }

    return withCORS(NextResponse.json({
      success: true,
      data: serviceFee
    }));
  } catch (error) {
    console.error("[SERVICE_FEE_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch service fee" },
      { status: 500 }
    ));
  }
}

// PATCH /api/admin/service-fees/[id] - Update service fee
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
    }    const { id } = await params;
    const body = await request.json();
    const validation = updateServiceFeeSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const updateData = validation.data;

    // Get existing service fee to check for conflicts
    const existingFee = await prisma.serviceFee.findUnique({
      where: { id }
    });

    if (!existingFee) {
      return withCORS(NextResponse.json(
        { success: false, error: "Service fee not found" },
        { status: 404 }
      ));
    }    // If updating payment method or currency, check for conflicts
    if (updateData.paymentMethod || updateData.currency) {
      const newPaymentMethod = updateData.paymentMethod || existingFee.paymentMethod;
      const newCurrency = updateData.currency || existingFee.currency;

      // Check if the new combination already exists (excluding current record)
      const conflictingFee = await prisma.serviceFee.findFirst({
        where: {
          paymentMethod: newPaymentMethod,
          currency: newCurrency,
          NOT: { id }
        }
      });

      if (conflictingFee) {
        return withCORS(NextResponse.json(
          { success: false, error: `Service fee for ${newPaymentMethod} (${newCurrency.toUpperCase()}) already exists` },
          { status: 409 }
        ));
      }

      // Check payment method limit if changing payment method or currency
      if ((updateData.paymentMethod && updateData.paymentMethod !== existingFee.paymentMethod) ||
          (updateData.currency && updateData.currency !== existingFee.currency)) {
        
        const existingFeesForNewMethod = await prisma.serviceFee.findMany({
          where: { 
            paymentMethod: newPaymentMethod,
            NOT: { id }
          },
          select: { currency: true }
        });

        const existingCurrencies = existingFeesForNewMethod.map(fee => fee.currency);
        
        // If changing to a currency that already exists for this payment method
        if (existingCurrencies.includes(newCurrency)) {
          return withCORS(NextResponse.json(
            { success: false, error: `Payment method ${newPaymentMethod} already has a fee for ${newCurrency.toUpperCase()}` },
            { status: 409 }
          ));
        }
        
        // If payment method would have more than 2 currencies
        if (existingFeesForNewMethod.length >= 2) {
          return withCORS(NextResponse.json(
            { success: false, error: `Payment method ${newPaymentMethod} already has maximum number of fees (1 IDR + 1 USD)` },
            { status: 409 }
          ));
        }
      }
    }

    const serviceFee = await prisma.serviceFee.update({
      where: { id },
      data: updateData
    });

    return withCORS(NextResponse.json({
      success: true,
      data: serviceFee,
      message: "Service fee updated successfully"
    }));
  } catch (error) {
    console.error("[SERVICE_FEE_PATCH]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to update service fee" },
      { status: 500 }
    ));
  }
}

// DELETE /api/admin/service-fees/[id] - Delete service fee
export async function DELETE(
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

    await prisma.serviceFee.delete({
      where: { id }
    });

    return withCORS(NextResponse.json({
      success: true,
      message: "Service fee deleted successfully"
    }));
  } catch (error) {
    console.error("[SERVICE_FEE_DELETE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to delete service fee" },
      { status: 500 }
    ));
  }
}

// PUT /api/admin/service-fees/[id] - Update service fee (alternative to PATCH)
export async function PUT(
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
    const validation = updateServiceFeeSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const updateData = validation.data;

    const serviceFee = await prisma.serviceFee.update({
      where: { id },
      data: updateData
    });

    return withCORS(NextResponse.json({
      success: true,
      data: serviceFee,
      message: "Service fee updated successfully"
    }));
  } catch (error) {
    console.error("[SERVICE_FEE_PUT]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to update service fee" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
