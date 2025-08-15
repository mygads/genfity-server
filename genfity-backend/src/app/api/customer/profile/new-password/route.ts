import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateUserSession } from '@/lib/jwt-session-manager';

export async function OPTIONS() {
  return corsOptionsResponse();
}

// POST /api/customer/profile/new-password - Set new password with token (password reset)
export async function POST(request: Request) {
  try {
    const { newPassword, token } = await request.json();
    
    if (!newPassword || !token) {
      return withCORS(NextResponse.json(
        { success: false, error: "Password baru dan token diperlukan" },
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

    // Find user by email verification token (repurposing for password reset)
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpires: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        password: true,
        role: true,
        emailVerified: true,
        phoneVerified: true
      }
    });

    if (!user) {
      return withCORS(NextResponse.json(
        { success: false, error: "Token tidak valid atau sudah kadaluarsa" },
        { status: 400 }
      ));
    }

    // Hash password baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        emailVerificationToken: null,
        emailVerificationTokenExpires: null
      }
    });

    // Get device info from request for session
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Generate JWT session for automatic login
    const { token: sessionToken } = await generateUserSession(user.id, {
      userAgent,
      ipAddress: ip
    });

    return withCORS(NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          image: user.image,
          verification: {
            emailVerified: !!user.emailVerified,
            phoneVerified: !!user.phoneVerified,
          }
        },
        token: sessionToken
      }
    }));
  } catch (error) {
    console.error("[CUSTOMER_NEW_PASSWORD]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to set new password" },
      { status: 500 }
    ));
  }
}
