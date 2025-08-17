import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth } from '@/lib/auth-helpers';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import { z } from 'zod';

// Validation schema for bank detail update
const bankDetailUpdateSchema = z.object({
  bankName: z.string().min(1, "Bank name is required").optional(),
  accountNumber: z.string().min(1, "Account number is required").optional(),
  accountName: z.string().min(1, "Account name is required").optional(),
  swiftCode: z.string().optional(),
  currency: z.enum(['idr', 'usd']).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/bank-details/[id] - Get specific bank detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      ));
    }

    const { id } = await params;
    
    const bankDetail = await prisma.bankDetail.findUnique({
      where: { id }
    });

    if (!bankDetail) {
      return withCORS(NextResponse.json(
        { success: false, error: "Bank detail not found" },
        { status: 404 }
      ));
    }

    return withCORS(NextResponse.json({
      success: true,
      data: bankDetail
    }));

  } catch (error) {
    console.error('Error fetching bank detail:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to fetch bank detail' },
      { status: 500 }
    ));
  }
}

// PUT /api/admin/bank-details/[id] - Update bank detail
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      ));
    }

    const { id } = await params;
    const body = await request.json();
    const validation = bankDetailUpdateSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const data = validation.data;

    // Get current bank detail
    const currentBankDetail = await prisma.bankDetail.findUnique({
      where: { id }
    });

    if (!currentBankDetail) {
      return withCORS(NextResponse.json(
        { success: false, error: "Bank detail not found" },
        { status: 404 }
      ));
    }

    // Check if trying to activate and there's already an active one for this currency
    if (data.isActive === true) {
      const currency = data.currency || currentBankDetail.currency;
      const existingActive = await prisma.bankDetail.findFirst({
        where: {
          currency: currency,
          isActive: true,
          id: { not: id } // Exclude current record
        }
      });

      if (existingActive) {
        return withCORS(NextResponse.json(
          { 
            success: false, 
            error: `There is already an active bank detail for ${currency.toUpperCase()} currency. Please deactivate it first.` 
          },
          { status: 400 }
        ));
      }
    }

    const updatedBankDetail = await prisma.bankDetail.update({
      where: { id },
      data
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedBankDetail,
      message: 'Bank detail updated successfully'
    }));

  } catch (error) {
    console.error('Error updating bank detail:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to update bank detail' },
      { status: 500 }
    ));
  }
}

// DELETE /api/admin/bank-details/[id] - Delete bank detail
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      ));
    }

    const { id } = await params;
    
    const bankDetail = await prisma.bankDetail.findUnique({
      where: { id }
    });

    if (!bankDetail) {
      return withCORS(NextResponse.json(
        { success: false, error: "Bank detail not found" },
        { status: 404 }
      ));
    }

    await prisma.bankDetail.delete({
      where: { id }
    });

    return withCORS(NextResponse.json({
      success: true,
      message: 'Bank detail deleted successfully'
    }));

  } catch (error) {
    console.error('Error deleting bank detail:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to delete bank detail' },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
