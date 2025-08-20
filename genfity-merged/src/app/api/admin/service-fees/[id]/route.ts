import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";
import { z } from "zod";

export async function OPTIONS() {
  return corsOptionsResponse();
}

// Validation schema for service fee updates
const updateServiceFeeSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required").optional(),
  name: z.string().min(1, "Display name is required").optional(),
  currency: z.enum(['idr', 'usd']).optional(),
  type: z.enum(['percentage', 'fixed_amount']).optional(),
  value: z.number().positive("Value must be positive").optional(),
  minFee: z.number().positive().optional().nullable().transform(val => val === null ? undefined : val),
  maxFee: z.number().positive().optional().nullable().transform(val => val === null ? undefined : val),
  isActive: z.boolean().optional(),
  requiresManualApproval: z.boolean().optional(),
  paymentInstructions: z.string().optional(),
  instructionType: z.enum(['text', 'image']).optional(),
  instructionImageUrl: z.string().optional(),
}).refine((data) => {
  // For percentage fees: validate value is between 0 and 100
  if (data.type === 'percentage' && data.value) {
    if (data.value > 100) {
      return false;
    }
    // For percentage, minFee and maxFee should be currency-appropriate if provided
    if (data.minFee && data.currency === 'usd' && data.minFee < 0.01) {
      return false;
    }
    if (data.minFee && data.currency === 'idr' && data.minFee < 100) {
      return false;
    }
  }
  
  // For fixed amount fees: validate amounts are reasonable for the specific currency
  if (data.type === 'fixed_amount' && data.value && data.currency) {
    if (data.currency === 'idr') {
      if (data.value > 1000000 || data.value < 100) {
        return false;
      }
    }
    if (data.currency === 'usd') {
      if (data.value > 1000 || data.value < 0.01) {
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
  message: "Invalid configuration: For percentage fees, value must be ≤100%. For fixed amount fees, IDR: 100-1,000,000, USD: 0.01-1,000. Min fee must be less than max fee."
});

// GET /api/admin/service-fees/[id] - Get single service fee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 }));
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

// PUT /api/admin/service-fees/[id] - Update service fee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 }));
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

    // Check if service fee exists
    const existingServiceFee = await prisma.serviceFee.findUnique({
      where: { id }
    });

    if (!existingServiceFee) {
      return withCORS(NextResponse.json(
        { success: false, error: "Service fee not found" },
        { status: 404 }
      ));
    }

    const { paymentMethod, currency, ...updateData } = validation.data;

    // If changing payment method or currency, check for conflicts
    if (paymentMethod && currency && 
        (paymentMethod !== existingServiceFee.paymentMethod || currency !== existingServiceFee.currency)) {
      
      const conflictingFee = await prisma.serviceFee.findFirst({
        where: {
          paymentMethod,
          currency,
          id: { not: id }
        }
      });

      if (conflictingFee) {
        return withCORS(NextResponse.json(
          { success: false, error: `Service fee for ${paymentMethod} (${currency.toUpperCase()}) already exists` },
          { status: 409 }
        ));
      }
    }

    const updatedServiceFee = await prisma.serviceFee.update({
      where: { id },
      data: {
        ...updateData,
        ...(paymentMethod && { paymentMethod }),
        ...(currency && { currency }),
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedServiceFee,
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

// DELETE /api/admin/service-fees/[id] - Delete service fee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 }));
    }

    const { id } = await params;

    // Check if service fee exists
    const existingServiceFee = await prisma.serviceFee.findUnique({
      where: { id }
    });

    if (!existingServiceFee) {
      return withCORS(NextResponse.json(
        { success: false, error: "Service fee not found" },
        { status: 404 }
      ));
    }

    // Check if service fee is being used by any payments
    const paymentsUsingFee = await prisma.payment.findFirst({
      where: { 
        method: existingServiceFee.paymentMethod,
        // Additional check for currency if needed
      }
    });

    if (paymentsUsingFee) {
      return withCORS(NextResponse.json(
        { success: false, error: "Cannot delete service fee that is being used by existing payments" },
        { status: 409 }
      ));
    }

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
