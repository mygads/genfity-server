import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { getCustomerAuth } from "@/lib/auth-helpers";

export async function OPTIONS() {
  return corsOptionsResponse();
}

// POST /api/customer/profile/email/verify - Verify email OTP
export async function POST(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    const { otp } = await request.json();
    
    if (!otp) {
      return withCORS(NextResponse.json(
        { success: false, error: "OTP diperlukan" },
        { status: 400 }
      ));
    }

    const user = await prisma.user.findUnique({
      where: { id: userAuth.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        emailOtp: true,
        emailOtpExpires: true
      }
    });

    if (!user) {
      return withCORS(NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 404 }
      ));
    }

    if (!user.email) {
      return withCORS(NextResponse.json(
        { success: false, error: "Email belum diset untuk user ini" },
        { status: 400 }
      ));
    }

    if (user.emailVerified) {
      return withCORS(NextResponse.json(
        { success: false, error: "Email sudah terverifikasi" },
        { status: 400 }
      ));
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      return withCORS(NextResponse.json(
        { success: false, error: "Tidak ada OTP yang aktif. Silakan minta OTP baru." },
        { status: 400 }
      ));
    }

    // Check if OTP is expired
    if (user.emailOtpExpires < new Date()) {
      return withCORS(NextResponse.json(
        { success: false, error: "OTP sudah kadaluarsa. Silakan minta OTP baru." },
        { status: 400 }
      ));
    }

    // Verify OTP
    if (user.emailOtp !== otp) {
      return withCORS(NextResponse.json(
        { success: false, error: "OTP tidak valid" },
        { status: 400 }
      ));
    }

    // Update user as verified and clear OTP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailOtp: null,
        emailOtpExpires: null
      },
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
      message: "Email berhasil diverifikasi"
    }));
  } catch (error) {
    console.error("[CUSTOMER_EMAIL_VERIFY_OTP]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to verify email OTP" },
      { status: 500 }
    ));
  }
}
