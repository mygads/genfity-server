import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import { getAdminAuth } from '@/lib/auth-helpers';
import { Decimal } from '@prisma/client/runtime/library';
import { z } from 'zod';

export async function OPTIONS() {
  return corsOptionsResponse();
}

// Validation schema for voucher update
const updateVoucherSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  type: z.enum(['total', 'products', 'addons', 'whatsapp']).optional(),
  discountType: z.enum(['percentage', 'fixed_amount']).optional(),
  value: z.union([z.number(), z.string()]).pipe(z.coerce.number().positive('Value must be positive')).optional(),
  minAmount: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val === null || val === '' ? undefined : Number(val)),
  maxDiscount: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val === null || val === '' ? undefined : Number(val)),
  maxUses: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val === null || val === '' ? undefined : Number(val)),
  allowMultipleUsePerUser: z.boolean().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get single voucher by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if user is authenticated and is admin
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access' 
      }, { status: 401 }));
    }

    const { id } = await params;

    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        voucherUsage: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            transaction: {
              select: {
                id: true,
                amount: true,
                transactionDate: true,
              },
            },
          },
          orderBy: { usedAt: 'desc' },
        },
        _count: {
          select: {
            voucherUsage: true,
            transactions: true,
          },
        },
      },
    });

    if (!voucher) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Voucher not found' },
        { status: 404 }
      ));
    }

    return withCORS(NextResponse.json({
      success: true,
      data: voucher,
    }));
  } catch (error) {
    console.error('Error fetching voucher:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to fetch voucher' },
      { status: 500 }
    ));
  }
}

// PUT - Update voucher
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if user is authenticated and is admin
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access' 
      }, { status: 401 }));
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateVoucherSchema.parse(body);

    // Check if voucher exists
    const existingVoucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!existingVoucher) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Voucher not found' },
        { status: 404 }
      ));
    }

    // Check if code already exists (if updating code)
    if (validatedData.code && validatedData.code !== existingVoucher.code) {
      const codeExists = await prisma.voucher.findUnique({
        where: { code: validatedData.code },
      });

      if (codeExists) {
        return withCORS(NextResponse.json(
          { success: false, error: 'Voucher code already exists' },
          { status: 400 }
        ));
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.code) updateData.code = validatedData.code;
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.discountType) updateData.discountType = validatedData.discountType;
    if (validatedData.value) updateData.value = new Decimal(validatedData.value);
    if (validatedData.minAmount !== undefined) {
      updateData.minAmount = validatedData.minAmount ? new Decimal(validatedData.minAmount) : null;
    }
    if (validatedData.maxDiscount !== undefined) {
      updateData.maxDiscount = validatedData.maxDiscount ? new Decimal(validatedData.maxDiscount) : null;
    }    if (validatedData.maxUses !== undefined) updateData.maxUses = validatedData.maxUses;
    if (validatedData.allowMultipleUsePerUser !== undefined) updateData.allowMultipleUsePerUser = validatedData.allowMultipleUsePerUser;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    }

    // Update voucher
    const voucher = await prisma.voucher.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            voucherUsage: true,
            transactions: true,
          },
        },
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: voucher,
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      ));
    }

    console.error('Error updating voucher:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to update voucher' },
      { status: 500 }
    ));
  }
}

// DELETE - Delete voucher
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if user is authenticated and is admin
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access' 
      }, { status: 401 }));
    }

    const { id } = await params;

    // Check if voucher exists
    const existingVoucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            voucherUsage: true,
            transactions: true,
          },
        },
      },
    });

    if (!existingVoucher) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Voucher not found' },
        { status: 404 }
      ));
    }

    // Check if voucher has been used
    if (existingVoucher._count.voucherUsage > 0 || existingVoucher._count.transactions > 0) {
      return withCORS(NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete voucher that has been used. You can deactivate it instead.' 
        },
        { status: 400 }
      ));
    }

    // Delete voucher
    await prisma.voucher.delete({
      where: { id },
    });

    return withCORS(NextResponse.json({
      success: true,
      message: 'Voucher deleted successfully',
    }));
  } catch (error) {
    console.error('Error deleting voucher:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to delete voucher' },
      { status: 500 }
    ));
  }
}
