import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { put, del } from '@vercel/blob';
import { randomUUID } from 'crypto';

export async function OPTIONS() {
  return corsOptionsResponse();
}

// POST /api/customer/profile/photo/upload - Upload profile photo
export async function POST(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    const contentType = request.headers.get('content-type');
    
    if (!contentType?.includes('multipart/form-data')) {
      return withCORS(NextResponse.json(
        { success: false, error: "Request harus berupa multipart/form-data" },
        { status: 400 }
      ));
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return withCORS(NextResponse.json(
        { success: false, error: "File gambar diperlukan" },
        { status: 400 }
      ));
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return withCORS(NextResponse.json(
        { success: false, error: "Tipe file tidak didukung. Gunakan JPEG, PNG, atau WebP" },
        { status: 400 }
      ));
    }

    // Validasi ukuran file (maksimal 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return withCORS(NextResponse.json(
        { success: false, error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      ));
    }

    // Get current user data to check for existing image
    const currentUser = await prisma.user.findUnique({
      where: { id: userAuth.id },
      select: { image: true }
    });

    // Generate nama file unik
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile-images/${randomUUID()}.${fileExtension}`;
    
    try {
      // Upload ke Vercel Blob
      const blob = await put(fileName, file, {
        access: 'public',
      });
      
      // Update user dengan URL gambar baru
      const updatedUser = await prisma.user.update({
        where: { id: userAuth.id },
        data: { image: blob.url },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          emailVerified: true,
          phoneVerified: true
        }
      });

      // Delete old image from Vercel Blob if it exists and is a blob URL
      if (currentUser?.image && currentUser.image.includes('blob.vercel-storage.com')) {
        try {
          // Extract the blob key from the URL
          const url = new URL(currentUser.image);
          const pathname = url.pathname;
          // Remove leading slash to get the blob key
          const blobKey = pathname.startsWith('/') ? pathname.slice(1) : pathname;
          
          if (blobKey) {
            await del(blobKey);
            console.log('Old profile image deleted:', blobKey);
          }
        } catch (deleteError) {
          // Log error but don't fail the request if old image deletion fails
          console.error('Failed to delete old profile image:', deleteError);
        }
      }

      return withCORS(NextResponse.json({
        success: true,
        data: updatedUser,
        message: "Foto profil berhasil diupload"
      }));
    } catch (uploadError) {
      console.error("Blob upload error:", uploadError);
      return withCORS(NextResponse.json(
        { success: false, error: "Gagal mengupload file gambar" },
        { status: 500 }
      ));
    }
  } catch (error) {
    console.error("[CUSTOMER_PROFILE_PHOTO_UPLOAD]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to upload profile photo" },
      { status: 500 }
    ));
  }
}

// PUT /api/customer/profile/photo/upload - Update existing profile photo
export async function PUT(request: Request) {
  return POST(request); // Same logic as POST
}

// DELETE /api/customer/profile/photo/upload - Delete profile photo
export async function DELETE(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    // Get current user data to check for existing image
    const currentUser = await prisma.user.findUnique({
      where: { id: userAuth.id },
      select: { image: true }
    });

    // Delete from Vercel Blob if it's a blob URL
    if (currentUser?.image && currentUser.image.includes('blob.vercel-storage.com')) {
      try {
        // Extract the blob key from the URL
        const url = new URL(currentUser.image);
        const pathname = url.pathname;
        // Remove leading slash to get the blob key
        const blobKey = pathname.startsWith('/') ? pathname.slice(1) : pathname;
        
        if (blobKey) {
          await del(blobKey);
          console.log('Profile image deleted from blob storage:', blobKey);
        }
      } catch (deleteError) {
        // Log error but continue with database update
        console.error('Failed to delete image from blob storage:', deleteError);
      }
    }

    // Update user database record to remove image
    const updatedUser = await prisma.user.update({
      where: { id: userAuth.id },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        emailVerified: true,
        phoneVerified: true
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Foto profil berhasil dihapus"
    }));
  } catch (error) {
    console.error("[CUSTOMER_PROFILE_PHOTO_DELETE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to delete profile photo" },
      { status: 500 }
    ));
  }
}
