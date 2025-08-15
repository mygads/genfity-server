import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/mailer';
import { randomBytes } from 'crypto';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import jwt from 'jsonwebtoken';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    // Check for session-based auth (admin dashboard)
    const session = await getServerSession(authOptions);
    
    // Check for JWT token (customer API)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    let userId: string | null = null;
    let userEmail: string | null = null;
    let authType: 'session' | 'jwt' = 'session';

    // Determine authentication method and get user info
    if (session?.user?.id && session?.user?.email) {
      userId = session.user.id;
      userEmail = session.user.email;
      authType = 'session';
    } else if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        userId = decoded.userId;
        authType = 'jwt';
        // For JWT, we'll get email from database
      } catch (jwtError) {
        return withCORS(NextResponse.json({ 
          success: false,
          message: 'Token tidak valid',
          error: 'INVALID_TOKEN'
        }, { status: 401 }));
      }
    }

    if (!userId) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Tidak terautentikasi. Session atau token diperlukan.',
        error: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 }));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        emailVerificationToken: true,
        emailVerificationTokenExpires: true
      }
    });

    if (!user) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Pengguna tidak ditemukan',
        error: 'USER_NOT_FOUND'
      }, { status: 404 }));
    }

    if (!user.email) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Email tidak ditemukan untuk pengguna ini',
        error: 'EMAIL_NOT_FOUND'
      }, { status: 400 }));
    }

    if (user.emailVerified) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Email sudah diverifikasi sebelumnya',
        error: 'EMAIL_ALREADY_VERIFIED'
      }, { status: 400 }));
    }

    // Buat token verifikasi baru
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationTokenExpires = new Date(Date.now() + 3600 * 1000); // 1 jam dari sekarang

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationTokenExpires,
      },
    });

    // Kirim email verifikasi dengan token-based URL
    const emailResult = await sendVerificationEmail(user.email, emailVerificationToken, user.name);

    if (!emailResult.success) {
      console.error('Resend verification email - mailer error:', emailResult.error);
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Gagal mengirim email verifikasi. Token telah direset, silakan coba lagi.',
        error: 'EMAIL_SEND_FAILED',
        details: emailResult.error
      }, { status: 500 }));
    }

    return withCORS(NextResponse.json({ 
      success: true,
      message: 'Email verifikasi telah dikirim ulang. Silakan cek kotak masuk Anda.',
      authType: authType,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, { status: 200 }));

  } catch (error) {
    console.error('Resend verification email error:', error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: 'Terjadi kesalahan internal',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 }));
  }
}
