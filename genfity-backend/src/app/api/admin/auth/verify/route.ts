import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await getAdminAuth(request)
    
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Return admin user data
    return NextResponse.json({
      success: true,
      message: 'Token verified successfully',
      user: {
        id: adminAuth.id,
        email: adminAuth.email,
        role: adminAuth.role,
      }
    })

  } catch (error) {
    console.error('[API] Admin token verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
