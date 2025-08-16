import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateUserSession } from '@/lib/jwt-session-manager'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find admin user by email
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        isActive: true,
        role: {
          in: ['admin', 'super_admin']
        }
      },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials or insufficient privileges' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT session
    const deviceInfo = {
      userAgent: request.headers.get('user-agent') || 'Unknown',
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'Unknown'
    }

    const sessionData = await generateUserSession(user.id, deviceInfo)

    // Return user data without sensitive information
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    }

    return NextResponse.json({
      success: true,
      message: 'Admin login successful',
      user: userData,
      token: sessionData.token,
    })

  } catch (error) {
    console.error('[API] Admin signin error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
