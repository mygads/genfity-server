import nodemailer from 'nodemailer';

// Interface untuk opsi email
interface MailOptions {
    from?: string;
    to: string;
    subject: string;
    html: string;
}

export interface MailerResponse {
    success: boolean;
    message?: string;
    error?: unknown;
}

// Modern responsive email template with professional design
const getEmailTemplate = (content: string, title: string, headerIcon?: string) => {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://api.genfity.com';
    
    // Simplified logo display with better fallback
    const logoDisplay = `
        <div style="text-align: center;">
            <img 
                src="${baseUrl}/logo-light.svg" 
                alt="GENFITY" 
                width="80"
                height="32" 
                style="display: inline-block; max-width: 80px; height: auto;" 
                onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';"
            />
            <span style="display: none; font-family: system-ui, -apple-system, sans-serif; font-size: 18px; font-weight: 700; color: #23284e; letter-spacing: -0.5px;">GENFITY</span>
        </div>
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>${title} - GENFITY</title>
            <style>
                @media only screen and (max-width: 600px) {
                    .email-container { width: 100% !important; margin: 0 !important; }
                    .email-content { padding: 20px !important; }
                    .email-header { padding: 30px 20px !important; }
                    .email-title { font-size: 1.5rem !important; }
                    .otp-code { font-size: 2rem !important; letter-spacing: 4px !important; }
                    .button { padding: 12px 24px !important; font-size: 14px !important; }
                }
                @media only screen and (max-width: 480px) {
                    .email-content { padding: 15px !important; }
                    .email-header { padding: 25px 15px !important; }
                    .otp-code { font-size: 1.8rem !important; letter-spacing: 3px !important; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #f8fafc; line-height: 1.6;">
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);">
                <div class="email-container" style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
                    
                    <!-- Compact Header -->
                    <div class="email-header" style="background: linear-gradient(135deg, #23284e 0%, #1e293b 100%); padding: 32px 24px; text-align: center;">
                        <div style="margin-bottom: 16px;">
                            ${logoDisplay}
                        </div>
                        <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 600; letter-spacing: -0.3px;">GENFITY</h1>
                        <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0 0; font-weight: 400;">Digital Solutions Platform</p>
                    </div>
                    
                    <!-- Content Area -->
                    <div class="email-content" style="padding: 32px 24px;">
                        <h2 class="email-title" style="color: #1e293b; font-size: 1.75rem; margin: 0 0 20px 0; font-weight: 600; line-height: 1.3; text-align: center;">${title}</h2>
                        <div style="text-align: center;">
                            ${content}
                        </div>
                        
                        <!-- Support Section -->
                        <div style="margin-top: 36px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #475569; font-size: 14px; margin: 0 0 12px 0; font-weight: 500;">Need help?</p>
                            <a href="mailto:support@genfity.com" style="display: inline-block; background: #23284e; color: #ffffff; text-decoration: none; font-weight: 500; padding: 10px 20px; border-radius: 6px; font-size: 14px;">Contact Support</a>
                        </div>
                        
                        <!-- Footer -->
                        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">
                                This email was sent automatically. Please do not reply.
                            </p>
                            <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                                &copy; ${new Date().getFullYear()} GENFITY. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Footer Note -->
            <div style="text-align: center; margin-top: 20px;">
                <p style="color: #64748b; font-size: 12px; margin: 0;">
                    Having trouble viewing this email? Contact our support team.
                </p>
            </div>
        </body>
        </html>
    `;
};

// Compact OTP email template with modern design
const getOTPEmailContent = (otp: string, userName: string | null, purpose: string, validityMinutes: number = 10) => {
    const purposeText = {
        'email-verification': 'verify your email address',
        'password-reset': 'reset your account password', 
        'sso-login': 'complete your secure login'
    }[purpose] || 'complete your verification';

    return `
        <div style="text-align: center; margin-bottom: 24px;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 4px 0; font-weight: 500;">
                Hello ${userName || 'User'} 👋
            </p>
        </div>
        
        <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 20px 0; line-height: 1.5;">
                To ${purposeText}, please use this verification code:
            </p>
            
            <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 16px 0; border: 2px solid #23284e;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                    Verification Code
                </p>
                <div class="otp-code" style="font-family: 'Courier New', monospace; font-size: 2.2rem; font-weight: 700; color: #23284e; letter-spacing: 6px; margin: 12px 0;">
                    ${otp}
                </div>
                <p style="color: #dc2626; font-size: 13px; margin: 12px 0 0 0; font-weight: 500;">
                    ⏰ Valid for ${validityMinutes} minutes
                </p>
            </div>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 14px; margin-right: 6px;">🔐</span>
                <strong style="color: #92400e; font-size: 13px;">Security Notice</strong>
            </div>
            <p style="color: #78350f; font-size: 12px; margin: 0; line-height: 1.4;">
                Never share this code. GENFITY will never ask for your verification code.
            </p>
        </div>
        
        <p style="color: #64748b; font-size: 13px; margin: 20px 0 0 0; text-align: center; line-height: 1.5;">
            If you didn't request this, please ignore this email or contact support.
        </p>
    `;
};

// Compact verification link template
const getVerificationLinkContent = (verificationLink: string, userName: string | null) => {
    return `
        <div style="text-align: center; margin-bottom: 24px;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 4px 0; font-weight: 500;">
                Hello ${userName || 'User'} 👋
            </p>
            <p style="color: #64748b; font-size: 14px; margin: 0;">
                Welcome to GENFITY
            </p>
        </div>
        
        <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin: 20px 0; border: 1px solid #22c55e;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 20px 0; text-align: center; line-height: 1.5;">
                To activate your account, please verify your email address. Click the button below to get started:
            </p>
            
            <div style="text-align: center; margin: 24px 0;">
                <a href="${verificationLink}" class="button" style="display: inline-block; background: #23284e; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 15px;">
                    ✅ Verify Email Address
                </a>
            </div>
            
            <p style="color: #64748b; font-size: 13px; margin: 16px 0 0 0; text-align: center;">
                Button not working? Copy this link:
            </p>
            <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 12px 0; border: 1px solid #e2e8f0; word-break: break-all; text-align: center;">
                <a href="${verificationLink}" style="color: #23284e; text-decoration: none; font-size: 12px; font-family: monospace;">${verificationLink}</a>
            </div>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 14px; margin-right: 6px;">⏰</span>
                <strong style="color: #92400e; font-size: 13px;">Important</strong>
            </div>
            <p style="color: #78350f; font-size: 12px; margin: 0; line-height: 1.4;">
                This verification link is valid for <strong>1 hour</strong>. You can request a new one if it expires.
            </p>
        </div>
        
        <p style="color: #64748b; font-size: 13px; margin: 20px 0 0 0; text-align: center; line-height: 1.5;">
            If you didn't create an account, please ignore this email.
        </p>
    `;
};

// Enhanced Nodemailer configuration with better error handling
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || "465"),
    secure: process.env.EMAIL_SERVER_PORT === "465",
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    // Enhanced connection settings
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
});

/**
 * Enhanced email verification function with brand identity
 * @param email Email address
 * @param token Verification token for auto-verification URL
 * @param name User name (optional)
 */
export async function sendVerificationEmail(email: string, token: string, name?: string | null): Promise<MailerResponse> {
    const verificationLink = `${process.env.NEXTAUTH_URL}/auth/verify-email/${token}`;
    const userName = name || 'User';

    const mailOptions: MailOptions = {
        from: `"GENFITY OFFICIAL" <${process.env.EMAIL_TITLE_USER}>`,
        to: email,
        subject: 'Verify Your Email Address - GENFITY',
        html: getEmailTemplate(getVerificationLinkContent(verificationLink, userName), 'Email Verification'),
    };

    try {
        if (process.env.NODE_ENV === 'production' || (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)) {
            console.log(`Mailer: Sending verification email to ${email}...`);
            const result = await transporter.sendMail(mailOptions);
            console.log(`Mailer: Email sent successfully to ${email}. MessageId: ${result.messageId}`);
            return { success: true, message: 'Verification email sent successfully.' };
        } else {
            console.log(`Mailer: DEVELOPMENT MODE: Email verification NOT SENT.`);
            console.log(`Mailer: Verification link for ${email}: ${verificationLink}`);
            return { success: true, message: 'Development mode: Email not sent.' };
        }
    } catch (error: unknown) {
        console.error(`Mailer: Failed to send verification email to ${email}. Error:`, error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to send verification email.',
            message: 'Failed to send verification email.'
        };
    }
}

/**
 * Send email OTP for verification
 * @param email Email address
 * @param otp 4-digit OTP code
 * @param userName User name
 */
export async function sendEmailOtpVerification(email: string, otp: string, userName: string | null): Promise<MailerResponse> {
    const mailOptions: MailOptions = {
        from: `"GENFITY OFFICIAL" <${process.env.EMAIL_TITLE_USER}>`,
        to: email,
        subject: 'Email Verification Code - GENFITY',
        html: getEmailTemplate(getOTPEmailContent(otp, userName, 'email-verification', 10), 'Email Verification'),
    };

    try {
        if (process.env.NODE_ENV === 'production' || (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)) {
            console.log(`Mailer: Sending email OTP to ${email}...`);
            const result = await transporter.sendMail(mailOptions);
            console.log(`Mailer: Email OTP sent successfully to ${email}. MessageId: ${result.messageId}`);
        return { success: true, message: 'Email OTP sent successfully.' };
        } else {
            console.log(`Mailer: DEVELOPMENT MODE: Email OTP NOT SENT to ${email}. OTP: ${otp}`);
            return { success: true, message: 'Development mode: Email OTP not sent.' };
        }
    } catch (error: unknown) {
        console.error(`Mailer: Failed to send email OTP to ${email}. Error:`, error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to send email OTP.',
            message: 'Failed to send email OTP.'
        };
    }
}

/**
 * Enhanced password reset email with token
 * @param email Email address
 * @param token Reset token
 * @param userName User name
 */
export async function sendPasswordResetEmail(email: string, token: string, userName?: string | null): Promise<MailerResponse> {
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password/${token}`;
    
    const resetContent = `
        <div style="text-align: center; margin-bottom: 24px;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 4px 0; font-weight: 500;">
                Hello ${userName || 'User'} 👋
            </p>
            <p style="color: #64748b; font-size: 14px; margin: 0;">
                Password Reset Request
            </p>
        </div>
        
        <div style="background: #fef3c7; padding: 24px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b;">
            <p style="color: #334155; font-size: 15px; margin: 0 0 20px 0; text-align: center; line-height: 1.5;">
                We received a request to reset your password. Click the button below to proceed:
            </p>
            
            <div style="text-align: center; margin: 24px 0;">
                <a href="${resetLink}" class="button" style="display: inline-block; background: #f59e0b; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 15px;">
                    🔑 Reset Password
                </a>
            </div>
            
            <p style="color: #78350f; font-size: 13px; margin: 16px 0 0 0; text-align: center;">
                Link not working? Copy this URL:
            </p>
            <div style="background: #ffffff; padding: 12px; border-radius: 6px; margin: 12px 0; border: 1px solid #e2e8f0; word-break: break-all; text-align: center;">
                <a href="${resetLink}" style="color: #f59e0b; text-decoration: none; font-size: 12px; font-family: monospace;">${resetLink}</a>
            </div>
        </div>
        
        <div style="background: #fecaca; border: 1px solid #dc2626; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 14px; margin-right: 6px;">⚠️</span>
                <strong style="color: #991b1b; font-size: 13px;">Security Alert</strong>
            </div>
            <p style="color: #7f1d1d; font-size: 12px; margin: 0; line-height: 1.4;">
                This reset link is valid for <strong>1 hour</strong>. If you didn't request this, contact support.
            </p>
        </div>
        
        <p style="color: #64748b; font-size: 13px; margin: 20px 0 0 0; text-align: center; line-height: 1.5;">
            Having trouble? Contact our support team for assistance.
        </p>
    `;

    const mailOptions: MailOptions = {
        from: `"GENFITY OFFICIAL" <${process.env.EMAIL_TITLE_USER}>`,
        to: email,
        subject: 'Reset Your Account Password - GENFITY',
        html: getEmailTemplate(resetContent, 'Password Reset'),
    };

    try {
        if (process.env.NODE_ENV === 'production' || (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)) {
            console.log(`Mailer: Sending password reset email to ${email}...`);
            const result = await transporter.sendMail(mailOptions);
            console.log(`Mailer: Password reset email sent successfully to ${email}. MessageId: ${result.messageId}`);
        return { success: true, message: 'Password reset email sent successfully.' };
        } else {
            console.log(`Mailer: DEVELOPMENT MODE: Password reset email NOT SENT to ${email}. Link: ${resetLink}`);
            return { success: true, message: 'Development mode: Password reset email not sent.' };
        }
    } catch (error: unknown) {
        console.error(`Mailer: Failed to send password reset email to ${email}. Error:`, error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to send password reset email.',
            message: 'Failed to send password reset email.'
        };
    }
}

/**
 * Send password reset OTP email
 * @param email Email address
 * @param otp 4-digit OTP code
 * @param userName User name
 */
export async function sendPasswordResetOtpEmail(email: string, otp: string, userName: string | null): Promise<MailerResponse> {
    const mailOptions: MailOptions = {
        from: `"GENFITY OFFICIAL" <${process.env.EMAIL_TITLE_USER}>`,
        to: email,
        subject: 'Password Reset Code - GENFITY',
        html: getEmailTemplate(getOTPEmailContent(otp, userName, 'password-reset', 10), 'Password Reset'),
    };

    try {
        if (process.env.NODE_ENV === 'production' || (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)) {
            console.log(`Mailer: Sending password reset OTP to ${email}...`);
            const result = await transporter.sendMail(mailOptions);
            console.log(`Mailer: Password reset OTP sent successfully to ${email}. MessageId: ${result.messageId}`);
            return { success: true, message: 'Password reset OTP sent successfully.' };
        } else {
            console.log(`Mailer: DEVELOPMENT MODE: Password reset OTP NOT SENT to ${email}. OTP: ${otp}`);
        return { success: true, message: 'Development mode: Password reset OTP not sent.' };
        }
    } catch (error: unknown) {
        console.error(`Mailer: Failed to send password reset OTP to ${email}. Error:`, error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to send password reset OTP.',
            message: 'Failed to send password reset OTP.'
        };
    }
}

/**
 * Send SSO login OTP email
 * @param email Email address
 * @param otp 4-digit OTP code  
 * @param userName User name
 */
export async function sendSSOLoginOtpEmail(email: string, otp: string, userName: string | null): Promise<MailerResponse> {
    const mailOptions: MailOptions = {
        from: `"GENFITY OFFICIAL" <${process.env.EMAIL_TITLE_USER}>`,
        to: email,
        subject: 'Secure Login Code - GENFITY',
        html: getEmailTemplate(getOTPEmailContent(otp, userName, 'sso-login', 10), 'Secure Login'),
    };

    try {
        if (process.env.NODE_ENV === 'production' || (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD)) {
            console.log(`Mailer: Sending SSO login OTP to ${email}...`);
            const result = await transporter.sendMail(mailOptions);
            console.log(`Mailer: SSO login OTP sent successfully to ${email}. MessageId: ${result.messageId}`);
            return { success: true, message: 'SSO login OTP sent successfully.' };
        } else {
            console.log(`Mailer: DEVELOPMENT MODE: SSO login OTP NOT SENT to ${email}. OTP: ${otp}`);
            return { success: true, message: 'Development mode: SSO login OTP not sent.' };
        }
    } catch (error: unknown) {
        console.error(`Mailer: Failed to send SSO login OTP to ${email}. Error:`, error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to send SSO login OTP.',
            message: 'Failed to send SSO login OTP.'
        };
    }
}
