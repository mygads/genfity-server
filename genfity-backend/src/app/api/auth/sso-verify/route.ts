import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/auth";
import { encode } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';

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
    });// Create NextAuth-compatible session
    const sessionToken = await createUserSession(user);
    const response = NextResponse.json({
      success: true,
      message: "SSO login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          image: user.image, // Include image URL
        },
        token: sessionToken // Add JWT token to response
      }
    });

    // Set session cookie
    setSessionCookie(response, sessionToken);
    
    console.log(`SSO login successful for user ${user.id} via ${isEmail ? 'email' : 'phone'}`);
    return withCORS(response);

  } catch (error) {
    console.error("SSO verify error:", error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: "Internal server error",
      error: 'INTERNAL_ERROR'
    }, { status: 500 }));
  }
}

// Helper function to create user session
async function createUserSession(user: any): Promise<string> {
  const { callbacks } = authOptions;
  const secret = process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET not configured');
  }

  const userForJwtCallback = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    phone: user.phone,
  };

  let tokenPayload: Record<string, unknown> = {
    name: user.name,
    email: user.email,
    sub: user.id,
  };

  if (callbacks?.jwt) {
    tokenPayload = await callbacks.jwt({
      token: tokenPayload,
      user: userForJwtCallback as import("next-auth").User | import("next-auth/adapters").AdapterUser,
      account: null
    });
  }

  const sessionMaxAge = authOptions.session?.maxAge || 30 * 24 * 60 * 60;
  
  return await encode({
    token: tokenPayload,
    secret: secret,
    maxAge: sessionMaxAge,
  });
}

// Helper function to set session cookie
function setSessionCookie(response: NextResponse, sessionToken: string) {
  const sessionMaxAge = authOptions.session?.maxAge || 30 * 24 * 60 * 60;
  const cookieName = process.env.NEXTAUTH_URL?.startsWith("https://") 
                     ? "__Secure-next-auth.session-token" 
                     : "next-auth.session-token";
  
  response.cookies.set({
    name: cookieName,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NEXTAUTH_URL?.startsWith("https://") || false,
    path: '/',
    sameSite: 'lax',
    maxAge: sessionMaxAge,
  });
}
