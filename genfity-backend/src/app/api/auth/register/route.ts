import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sendWhatsAppMessageDetailed } from '@/lib/whatsapp'; // Import enhanced function
import { sendVerificationEmail } from '@/lib/mailer';
import { normalizePhoneNumber } from '@/lib/auth';
import { generateApiKey } from '@/lib/api-key';
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { generateUserSession } from '@/lib/jwt-session-manager';

// Fungsi untuk menghasilkan OTP 6 digit
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    const { email, phone, password, name } = await request.json();

    // Validasi nama diperlukan
    if (!name) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Name is required',
        error: 'NAME_REQUIRED'
      }, { status: 400 }));
    }

    // WhatsApp (phone number) is now mandatory
    if (!phone) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'WhatsApp number is required for registration',
        error: 'PHONE_REQUIRED'
      }, { status: 400 }));
    }

    // Validasi format nomor WhatsApp (mandatory)
    if (!/^(\+?62|0)8[1-9][0-9]{6,10}$/.test(phone)) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Invalid WhatsApp number format. Use format: 08xxxxxxxxx, +628xxxxxxxxx, or 628xxxxxxxxx',
        error: 'INVALID_PHONE_FORMAT'
      }, { status: 400 }));
    }

    // Validasi format email (optional)
    if (email && (!email.includes('@') || !email.includes('.'))) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Invalid email format.',
        error: 'INVALID_EMAIL_FORMAT'
      }, { status: 400 }));
    }

    // Normalize phone number (now mandatory)
    const normalizedPhone = normalizePhoneNumber(phone);

    // Cek existing user - prioritas cek phone (mandatory) first
    const orConditions: Array<{ phone?: string; email?: string }> = [{ phone: normalizedPhone }];
    if (email) {
      orConditions.push({ email });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: orConditions },
    });

    if (existingUser) {
      let message = '';
      let errorCode = '';
      if (existingUser.phone === normalizedPhone && email && existingUser.email === email) {
        message = 'WhatsApp number and email already registered';
        errorCode = 'DUPLICATE_PHONE_AND_EMAIL';
      } else if (existingUser.phone === normalizedPhone) {
        message = 'WhatsApp number already registered';
        errorCode = 'DUPLICATE_PHONE';
      } else if (email && existingUser.email === email) {
        message = 'Email already registered';
        errorCode = 'DUPLICATE_EMAIL';
      }
      return withCORS(NextResponse.json({ 
        success: false,
        message,
        error: errorCode
      }, { status: 409 }));    }
    let hashedPassword: string | null = null;
    const otp: string = generateOTP();
    const otpExpires: Date = new Date(Date.now() + 1 * 60 * 60 * 1000); // OTP berlaku 1 jam
    const otpVerificationDeadline: Date = new Date(Date.now() + 1 * 60 * 60 * 1000); // Batas verifikasi 1 jam
    let emailVerificationToken: string | null = null;
    let emailVerificationTokenExpires: Date | null = null;

    // Hash password only if provided (password is now optional for signup)
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    // If password is not provided, a temporary password will be auto-generated after OTP verification

    // Setup email verification if email is provided (optional)
    if (email) {
      emailVerificationToken = randomBytes(32).toString('hex');
      emailVerificationTokenExpires = new Date(Date.now() + 3600 * 1000); // Token email berlaku 1 jam
    }

    // Generate API key for the new user
    const apiKey = generateApiKey();    const newUser = await prisma.user.create({
      data: {
        name,
        email: email || null, // Email is optional
        phone: normalizedPhone, // Phone is mandatory
        password: hashedPassword, // Can be null if not provided during signup
        apiKey, // Auto-generated API key
        otp,
        otpExpires,
        otpVerificationDeadline,
        emailVerificationToken,
        emailVerificationTokenExpires,
        role: 'customer', // Set default role
      },
    });

    let responseMessage = 'Pengguna berhasil dibuat.';
    let nextStep = '';    // Always send OTP via WhatsApp since phone is mandatory
    const message = `Your OTP *${otp}* 

Please do not share this code with anyone.`;
    try {
      const otpResult = await sendWhatsAppMessageDetailed(normalizedPhone, message);
      if (!otpResult.success) {
        // Hapus user yang sudah dibuat jika OTP gagal dikirim
        try {
          await prisma.user.delete({ where: { id: newUser.id } });
        } catch (deleteError) {
          console.error('SIGNUP API: Failed to delete user after OTP failure:', deleteError);
        }
        console.warn(`SIGNUP API: OTP sending failed for ${normalizedPhone}. User creation rolled back.`);
        
        // Determine specific error message based on error type
        let errorMessage = 'Whatsapp service unavailable.';
        let errorCode = 'WHATSAPP_SERVICE_UNAVAILABLE';
        
        if (otpResult.error) {
          switch (otpResult.error.type) {
            case 'TIMEOUT':
              errorMessage = 'Connection to WhatsApp server timed out.';
              errorCode = 'WHATSAPP_TIMEOUT';
              break;
            case 'NETWORK_ERROR':
              errorMessage = 'Unable to connect to WhatsApp server. Please check your internet connection.';
              errorCode = 'WHATSAPP_NETWORK_ERROR';
              break;
            case 'AUTH_ERROR':
              errorMessage = 'WhatsApp service is under maintenance. Please try again later.';
              errorCode = 'WHATSAPP_AUTH_ERROR';
              break;
            case 'CONFIG_ERROR':
              errorMessage = 'WhatsApp configuration is invalid. Please contact the administrator.';
              errorCode = 'WHATSAPP_CONFIG_ERROR';
              break;
            default:
              errorMessage = 'Failed to send OTP to WhatsApp. Please try again or check your WhatsApp number.';
              errorCode = 'WHATSAPP_OTP_FAILED';
          }
        }
        
        return withCORS(NextResponse.json({
          success: false,
          message: errorMessage,
          error: errorCode,
          details: otpResult.error?.message || 'WhatsApp server is unreachable or the number is invalid.'
        }, { status: 503 }));
      }      console.log(`SIGNUP API: OTP sent successfully to ${normalizedPhone}`);
      responseMessage = 'User created successfully. An OTP has been sent to your WhatsApp number.' + 
        (!password ? ' Your password will be sent after verification.' : '');
      nextStep = 'VERIFY_OTP';
    } catch (otpError) {
      // Hapus user yang sudah dibuat jika terjadi error saat kirim OTP
      try {
        await prisma.user.delete({ where: { id: newUser.id } });
      } catch (deleteError) {
        console.error('SIGNUP API: Failed to delete user after WhatsApp error:', deleteError);
      }
      console.error('SIGNUP API: WhatsApp OTP sending error:', otpError);
      
      // Determine specific error message based on error type
      let errorMessage = 'Whatsapp service unavailable.';
      let errorCode = 'WHATSAPP_SERVICE_UNAVAILABLE';
      
      if (otpError instanceof Error) {
        if (otpError.message.includes('timeout') || otpError.message.includes('TIMEOUT')) {
          errorMessage = 'Connection to WhatsApp server timed out. Please try again.';
          errorCode = 'WHATSAPP_TIMEOUT';
        } else if (otpError.message.includes('network') || otpError.message.includes('ENOTFOUND')) {
          errorMessage = 'Unable to connect to WhatsApp server. Please check your internet connection.';
          errorCode = 'WHATSAPP_NETWORK_ERROR';
        } else if (otpError.message.includes('unauthorized') || otpError.message.includes('401')) {
          errorMessage = 'WhatsApp service is under maintenance. Please try again later.';
          errorCode = 'WHATSAPP_AUTH_ERROR';
        }
      }
        return withCORS(NextResponse.json({
        success: false,
        message: errorMessage,
        error: errorCode,
        details: 'Registration failed because OTP could not be sent'
      }, { status: 503 })); // Service Unavailable
    }    // Create response first for faster user experience
    // Create JWT session for the new user
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const sessionResult = await generateUserSession(newUser.id, {
      userAgent,
      ipAddress: ip
    });
    
    const response = withCORS(
        NextResponse.json(
            { 
                success: true,
                message: responseMessage,
                userId: newUser.id,
                token: sessionResult.token,
                nextStep: nextStep,
                phoneVerificationRequired: true, // Always true since phone is mandatory
                emailVerificationRequired: email ? true : false, // Only if email was provided
                passwordAutoGenerated: !password // Indicates if password will be auto-generated
            },
            { status: 201 }
        )
    );

    // Send verification email asynchronously (non-blocking)
    if (email) {
      setImmediate(async () => {
        try {
          const emailResult = await sendVerificationEmail(email, emailVerificationToken!);
          if (emailResult.success) {
            console.log(`SIGNUP API: Email verification sent successfully to ${email}`);
          } else {
            console.error('SIGNUP API: Email verification failed:', emailResult.error);
          }
        } catch (emailError) {
          console.error('SIGNUP API: Email verification sending error:', emailError);
        }
      });
    }    return response;
  } catch (error) {
    console.error('SIGNUP API: Error in POST handler:', error);
    
    // Tangani Prisma unique constraint errors lebih spesifik jika perlu
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        // error.meta.target berisi field yang menyebabkan unique constraint violation
        const target = (error as any).meta?.target as string[] | undefined;
        if (target?.includes('email')) {
            return withCORS(NextResponse.json({ 
                success: false,
                message: 'Email registered.',
                error: 'DUPLICATE_EMAIL'
            }, { status: 409 }));
        }
        if (target?.includes('phone')) {
            return withCORS(NextResponse.json({ 
                success: false,
                message: 'Phone number registered.',
                error: 'DUPLICATE_PHONE'
            }, { status: 409 }));
        }
        return withCORS(NextResponse.json({ 
            success: false,
            message: 'Data already registered.',
            error: 'DUPLICATE_DATA'
        }, { status: 409 }));
    }
      // Tangani database connection errors
    if (error instanceof Error && 'code' in error && (error as any).code === 'P1001') {
        return withCORS(NextResponse.json({ 
            success: false,
            message: 'Database connection error.',
            error: 'DATABASE_CONNECTION_ERROR'
        }, { status: 503 }));
    }
    
    // Generic error handling
    return withCORS(NextResponse.json({ 
        success: false,
        message: 'Internal server error.',
        error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 }));
  }
}
