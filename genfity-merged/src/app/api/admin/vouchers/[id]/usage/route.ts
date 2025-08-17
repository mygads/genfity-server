import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from 'jsonwebtoken';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { id: voucherId } = await params

    // Verify voucher exists
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId }
    })

    if (!voucher) {
      return NextResponse.json(
        { message: "Voucher not found" },
        { status: 404 }
      )
    }    // Get voucher usage history with related data
    const usage = await prisma.voucherUsage.findMany({
      where: {
        voucherId: voucherId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transaction: {
          select: {
            id: true,
            amount: true,
            originalAmount: true
          }
        }
      },
      orderBy: {
        usedAt: 'desc'
      }
    })

    return NextResponse.json({
      usage: usage,
      totalUsages: usage.length,
      totalDiscountGiven: usage.reduce((sum, u) => sum + u.discountAmount.toNumber(), 0)
    })

  } catch (error) {
    console.error("Error fetching voucher usage:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
