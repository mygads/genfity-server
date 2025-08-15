import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Fetch WhatsApp services from transactions that have payments (pending, in-progress, success)
    const whatsappServices = await prisma.servicesWhatsappCustomers.findMany({
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
        },
        package: {
          select: {
            id: true,
            name: true,
            description: true,
            priceMonth: true,
            priceYear: true,
            maxSession: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: whatsappServices
    });
    
  } catch (error: any) {
    console.error('Error fetching WhatsApp services:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch WhatsApp services",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
