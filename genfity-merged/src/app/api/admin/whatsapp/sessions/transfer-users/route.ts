import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from '@/lib/cors';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Get list of users for session transfer
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all non-admin users
    const users = await prisma.user.findMany({
      where: {
        role: 'customer' // Only customers can receive transferred sessions
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        _count: {
          select: {
            whatsAppSessions: true
          }
        }
      },
      orderBy: [
        { name: 'asc' },
        { email: 'asc' }
      ]
    });

    return withCORS(NextResponse.json({
      success: true,
      data: users
    }));

  } catch (error) {
    console.error('Get users for transfer error:', error);
    return withCORS(NextResponse.json(
      { success: false, error: 'Failed to get users list' },
      { status: 500 }
    ));
  }
}
