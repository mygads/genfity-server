import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { getCustomerAuth } from "@/lib/auth-helpers";
import { sendVerificationEmail } from "@/services/mailer";
import { randomBytes } from 'crypto';

export async function OPTIONS() {
  return corsOptionsResponse();
}

// PUT /api/customer/profile/email/update - Update customer email
export async function PUT(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    const { email } = await request.json();
    
    if (!email) {
      return withCORS(NextResponse.json(
        { success: false, error: "Email diperlukan" },
        { status: 400 }
      ));
    }

    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      return withCORS(NextResponse.json(
        { success: false, error: "Format email tidak valid" },
        { status: 400 }
      ));
    }

    // Check if email is already used by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        id: { not: userAuth.id }
      }
    });

    if (existingUser) {
      return withCORS(NextResponse.json(
        { success: false, error: "Email sudah digunakan oleh user lain" },
        { status: 400 }
      ));
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userAuth.id },
      select: { email: true, name: true }
    });

    if (currentUser?.email === email.toLowerCase()) {
      return withCORS(NextResponse.json(
        { success: false, error: "Email baru sama dengan email saat ini" },
        { status: 400 }
      ));
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user email and set as unverified
    const updatedUser = await prisma.user.update({
      where: { id: userAuth.id },
      data: {
        email: email.toLowerCase(),
        emailVerified: null, // Reset verification
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: tokenExpires
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

    // Send verification email
    try {
      await sendVerificationEmail(email.toLowerCase(), verificationToken, currentUser?.name || 'User');
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request if email sending fails
    }

    return withCORS(NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Email berhasil diupdate. Silakan cek email untuk verifikasi."
    }));
  } catch (error) {
    console.error("[CUSTOMER_EMAIL_UPDATE]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to update email" },
      { status: 500 }
    ));
  }
}
