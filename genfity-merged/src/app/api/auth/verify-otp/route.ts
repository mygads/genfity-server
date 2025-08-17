import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sendWhatsAppMessage } from '@/lib/whatsapp'; // Import baru
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { generateUserSession } from '@/lib/jwt-session-manager';

// Fungsi untuk normalisasi nomor telepon (konsisten dengan signup)
function normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    if (phone.startsWith('0')) {
        return '62' + phone.substring(1);
    } else if (phone.startsWith('+62')) {
        return phone.substring(1); // Simpan sebagai 62...
    } else if (phone.startsWith('62')) {
        return phone;
    }
    // Jika tidak ada prefix umum, tambahkan 62 (sesuaikan jika perlu)
    return '62' + phone.replace(/\D/g, ''); // Hapus non-digit juga
}

// Fungsi untuk menghasilkan password acak
function generateRandomPassword(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    const { identifier, otp, purpose = 'signup' } = await request.json();

    // Validate required fields
    if (!identifier || !otp) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Identifier (email/phone) and OTP are required',
        error: 'MISSING_FIELDS'
      }, { status: 400 }));
    }

    // Validate purpose
    const validPurposes = ['signup', 'email-verification', 'password-reset', 'sso-login'];
    if (!validPurposes.includes(purpose)) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Invalid verification purpose',
        error: 'INVALID_PURPOSE'
      }, { status: 400 }));
    }

    let user;
    const isEmail = identifier.includes('@');
    let normalizedPhone = '';    // Find user based on identifier type
    if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: identifier },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          password: true,
          image: true,
          role: true,          // WhatsApp signup OTP fields
          otp: true,
          otpExpires: true,
          otpVerificationDeadline: true,
          // Email verification OTP fields
          emailOtp: true,
          emailOtpExpires: true,          // Password reset OTP fields
          resetPasswordOtp: true,
          resetPasswordOtpExpires: true,
          resetPasswordLastRequestAt: true,
          // SSO login OTP fields
          ssoOtp: true,
          ssoOtpExpires: true,
          ssoLastRequestAt: true,
          // Verification status
          phoneVerified: true,
          emailVerified: true,
        }
      });
    } else {
      normalizedPhone = normalizePhoneNumber(identifier);
      user = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          password: true,
          image: true,
          role: true,          // WhatsApp signup OTP fields
          otp: true,
          otpExpires: true,
          otpVerificationDeadline: true,
          // Email verification OTP fields
          emailOtp: true,
          emailOtpExpires: true,          // Password reset OTP fields
          resetPasswordOtp: true,
          resetPasswordOtpExpires: true,
          resetPasswordLastRequestAt: true,
          // SSO login OTP fields
          ssoOtp: true,
          ssoOtpExpires: true,
          ssoLastRequestAt: true,
          // Verification status
          phoneVerified: true,
          emailVerified: true,
        }
      });
    }

    if (!user) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      }, { status: 404 }));
    }

    // Verify OTP based on purpose
    let isOtpValid = false;
    let isOtpExpired = false;
    let updateData: any = {};

    switch (purpose) {
      case 'signup':
        // WhatsApp signup OTP verification
        isOtpValid = user.otp === otp;
        isOtpExpired = user.otpExpires ? new Date(user.otpExpires) < new Date() : true;
        if (isOtpValid && !isOtpExpired) {
          updateData = {
            phoneVerified: new Date(),
            otp: null,
            otpExpires: null,
            otpVerificationDeadline: null,
          };
        }
        break;

      case 'email-verification':
        // Email OTP verification
        isOtpValid = user.emailOtp === otp;
        isOtpExpired = user.emailOtpExpires ? new Date(user.emailOtpExpires) < new Date() : true;
        if (isOtpValid && !isOtpExpired) {
          updateData = {
            emailVerified: new Date(),
            emailOtp: null,
            emailOtpExpires: null,
          };
        }
        break;

      case 'password-reset':
        // Password reset OTP verification
        isOtpValid = user.resetPasswordOtp === otp;
        isOtpExpired = user.resetPasswordOtpExpires ? new Date(user.resetPasswordOtpExpires) < new Date() : true;
        // Don't clear OTP yet - user needs to set new password
        break;

      case 'sso-login':
        // SSO login OTP verification
        isOtpValid = user.ssoOtp === otp;
        isOtpExpired = user.ssoOtpExpires ? new Date(user.ssoOtpExpires) < new Date() : true;
        if (isOtpValid && !isOtpExpired) {
          updateData = {
            ssoOtp: null,
            ssoOtpExpires: null,
          };
        }
        break;
    }

    if (!isOtpValid) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Invalid OTP code',
        error: 'INVALID_OTP'
      }, { status: 400 }));
    }

    if (isOtpExpired) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'OTP has expired',
        error: 'OTP_EXPIRED'
      }, { status: 400 }));
    }    // Handle signup-specific logic
    if (purpose === 'signup') {
      let newPassword = null;
      let hashedPassword = user.password;

      // Auto-generate password if user doesn't have one (password-less signup)
      if (!user.password) {
        newPassword = generateRandomPassword(8);
        hashedPassword = await bcrypt.hash(newPassword, 10);
        updateData.password = hashedPassword;
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });      // Send welcome messages with password if auto-generated
      if (newPassword && updatedUser.phone) {
        const welcomeMessage = `Welcome to GENFITY, ${updatedUser.name}! 🎉

Your account has been successfully verified.

📱 Phone: ${updatedUser.phone}
🔑 Auto-Generated Password: *${newPassword}*

🌐 Login at: ${process.env.NEXT_PUBLIC_APP_URL}/signin

⚠️ Please change your password immediately for security.
💡 Keep this password safe and do not share it with anyone.

Thank you for choosing GENFITY Digital Solutions!`;

        sendWhatsAppMessage(updatedUser.phone, welcomeMessage).catch(err => {
          console.error("Failed to send welcome message via WhatsApp:", err);
        });
      } else if (updatedUser.phone) {
        const confirmationMessage = `Hello ${updatedUser.name}, 🌟

Welcome to GENFITY! Your account has been successfully verified.

🚀 Your all-in-one software house and digital agency
💼 Helping you grow and build stronger customer trust
🎯 Innovative solutions tailored for your success

🌐 Login at: ${process.env.NEXT_PUBLIC_APP_URL}/signin

Explore our products and exclusive offers:
${process.env.NEXT_PUBLIC_APP_URL}/product

Let's build the future together! 💪`;

        sendWhatsAppMessage(updatedUser.phone, confirmationMessage).catch(err => {
          console.error("Failed to send confirmation message via WhatsApp:", err);
        });
      }      // Create JWT session for automatic login
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      const sessionResult = await generateUserSession(updatedUser.id, {
        userAgent,
        ipAddress: ip
      });

      return withCORS(NextResponse.json({
        success: true,
        message: newPassword 
          ? 'Verification successful! You are now logged in. Your auto-generated password has been sent to your WhatsApp.' 
          : 'Verification successful! You are now logged in.',
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            image: updatedUser.image,
            verification : {
              phoneVerified: updatedUser.phoneVerified,
              emailVerified: updatedUser.emailVerified
            },
            createdAt: updatedUser.createdAt,
          },
          token: sessionResult.token,
          passwordGenerated: newPassword ? true : false
        }
      }));
    }

    // Handle password reset verification
    if (purpose === 'password-reset') {
      // Generate reset token for password change
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: resetToken,
          emailVerificationTokenExpires: resetTokenExpires,
        }
      });

      return withCORS(NextResponse.json({
        success: true,
        message: 'OTP verified successfully. You can now reset your password.',
        data: {
          resetToken,
          expiresIn: 30 // minutes
        }
      }));
    }

    // Handle other verification types (email-verification, sso-login)
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }    // For SSO login, create session
    if (purpose === 'sso-login') {
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
        message: 'SSO login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            role: user.role,
            image: user.image,
            verification: {
              phoneVerified: user.phoneVerified,
              emailVerified: user.emailVerified
            }
          },
          token: sessionResult.token
        }
      }));
    }    return withCORS(NextResponse.json({
      success: true,
      message: 'Verification successful',
      data: {
        verified: true,
        purpose
      }
    }));

  } catch (error) {
    console.error('Verify OTP error:', error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, { status: 500 }));
  }
}
