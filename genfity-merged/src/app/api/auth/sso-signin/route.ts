import { NextResponse } from "next/server";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessageDetailed } from "@/lib/whatsapp";
import { sendSSOLoginOtpEmail } from "@/services/mailer";
import { normalizePhoneNumber } from "@/lib/auth";

// Generate 4-digit OTP for SSO login
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    const { identifier, method } = await request.json();
    
    if (!identifier) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "Email or phone number is required",
        error: 'MISSING_IDENTIFIER'
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
          emailVerified: true,
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
          emailVerified: true,
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
    }    // Block unverified email logins, but allow WhatsApp SSO
    if (isEmail && !user.emailVerified && method !== 'whatsapp') {
      return withCORS(NextResponse.json({ 
        success: false,
        message: "Email is not verified. Please verify your email first or use WhatsApp login.",
        error: 'EMAIL_NOT_VERIFIED'
      }, { status: 400 }));
    }    // Rate limiting - prevent spam requests (1 minute cooldown)
    if (user.ssoLastRequestAt) {
      const timeSinceLastRequest = Date.now() - new Date(user.ssoLastRequestAt).getTime();
      const rateLimitDuration = 60 * 1000; // 1 minute in milliseconds
      
      if (timeSinceLastRequest < rateLimitDuration) {
        const timeLeft = Math.ceil((rateLimitDuration - timeSinceLastRequest) / 1000);
        return withCORS(NextResponse.json({ 
          success: false,
          message: `Please wait ${timeLeft} seconds before requesting another OTP`,
          error: 'RATE_LIMITED'
        }, { status: 429 }));
      }
    }

    // Generate OTP
    const ssoOtp = generateOTP();

    // Update user with SSO OTP (valid for 1 hour) and track request time
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ssoOtp,
        ssoOtpExpires: new Date(Date.now() + 60 * 60 * 1000), // OTP valid for 1 hour
        ssoLastRequestAt: new Date() // Track when this OTP was requested for rate limiting
      }
    });

    // Send OTP via appropriate method
    const useEmailMethod = method === 'email' || (isEmail && method !== 'whatsapp');
    
    if (useEmailMethod && user.email) {
      const emailResult = await sendSSOLoginOtpEmail(user.email, ssoOtp, user.name);
      
      if (!emailResult.success) {
        console.error('Failed to send SSO login email OTP:', emailResult.error);
        return withCORS(NextResponse.json({ 
          success: false,
          message: 'Failed to send login OTP email. Please try again.',
          error: 'EMAIL_SEND_FAILED'
        }, { status: 500 }));
      }

      console.log(`SSO login OTP sent successfully to email ${user.email}`);
      return withCORS(NextResponse.json({
        success: true,
        message: `Login OTP has been sent to ${user.email}. Please check your inbox.`,
        data: {
          method: 'email',
          identifier: user.email,
          nextStep: 'VERIFY_OTP',
          expiresIn: 60 // minutes (1 hour)
        }
      }));    } else {
      // Send OTP via WhatsApp
      const message = `Your login OTP: *${ssoOtp}*

Please do not share this code with anyone. The code is valid for 1 hour.

If you did not request this login, please ignore this message.`;
      
      try {
        const otpResult = await sendWhatsAppMessageDetailed(user.phone!, message);
        
        if (otpResult.success) {
          console.log(`SSO login OTP sent successfully to WhatsApp ${user.phone}`);
          return withCORS(NextResponse.json({
            success: true,
            message: `Login OTP has been sent to your WhatsApp ${user.phone}. Please check your messages.`,
            data: {
              method: 'whatsapp',
              identifier: user.phone,
              nextStep: 'VERIFY_OTP',
              expiresIn: 60 // minutes (1 hour)
            }
          }));
        } else {// Determine specific error message based on error type
          let errorMessage = 'WhatsApp service is temporarily unavailable. Please try again in a few minutes.';
          let errorCode = 'WHATSAPP_SERVICE_UNAVAILABLE';
          
          if (otpResult.error) {
            switch (otpResult.error.type) {
              case 'TIMEOUT':
                errorMessage = 'WhatsApp connection timeout. Please try again.';
                errorCode = 'WHATSAPP_TIMEOUT';
                break;
              case 'NETWORK_ERROR':
                errorMessage = 'Cannot connect to WhatsApp server. Please check your internet connection.';
                errorCode = 'WHATSAPP_NETWORK_ERROR';
                break;
              case 'AUTH_ERROR':
                errorMessage = 'WhatsApp service is under maintenance. Please try again later.';
                errorCode = 'WHATSAPP_AUTH_ERROR';
                break;
              case 'CONFIG_ERROR':
                errorMessage = 'WhatsApp configuration error. Please contact administrator.';
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
            details: otpResult.error?.message || 'WhatsApp server unreachable'
          }, { status: 503 }));
        }
      } catch (error) {
        console.error("SSO OTP WhatsApp error:", error);
        return withCORS(NextResponse.json({
          success: false,
          message: "Failed to send OTP to WhatsApp",
          error: 'WHATSAPP_SERVICE_ERROR'
        }, { status: 500 }));
      }
    }
  } catch (error) {
    console.error("SSO signin error:", error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: "Internal server error",
      error: 'INTERNAL_ERROR'
    }, { status: 500 }));
  }
}
