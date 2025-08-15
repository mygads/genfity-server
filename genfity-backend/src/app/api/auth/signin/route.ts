import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { generateUserSession, getDeviceInfoFromRequest } from '@/lib/jwt-session-manager';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    // Validate required fields
    if (!identifier || !password) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "Email/WhatsApp number and password are required",
        error: "MISSING_CREDENTIALS"
      }, { status: 400 }));
    }

    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    let searchCriteria;

    if (isEmail) {
      // Email validation
      if (!identifier.includes('.')) {
        return withCORS(NextResponse.json({ 
          success: false,
          message: "Invalid email format",
          error: "INVALID_EMAIL_FORMAT"
        }, { status: 400 }));
      }
      searchCriteria = { email: identifier };
    } else {
      // Phone number validation and normalization
      if (!/^(\+?62|0)8[1-9][0-9]{6,10}$/.test(identifier)) {
        return withCORS(NextResponse.json({ 
          success: false,
          message: "Invalid WhatsApp number format. Use: 08xxxxxxxxx, +628xxxxxxxxx, or 628xxxxxxxxx",
          error: "INVALID_PHONE_FORMAT"
        }, { status: 400 }));
      }
      
      const normalizedPhone = normalizePhoneNumber(identifier);
      searchCriteria = { phone: normalizedPhone };
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: searchCriteria,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        role: true,
        image: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
      }
    });

    if (!user) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: isEmail ? "No account found with this email address" : "No account found with this WhatsApp number",
        error: "USER_NOT_FOUND"
      }, { status: 404 }));
    }

    if (!user.password) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "Account doesn't have a password set. Please use WhatsApp verification or reset your password.",
        error: "NO_PASSWORD_SET"
      }, { status: 400 }));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "Incorrect password",
        error: "INVALID_PASSWORD"
      }, { status: 401 }));
    }    // Check verification status
    const verificationStatus = {
      emailVerified: !!user.emailVerified,
      phoneVerified: !!user.phoneVerified,
    };    // Get device info from request
    const deviceInfo = getDeviceInfoFromRequest(request as any);

    // Generate JWT session using our session manager
    const { token, sessionId, expiresAt } = await generateUserSession(user.id, deviceInfo);
    
    return withCORS(NextResponse.json({
      success: true,
      message: "Sign in successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          image: user.image,
          verification: verificationStatus,
          createdAt: user.createdAt,
        },
        token
      }
    }));

  } catch (error) {
    console.error("Enhanced signin error:", error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: "Internal server error",
      error: "INTERNAL_ERROR"
    }, { status: 500 }));
  }
}
