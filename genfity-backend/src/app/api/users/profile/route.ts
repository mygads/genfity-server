import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { withCORS } from "@/lib/cors";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const userVerification = await verifyUserToken(req);
    if (!userVerification.success) {
      return withCORS(NextResponse.json(
        { success: false, error: userVerification.error },
        { status: 401 }
      ));
    }

    const userId = userVerification.userId;

    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { name, email, phone, currentPassword, newPassword } = validation.data;

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
      },
    });

    if (!currentUser) {
      return withCORS(NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      ));
    }

    // If changing password, verify current password
    if (newPassword && currentPassword) {
      if (!currentUser.password) {
        return withCORS(NextResponse.json(
          { success: false, error: "No current password set" },
          { status: 400 }
        ));
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return withCORS(NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 }
        ));
      }
    } else if (newPassword && !currentPassword) {
      return withCORS(NextResponse.json(
        { success: false, error: "Current password is required to set new password" },
        { status: 400 }
      ));
    }

    // Check if email is already taken by another user
    if (email && email !== currentUser.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return withCORS(NextResponse.json(
          { success: false, error: "Email is already taken" },
          { status: 409 }
        ));
      }
    }

    // Check if phone is already taken by another user
    if (phone && phone !== currentUser.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return withCORS(NextResponse.json(
          { success: false, error: "Phone number is already taken" },
          { status: 409 }
        ));
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12);
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
        image: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        // Include timestamps if they exist
        createdAt: true,
        updatedAt: true,
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    }));

  } catch (error: any) {
    console.error("[UPDATE_PROFILE]", error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return withCORS(NextResponse.json(
        { success: false, error: `${field} is already taken` },
        { status: 409 }
      ));
    }

    return withCORS(NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return withCORS(NextResponse.json({}));
}
