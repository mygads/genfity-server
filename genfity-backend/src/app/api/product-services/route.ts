import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Fetch product services from transactions that have payments (pending, in-progress, success)
    const productServices = await prisma.servicesProductCustomers.findMany({
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
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true
          }
        },        package: {
          select: {
            id: true,
            name_en: true,
            name_id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: productServices
    });
    
  } catch (error: any) {
    console.error('Error fetching product services:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch product services",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
