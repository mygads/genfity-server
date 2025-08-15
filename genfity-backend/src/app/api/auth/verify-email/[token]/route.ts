import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params;
    const { token } = params;

    if (!token) {
      return withCORS(NextResponse.json({
        success: false,
        message: "Verification token is required",
        error: 'MISSING_TOKEN'
      }, { status: 400 }));
    }

    // Find user with matching verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpires: {
          gt: new Date() // Token must not be expired
        }
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true
      }
    });

    if (!user) {
      return withCORS(NextResponse.json({
        success: false,
        message: "Invalid or expired verification token",
        error: 'INVALID_TOKEN'
      }, { status: 400 }));
    }

    // Check if already verified
    if (user.emailVerified) {
      return withCORS(NextResponse.json({
        success: true,
        message: "Email is already verified",
        data: {
          email: user.email,
          verified: true,
          alreadyVerified: true
        }
      }));
    }

    // Update user to mark email as verified and clear verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpires: null
      }
    });

    console.log(`Email verification successful for user: ${user.email}`);

    return withCORS(NextResponse.json({
      success: true,
      message: `Email ${user.email} has been successfully verified!`,
      data: {
        email: user.email,
        verified: true,
        verifiedAt: new Date().toISOString()
      }
    }));

  } catch (error) {
    console.error("Email verification error:", error);
    return withCORS(NextResponse.json({
      success: false,
      message: "Internal server error during email verification",
      error: 'INTERNAL_ERROR'
    }, { status: 500 }));
  }
}
