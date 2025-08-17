import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth } from '@/lib/auth-helpers';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import { z } from 'zod';

// Validation schema for bank detail creation/update
const bankDetailSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountName: z.string().min(1, "Account name is required"),
  swiftCode: z.string().optional(),
  currency: z.enum(['idr', 'usd'], { required_error: "Currency must be 'idr' or 'usd'" }),
  isActive: z.boolean().default(true),
});

// GET /api/admin/bank-details - Get all bank details
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      ));
    }

    const url = new URL(request.url);
    const currency = url.searchParams.get('currency');
    const isActive = url.searchParams.get('isActive');

    const where: any = {};
    if (currency) where.currency = currency;
    if (isActive !== null) where.isActive = isActive === 'true';

    const bankDetails = await prisma.bankDetail.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { currency: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return withCORS(NextResponse.json({
      success: true,
      data: bankDetails,
      total: bankDetails.length
    }));

  } catch (error) {
    console.error('Error fetching bank details:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to fetch bank details' },
      { status: 500 }
    ));
  }
}

// POST /api/admin/bank-details - Create new bank detail
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      ));
    }

    const body = await request.json();
    const validation = bankDetailSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const data = validation.data;

    // Check if there's already an active bank detail for this currency
    if (data.isActive) {
      const existingActive = await prisma.bankDetail.findFirst({
        where: {
          currency: data.currency,
          isActive: true
        }
      });

      if (existingActive) {
        return withCORS(NextResponse.json(
          { 
            success: false, 
            error: `There is already an active bank detail for ${data.currency.toUpperCase()} currency. Please deactivate it first or set this one as inactive.` 
          },
          { status: 400 }
        ));
      }
    }

    const bankDetail = await prisma.bankDetail.create({
      data
    });

    return withCORS(NextResponse.json({
      success: true,
      data: bankDetail,
      message: 'Bank detail created successfully'
    }));

  } catch (error) {
    console.error('Error creating bank detail:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to create bank detail' },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
