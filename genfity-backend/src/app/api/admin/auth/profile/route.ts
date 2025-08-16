import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminAuth = await getAdminAuth(request)
    
    if (!adminAuth) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, email } = await request.json()

    if (!name && !email) {
      return NextResponse.json(
        { success: false, message: 'Name or email is required' },
        { status: 400 }
      )
    }

    // Update user profile
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email.toLowerCase()

    const updatedUser = await prisma.user.update({
      where: { id: adminAuth.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('[API] Admin profile update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
