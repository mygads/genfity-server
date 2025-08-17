import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/admin-auth";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
  role: z.enum(['customer', 'admin']).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

// GET /api/users/[userId] - Get specific user (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminVerification = await verifyAdminToken(request);
    if (!adminVerification.success) {
      return withCORS(NextResponse.json(
        { success: false, error: adminVerification.error },
        { status: 401 }
      ));
    }

    const { userId } = await params;
    if (!userId) {
      return withCORS(NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      ));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return withCORS(NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      ));
    }

    // Get transaction count
    const transactionCount = await prisma.transaction.count({
      where: { userId: userId },
    });

    // Get WhatsApp session count
    const whatsAppSessionCount = await prisma.whatsAppSession.count({
      where: { userId: userId },
    });

    const formattedUser = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      stats: {
        totalTransactions: transactionCount,
        whatsAppSessions: whatsAppSessionCount,
      },
    };

    return withCORS(NextResponse.json({
      success: true,
      data: formattedUser,
    }));
  } catch (error) {
    console.error("[USER_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    ));
  }
}

// PUT /api/users/[userId] - Update specific user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminVerification = await verifyAdminToken(request);
    if (!adminVerification.success) {
      return withCORS(NextResponse.json(
        { success: false, error: adminVerification.error },
        { status: 401 }
      ));
    }

    const { userId } = await params;
    if (!userId) {
      return withCORS(NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      ));
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const updateData: any = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return withCORS(NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      ));
    }

    // Check for email/phone conflicts if they're being updated
    if (updateData.email || updateData.phone) {
      const conflicts = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } }, // Exclude current user
            {
              OR: [
                ...(updateData.email ? [{ email: updateData.email }] : []),
                ...(updateData.phone ? [{ phone: updateData.phone }] : []),
              ],
            },
          ],
        },
      });

      if (conflicts) {
        return withCORS(NextResponse.json(
          { success: false, error: "Email or phone already exists for another user" },
          { status: 409 }
        ));
      }
    }

    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    }));
  } catch (error) {
    console.error("[USER_PUT]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    ));
  }
}

// DELETE /api/users/[userId] - Delete specific user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminVerification = await verifyAdminToken(request);
    if (!adminVerification.success) {
      return withCORS(NextResponse.json(
        { success: false, error: adminVerification.error },
        { status: 401 }
      ));
    }

    const { userId } = await params;
    if (!userId) {
      return withCORS(NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      ));
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return withCORS(NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      ));
    }

    // Check if user has active transactions
    const activeTransactions = await prisma.transaction.count({
      where: {
        userId: userId,
        status: { in: ['pending', 'in-progress'] },
      },
    });

    if (activeTransactions > 0) {
      return withCORS(NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete user with active transactions. Please complete or cancel them first." 
        },
        { status: 409 }
      ));
    }

    // Delete user (this will cascade to related records due to foreign key constraints)
    await prisma.user.delete({
      where: { id: userId },
    });

    return withCORS(NextResponse.json({
      success: true,
      message: "User deleted successfully",
    }));
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
