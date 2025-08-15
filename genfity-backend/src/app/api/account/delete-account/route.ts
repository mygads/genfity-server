import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCORS, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptionsResponse();
}

// Deactivate Account - Only for Admin using session auth
export async function POST(request: Request) {
  try {
    // Only session-based auth for admin dashboard
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Tidak terautentikasi. Session admin diperlukan.',
        error: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 }));
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true, name: true }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat menonaktifkan akun.',
        error: 'ACCESS_DENIED'
      }, { status: 403 }));
    }

    const { userId, reason } = await request.json();

    if (!userId) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'User ID diperlukan',
        error: 'USER_ID_REQUIRED'
      }, { status: 400 }));
    }

    // Prevent admin from deactivating their own account
    if (userId === session.user.id) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Tidak dapat menonaktifkan akun Anda sendiri',
        error: 'CANNOT_DEACTIVATE_SELF'
      }, { status: 400 }));
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        isActive: true 
      }
    });

    if (!targetUser) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Pengguna tidak ditemukan',
        error: 'USER_NOT_FOUND'
      }, { status: 404 }));
    }

    if (!targetUser.isActive) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Akun sudah dalam status nonaktif',
        error: 'ALREADY_DEACTIVATED'
      }, { status: 400 }));
    }

    // Deactivate the account
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        // Optional: store deactivation info
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Log the deactivation action
    console.log(`Admin ${adminUser.name} (${adminUser.id}) deactivated user ${targetUser.name} (${targetUser.id}). Reason: ${reason || 'No reason provided'}`);

    return withCORS(NextResponse.json({ 
      success: true,
      message: 'Akun berhasil dinonaktifkan',
      action: 'ACCOUNT_DEACTIVATED',
      deactivatedUser: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        deactivatedAt: updatedUser.updatedAt
      },
      deactivatedBy: {
        id: adminUser.id,
        name: adminUser.name
      },
      reason: reason || null
    }, { status: 200 }));

  } catch (error) {
    console.error('Deactivate account error:', error);
    
    // Handle specific Prisma errors
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if ((error as { code?: string }).code === 'P2025') {
        return withCORS(NextResponse.json({ 
          success: false,
          message: 'Pengguna tidak ditemukan',
          error: 'USER_NOT_FOUND'
        }, { status: 404 }));
      }
    }
    
    return withCORS(NextResponse.json({ 
      success: false,
      message: 'Terjadi kesalahan internal saat menonaktifkan akun',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 }));
  }
}

// Reactivate Account - Only for Admin using session auth
export async function PATCH(request: Request) {
  try {
    // Only session-based auth for admin dashboard
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Tidak terautentikasi. Session admin diperlukan.',
        error: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 }));
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true, name: true }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Akses ditolak. Hanya admin yang dapat mengaktifkan kembali akun.',
        error: 'ACCESS_DENIED'
      }, { status: 403 }));
    }

    const { userId, reason } = await request.json();

    if (!userId) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'User ID diperlukan',
        error: 'USER_ID_REQUIRED'
      }, { status: 400 }));
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        isActive: true 
      }
    });

    if (!targetUser) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Pengguna tidak ditemukan',
        error: 'USER_NOT_FOUND'
      }, { status: 404 }));
    }

    if (targetUser.isActive) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Akun sudah dalam status aktif',
        error: 'ALREADY_ACTIVE'
      }, { status: 400 }));
    }

    // Reactivate the account
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Log the reactivation action
    console.log(`Admin ${adminUser.name} (${adminUser.id}) reactivated user ${targetUser.name} (${targetUser.id}). Reason: ${reason || 'No reason provided'}`);

    return withCORS(NextResponse.json({ 
      success: true,
      message: 'Akun berhasil diaktifkan kembali',
      action: 'ACCOUNT_REACTIVATED',
      reactivatedUser: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        reactivatedAt: updatedUser.updatedAt
      },
      reactivatedBy: {
        id: adminUser.id,
        name: adminUser.name
      },
      reason: reason || null
    }, { status: 200 }));

  } catch (error) {
    console.error('Reactivate account error:', error);
    
    return withCORS(NextResponse.json({ 
      success: false,
      message: 'Terjadi kesalahan internal saat mengaktifkan kembali akun',
      error: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 }));
  }
}
