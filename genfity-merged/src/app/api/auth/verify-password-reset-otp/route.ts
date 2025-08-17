import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizePhoneNumber } from '@/lib/auth';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import { generateUserSession } from '@/lib/jwt-session-manager';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    const { identifier, otp, newPassword } = await request.json();

    // Validate required fields
    if (!identifier || !otp || !newPassword) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Identifier (email/phone), OTP, and new password are required',
        error: 'MISSING_FIELDS'
      }, { status: 400 }));
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'New password must be at least 6 characters long',
        error: 'PASSWORD_TOO_SHORT'
      }, { status: 400 }));
    }    let user;
    const isEmail = identifier.includes('@');
    
    // Find user based on identifier type
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
          resetPasswordOtp: true,
          resetPasswordOtpExpires: true,
          resetPasswordLastRequestAt: true,
        }
      });
    } else {
      const normalizedPhone = normalizePhoneNumber(identifier);
      user = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          resetPasswordOtp: true,
          resetPasswordOtpExpires: true,
          resetPasswordLastRequestAt: true,
        }
      });
    }

    if (!user) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'No account found with this identifier',
        error: 'USER_NOT_FOUND'
      }, { status: 404 }));
    }

    // Verify OTP
    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Invalid OTP code',
        error: 'INVALID_OTP'
      }, { status: 400 }));
    }

    // Check OTP expiry
    if (!user.resetPasswordOtpExpires || new Date(user.resetPasswordOtpExpires) < new Date()) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'OTP has expired. Please request a new one.',
        error: 'OTP_EXPIRED'
      }, { status: 400 }));
    }    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user password and clear reset OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,
        resetPasswordLastRequestAt: null,
        // Optionally verify email/phone if not already verified during password reset
        // This is a security measure - if user can receive OTP, the contact method works
        ...(isEmail && !user.email ? {} : {}),
        ...(!isEmail && !user.phone ? {} : {}),
      }
    });

    console.log(`Password reset successful for user ${user.id} via ${isEmail ? 'email' : 'phone'}`);

    // Create JWT session for automatic login
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const sessionResult = await generateUserSession(user.id, {
      userAgent,
      ipAddress: ip
    });
    
    return withCORS(NextResponse.json({
      success: true,
      message: 'Password has been reset successfully and you are now logged in.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          image: user.image,
        },
        token: sessionResult.token,
        method: isEmail ? 'email' : 'phone'
      }
    }));

  } catch (error) {
    console.error('Verify password reset OTP error:', error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, { status: 500 }));
  }
}
