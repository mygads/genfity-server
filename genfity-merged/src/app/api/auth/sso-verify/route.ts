import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/auth";
import { generateUserSession, getDeviceInfoFromRequest } from "@/lib/jwt-session-manager";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    const { identifier, otp } = await request.json();
    
    // Validate required fields
    if (!identifier || !otp) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "Identifier and OTP are required",
        error: 'MISSING_FIELDS'
      }, { status: 400 }));
    }

    // Find user based on email or phone
    let user;
    const isEmail = identifier.includes('@');
      if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: identifier },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          ssoOtp: true,
          ssoOtpExpires: true,
          ssoLastRequestAt: true,
        }
      });
    } else {      const normalizedPhone = normalizePhoneNumber(identifier);
      user = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          ssoOtp: true,
          ssoOtpExpires: true,
          ssoLastRequestAt: true,
        }
      });
    }

    if (!user) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "No account found with this identifier",
        error: 'USER_NOT_FOUND'
      }, { status: 404 }));
    }

    // Verify SSO OTP
    if (!user.ssoOtp || user.ssoOtp !== otp) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "Invalid OTP code",
        error: 'INVALID_OTP'
      }, { status: 400 }));
    }

    // Check OTP expiry
    if (!user.ssoOtpExpires || new Date(user.ssoOtpExpires) < new Date()) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "OTP has expired. Please request a new one.",
        error: 'OTP_EXPIRED'
      }, { status: 400 }));
    }    // Clear SSO OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ssoOtp: null,
        ssoOtpExpires: null,
        ssoLastRequestAt: null
      }
    });

    // Create JWT session using proper session manager
    const deviceInfo = getDeviceInfoFromRequest(request as any);
    const sessionResult = await generateUserSession(user.id, deviceInfo);
    
    return withCORS(NextResponse.json({
      success: true,
      message: "SSO login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          image: user.image,
        },
        token: sessionResult.token,
        expiresAt: sessionResult.expiresAt.toISOString()
      }
    }));

  } catch (error) {
    console.error("SSO verify error:", error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: "Internal server error",
      error: 'INTERNAL_ERROR'
    }, { status: 500 }));
  }
}
