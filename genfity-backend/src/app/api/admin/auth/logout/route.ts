import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await getAdminAuth(request)
    
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Invalidate session if sessionId is available
    if (adminAuth.sessionId) {
      await prisma.userSession.update({
        where: { id: adminAuth.sessionId },
        data: { isActive: false }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('[API] Admin logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
