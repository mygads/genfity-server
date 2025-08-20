import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { z } from 'zod';
import { getAdminAuth } from '@/lib/auth-helpers';
import { withCORS } from '@/lib/cors';

// Validation schema for voucher creation/update
const voucherSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['total', 'products', 'addons', 'whatsapp']),
  discountType: z.enum(['percentage', 'fixed_amount']),
  value: z.union([z.number(), z.string()]).pipe(z.coerce.number().positive('Value must be positive')),
  minAmount: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val === null || val === '' ? undefined : Number(val)),
  maxDiscount: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val === null || val === '' ? undefined : Number(val)),
  maxUses: z.union([z.number(), z.string(), z.null()]).optional().transform(val => val === null || val === '' ? undefined : Number(val)),
  allowMultipleUsePerUser: z.boolean().default(false),
  isActive: z.boolean().default(true),
  startDate: z.string(),
  endDate: z.string().optional(),
});

// GET - List all vouchers with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const adminUser = await getAdminAuth(request);
    if (!adminUser) {
      return withCORS(NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access' 
      }, { status: 401 }));
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type');
    const discountType = searchParams.get('discountType');

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (type) {
      where.type = type;
    }

    if (discountType) {
      where.discountType = discountType;
    }

    // Get vouchers with pagination
    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: {
          voucherUsage: {
            select: {
              id: true,
              usedAt: true,
              discountAmount: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              voucherUsage: true,
              transactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.voucher.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        vouchers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}

// POST - Create new voucher
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: 'Admin access required' }, 
        { status: 401 }
      ));
    }

    const body = await request.json();
    const validatedData = voucherSchema.parse(body);

    // Check if code already exists
    const existingVoucher = await prisma.voucher.findUnique({
      where: { code: validatedData.code },
    });

    if (existingVoucher) {
      return NextResponse.json(
        { success: false, error: 'Voucher code already exists' },
        { status: 400 }
      );
    }    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        discountType: validatedData.discountType,
        value: new Decimal(validatedData.value),
        minAmount: validatedData.minAmount ? new Decimal(validatedData.minAmount) : null,
        maxDiscount: validatedData.maxDiscount ? new Decimal(validatedData.maxDiscount) : null,
        maxUses: validatedData.maxUses,
        usedCount: 0,
        allowMultipleUsePerUser: validatedData.allowMultipleUsePerUser,
        isActive: validatedData.isActive,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
      include: {
        _count: {
          select: {
            voucherUsage: true,
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
}
