import { NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/services/mailer';
import { randomBytes } from 'crypto';
import { withCORS, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    // Check for JWT token authentication
    const userAuth = await getUserFromToken(request);

    if (!userAuth) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Tidak terautentikasi. Token diperlukan.',
        error: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 }));
    }

    const user = await prisma.user.findUnique({
      where: { id: userAuth.id },
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
