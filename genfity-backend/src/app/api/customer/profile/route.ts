import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";

// GET /api/customer/profile - Get user profile
export async function GET(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }    const user = await prisma.user.findUnique({
      where: { id: userAuth.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        emailVerified: true,
        phoneVerified: true,
        role: true,        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!user) {
      return withCORS(NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      ));
    }    // Get active WhatsApp services
    const activeWhatsappServices = await prisma.servicesWhatsappCustomers.count({
      where: {
        customerId: userAuth.id,
        expiredAt: { gt: new Date() },
      },
    });

    // Get WhatsApp transactions count
    const whatsappTransactionCount = await prisma.transaction.count({
      where: {
        userId: userAuth.id,
        type: 'whatsapp_service',
      },
    });    // Get total WhatsApp services count
    const totalWhatsappServices = await prisma.servicesWhatsappCustomers.count({
      where: {
        customerId: userAuth.id,
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: {
        ...user,
        verification: {
          emailVerified: !!user.emailVerified,
          phoneVerified: !!user.phoneVerified,
        },
        stats: {
          totalTransactions: user._count.transactions,
          totalWhatsappTransactions: whatsappTransactionCount,
          activeWhatsappServices,
          totalWhatsappServices,
        },
      },
    }));
  } catch (error) {
    console.error("[CUSTOMER_PROFILE_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    ));
  }
}

// PUT /api/customer/profile - Update user profile
export async function PUT(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    const body = await request.json();
    const { name, phone } = body;

    // Update allowed fields only
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    if (Object.keys(updateData).length === 0) {
      return withCORS(NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      ));
    }    const updatedUser = await prisma.user.update({
      where: { id: userAuth.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    }));
  } catch (error) {
    console.error("[CUSTOMER_PROFILE_PUT]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
