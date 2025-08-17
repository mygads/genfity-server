import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { status, sessionId, qrCode, notes } = body;

    const updatedWhatsappService = await prisma.servicesWhatsappCustomers.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(sessionId !== undefined && { sessionId }),
        ...(qrCode !== undefined && { qrCode }),
        ...(notes !== undefined && { notes }),
        ...(status === 'active' && { activatedAt: new Date() }),
        updatedAt: new Date()
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
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedWhatsappService,
      message: 'WhatsApp service updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating WhatsApp service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update WhatsApp service",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const whatsappService = await prisma.servicesWhatsappCustomers.findUnique({
      where: { id },
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
      }
    });

    if (!whatsappService) {
      return NextResponse.json(
        { success: false, error: "WhatsApp service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: whatsappService 
    });

  } catch (error: any) {
    console.error('Error fetching WhatsApp service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch WhatsApp service",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
