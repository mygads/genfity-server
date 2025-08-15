import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
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
