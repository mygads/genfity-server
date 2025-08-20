import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(req);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 401 }
      ));
    }

    const { userId } = await params;

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!targetUser) {
      return withCORS(NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      ));
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return withCORS(NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      ));
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return withCORS(NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, and WebP are allowed" },
        { status: 400 }
      ));
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return withCORS(NextResponse.json(
        { success: false, error: "File size too large. Maximum 5MB allowed" },
        { status: 400 }
      ));
    }

    // Upload to Vercel Blob
    const { put } = await import('@vercel/blob');
    
    const filename = `profile-${userId}-${Date.now()}.${file.name.split('.').pop()}`;
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Update user profile with new image URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        image: blob.url,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        imageUrl: blob.url,
      },
      message: "Profile image updated successfully",
    }));

  } catch (error) {
    console.error("[UPLOAD_USER_PROFILE_IMAGE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to upload image" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
