import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withCORS, corsOptionsResponse } from '@/lib/cors';
import { getUserFromToken } from '@/lib/auth-helpers';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: Request) {
  try {
    // Get user from JWT token (universal for all authenticated users)
    const userAuth = await getUserFromToken(request);
    
    if (!userAuth?.id) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Authentication required. Please provide a valid JWT token.',
        error: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 }));
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Current password and new password are required',
        error: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 }));
    }

    if (newPassword.length < 6) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'New password must be at least 6 characters',
        error: 'PASSWORD_TOO_SHORT'
      }, { status: 400 }));
    }

    const user = await prisma.user.findUnique({
      where: { id: userAuth.id },
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
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      }, { status: 404 }));
    }

    if (!user.password) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'User does not have a password set',
        error: 'NO_PASSWORD_SET'
      }, { status: 400 }));
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Current password is incorrect',
        error: 'INCORRECT_PASSWORD'
      }, { status: 403 }));
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'New password must be different from current password',
        error: 'SAME_PASSWORD'
      }, { status: 400 }));
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userAuth.id },
      data: { password: hashedNewPassword },
    });

    return withCORS(NextResponse.json({ 
      success: true,
      message: 'Password changed successfully',
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
      message: 'Internal server error',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 }));
  }
}
