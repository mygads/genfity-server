import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { getCustomerAuth } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function PUT(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return withCORS(NextResponse.json(
        { success: false, error: "Password lama dan password baru diperlukan" },
        { status: 400 }
      ));
    }

    // Validasi panjang password baru
    if (newPassword.length < 6) {
      return withCORS(NextResponse.json(
        { success: false, error: "Password baru minimal 6 karakter" },
        { status: 400 }
      ));
    }

    // Ambil user dengan password
    const user = await prisma.user.findUnique({
      where: { id: userAuth.id },
      select: {
        id: true,
        password: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      return withCORS(NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 404 }
      ));
    }

    if (!user.password) {
      return withCORS(NextResponse.json(
        { success: false, error: "User belum memiliki password" },
        { status: 400 }
      ));
    }

    // Verifikasi password lama
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return withCORS(NextResponse.json(
        { success: false, error: "Password lama tidak valid" },
        { status: 400 }
      ));
    }

    // Cek apakah password baru sama dengan password lama
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return withCORS(NextResponse.json(
        { success: false, error: "Password baru harus berbeda dengan password lama" },
        { status: 400 }
      ));
    }

    // Hash password baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      message: "Password berhasil diubah"
    }));
  } catch (error) {
    console.error("[CUSTOMER_PASSWORD_CHANGE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 }
    ));
  }
}
