import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmailOtpVerification } from '@/lib/mailer';
import { withCORS, corsOptionsResponse } from "@/lib/cors";

// Generate 4-digit OTP
function generateEmailOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email is provided
    if (!email) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Email is required',
        error: 'EMAIL_REQUIRED'
      }, { status: 400 }));
    }

    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL_FORMAT'
      }, { status: 400 }));
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        emailVerified: true,
        emailOtp: true,
        emailOtpExpires: true
      }
    });

    if (!user) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'User with this email not found',
        error: 'USER_NOT_FOUND'
      }, { status: 404 }));
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Email is already verified',
        error: 'EMAIL_ALREADY_VERIFIED'
      }, { status: 400 }));
    }    // Check rate limiting - prevent sending OTP too frequently (1 minute)
    if (user.emailOtpExpires && user.emailOtpExpires > new Date()) {
      const remainingTime = Math.ceil((user.emailOtpExpires.getTime() - Date.now()) / 1000);
      return withCORS(NextResponse.json({ 
        success: false,
        message: `Please wait ${remainingTime} seconds before requesting a new OTP`,
        error: 'RATE_LIMITED'
      }, { status: 429 }));
    }

    // Generate new OTP
    const emailOtp = generateEmailOTP();
    const emailOtpExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with new OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp,
        emailOtpExpires
      }
    });

    // Send email OTP
    const emailResult = await sendEmailOtpVerification(email, emailOtp, user.name);
    
    if (!emailResult.success) {
      console.error('Failed to send email OTP:', emailResult.error);
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Failed to send verification email. Please try again.',
        error: 'EMAIL_SEND_FAILED'
      }, { status: 500 }));
    }

    console.log(`Email OTP sent successfully to ${email}`);    return withCORS(NextResponse.json({ 
      success: true,
      message: 'Email verification code sent successfully',
      data: {
        email,
        expiresIn: 60 // minutes (1 hour)
      }
    }));

  } catch (error) {
    console.error('Send email OTP error:', error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, { status: 500 }));
  }
}
