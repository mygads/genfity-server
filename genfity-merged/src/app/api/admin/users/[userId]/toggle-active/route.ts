import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/auth-helpers";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

// PUT /api/admin/users/[userId]/toggle-active - Toggle user active status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
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
      select: { id: true, isActive: true, name: true, email: true }
    });

    if (!existingUser) {
      return withCORS(NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      ));
    }

    // Toggle the active status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: !existingUser.isActive 
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: true,
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
    }));
  } catch (error) {
    console.error("[USER_TOGGLE_ACTIVE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to update user status" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
