import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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
    let authType: 'session' | 'jwt' = 'session';

    // Determine authentication method and get user ID
    if (session?.user?.id) {
      userId = session.user.id;
      authType = 'session';
    } else if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        userId = decoded.userId;
        authType = 'jwt';
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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Kata sandi saat ini dan kata sandi baru diperlukan',
        error: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 }));
    }

    if (newPassword.length < 6) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Kata sandi baru minimal 6 karakter',
        error: 'PASSWORD_TOO_SHORT'
      }, { status: 400 }));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        role: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Pengguna tidak ditemukan',
        error: 'USER_NOT_FOUND'
      }, { status: 404 }));
    }

    if (!user.password) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Pengguna tidak memiliki kata sandi (mungkin login via OAuth)',
        error: 'NO_PASSWORD_SET'
      }, { status: 400 }));
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Kata sandi saat ini salah',
        error: 'INCORRECT_PASSWORD'
      }, { status: 403 }));
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return withCORS(NextResponse.json({ 
      success: true,
      message: 'Kata sandi berhasil diubah',
      authType: authType,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    }, { status: 200 }));

  } catch (error) {
    console.error('Change password error:', error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: 'Terjadi kesalahan internal',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 }));
  }
}
