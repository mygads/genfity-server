import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCORS, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'Email parameter is required' 
      }, { status: 400 }));
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        emailVerificationToken: true,
        emailVerificationTokenExpires: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return withCORS(NextResponse.json({ 
        success: false,
        message: 'User not found' 
      }, { status: 404 }));
    }

    const verificationLink = user.emailVerificationToken 
      ? `${process.env.NEXTAUTH_URL}/auth/verify-email/${user.emailVerificationToken}`
      : null;

    return withCORS(NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: !!user.emailVerified,
        emailVerificationTokenExists: !!user.emailVerificationToken,
        emailVerificationTokenExpires: user.emailVerificationTokenExpires,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        verificationLink: verificationLink
      }
    }));
    
  } catch (error) {
    console.error('USER STATUS: Error:', error);
    return withCORS(NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 }));
  }
}
