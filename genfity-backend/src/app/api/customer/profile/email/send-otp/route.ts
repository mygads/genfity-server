import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { sendEmailOtpVerification } from "@/lib/mailer";

export async function OPTIONS() {
  return corsOptionsResponse();
}

// POST /api/customer/profile/email/send-otp - Send OTP for email verification
export async function POST(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
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

    // Check rate limiting (prevent spam)
    if (user.emailOtpExpires && user.emailOtpExpires > new Date()) {
      const timeLeft = Math.ceil((user.emailOtpExpires.getTime() - Date.now()) / 1000);
      if (timeLeft > 240) { // If more than 4 minutes left, don't send new OTP
        return withCORS(NextResponse.json(
          { success: false, error: `Silakan tunggu ${Math.ceil(timeLeft / 60)} menit sebelum meminta OTP baru` },
          { status: 429 }
        ));
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update user with new OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: otp,
        emailOtpExpires: otpExpires
      }
    });

    // Send OTP email
    try {
      await sendEmailOtpVerification(user.email, otp, user.name || 'User');
      
      return withCORS(NextResponse.json({
        success: true,
        message: "OTP berhasil dikirim ke email Anda"
      }));
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      
      // Clear the OTP if sending fails
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailOtp: null,
          emailOtpExpires: null
        }
      });
      
      return withCORS(NextResponse.json(
        { success: false, error: "Gagal mengirim OTP. Silakan coba lagi." },
        { status: 500 }
      ));
    }
  } catch (error) {
    console.error("[CUSTOMER_EMAIL_SEND_OTP]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to send email OTP" },
      { status: 500 }
    ));
  }
}
