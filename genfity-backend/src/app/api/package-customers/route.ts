import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {    
    // ⚠️ DEPRECATED: This endpoint now uses ServicesProductCustomers
    // Fetch product services from transactions that have payments (pending, in-progress, success)
    const customers = await prisma.servicesProductCustomers.findMany({
      where: {
        transaction: {
          status: {
            in: ['pending', 'in_progress', 'success'] // Show transactions with payments
          }
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },        
        transaction: {
          include: {
            productTransactions: true
          }
        },        
        package: {
          select: {
            id: true,
            name_en: true,
            name_id: true,
            price_idr: true,
            price_usd: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no customers found, return empty array
    if (!customers || customers.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    return NextResponse.json({
      success: true,
      data: customers
    });

  } catch (error) {
    console.error("Error fetching package customers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch package customers"
      },
      { status: 500 }
    );
  }
}
