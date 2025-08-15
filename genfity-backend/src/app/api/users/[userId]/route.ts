import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

// GET /api/users/[userId] - Get user details (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const { userId } = await params;    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
          },
          take: 5,
          orderBy: { id: 'desc' },
        },
        whatsAppSessions: {
          select: {
            id: true,
            sessionId: true,
            sessionName: true,
            status: true,
          },
          take: 5,
          orderBy: { id: 'desc' },
        },
        whatsappCustomers: {
          select: {
            id: true,
            status: true,
            expiredAt: true,
          },
          take: 5,
          orderBy: { id: 'desc' },
        },
      },
    });

    if (!user) {
      return withCORS(NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      ));
    }    const userWithStats = {
      ...user,
      createdAt: new Date().toISOString(), // Mock timestamp since it's not in schema
      updatedAt: new Date().toISOString(), // Mock timestamp since it's not in schema
      stats: {
        totalTransactions: user.transactions?.length || 0,
        activeWhatsAppSessions: user.whatsAppSessions?.length || 0,
        whatsappServices: user.whatsappCustomers?.length || 0,
      },
    };

    return withCORS(NextResponse.json({
      success: true,
      data: userWithStats,
    }));
  } catch (error) {
    console.error("[USER_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    ));
  }
}

// PATCH /api/users/[userId] - Update user (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const { userId } = await params;
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { name, email, phone, role, password } = validation.data;

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

    // Check for email/phone conflicts (excluding current user)
    if (email || phone) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : []),
              ],
            },
          ],
        },
      });

      if (conflictUser) {
        return withCORS(NextResponse.json(
          { success: false, error: "Email or phone already in use by another user" },
          { status: 409 }
        ));
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    }));
  } catch (error) {
    console.error("[USER_PATCH]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    ));
  }
}

// DELETE /api/users/[userId] - Delete user (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const { userId } = await params;

    // Prevent admin from deleting themselves
    if (session.user.id === userId) {
      return withCORS(NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
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
    }    // Delete user and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.whatsAppSession.deleteMany({ where: { userId } });
      await tx.servicesWhatsappCustomers.deleteMany({ where: { customerId: userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      
      // Note: We don't delete transactions as they are important for audit trail
      // Instead, we could anonymize them if needed
      
      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
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
