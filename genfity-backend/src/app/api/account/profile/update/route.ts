import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { getCustomerAuth } from "@/lib/auth-helpers";

export async function OPTIONS() {
  return corsOptionsResponse();
}

// PUT /api/customer/profile/update - Update customer profile (nama, dll)
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

    // Validate input
    if (!name && !phone) {
      return withCORS(NextResponse.json(
        { success: false, error: "Minimal satu field harus diisi (name atau phone)" },
        { status: 400 }
      ));
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 1) {
        return withCORS(NextResponse.json(
          { success: false, error: "Nama tidak boleh kosong" },
          { status: 400 }
        ));
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (phone) {
        // Validate phone format if provided
        if (!/^(\+?62|0)8[1-9][0-9]{6,10}$/.test(phone)) {
          return withCORS(NextResponse.json(
            { success: false, error: "Format nomor WhatsApp tidak valid. Gunakan: 08xxxxxxxxx, +628xxxxxxxxx, atau 628xxxxxxxxx" },
            { status: 400 }
          ));
        }
        
        // Normalize phone number
        let normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.startsWith('0')) {
          normalizedPhone = '62' + normalizedPhone.substring(1);
        } else if (normalizedPhone.startsWith('62')) {
          // Already normalized
        } else {
          normalizedPhone = '62' + normalizedPhone;
        }
        
        // Check if phone is already used by another user
        const existingUser = await prisma.user.findFirst({
          where: {
            phone: normalizedPhone,
            id: { not: userAuth.id }
          }
        });
        
        if (existingUser) {
          return withCORS(NextResponse.json(
            { success: false, error: "Nomor WhatsApp sudah digunakan oleh user lain" },
            { status: 400 }
          ));
        }
        
        updateData.phone = normalizedPhone;
        updateData.phoneVerified = null; // Reset verification when phone changes
      } else {
        updateData.phone = null;
        updateData.phoneVerified = null;
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
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
        role: true
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Profil berhasil diupdate"
    }));
  } catch (error) {
    console.error("[CUSTOMER_PROFILE_UPDATE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    ));
  }
}
