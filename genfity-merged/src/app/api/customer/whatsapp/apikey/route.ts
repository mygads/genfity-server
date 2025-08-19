import { NextRequest, NextResponse } from 'next/server';
import { getCustomerAuth } from '@/lib/auth-helpers';
import { hasActiveWhatsAppSubscription } from '@/lib/whatsapp-subscription';
import { generateApiKey } from '@/lib/api-key';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const customerAuth = await getCustomerAuth(request);
    if (!customerAuth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = customerAuth.id;

    // Validate subscription
    const hasSubscription = await hasActiveWhatsAppSubscription(userId);
    if (!hasSubscription) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No active WhatsApp subscription found' 
        },
        { status: 403 }
      );
    }

    // Check if user already has an API key
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { apiKey: true, createdAt: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // If no API key exists, create one
    if (!user.apiKey) {
      const newApiKey = generateApiKey();
      
      user = await prisma.user.update({
        where: { id: userId },
        data: { apiKey: newApiKey },
        select: { apiKey: true, createdAt: true }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        apiKey: user.apiKey,
        name: 'WhatsApp Service API Key',
        isActive: true,
        createdAt: user.createdAt
      },
      message: 'API key retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting API key:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const customerAuth = await getCustomerAuth(request);
    if (!customerAuth) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = customerAuth.id;

    // Validate subscription
    const hasSubscription = await hasActiveWhatsAppSubscription(userId);
    if (!hasSubscription) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No active WhatsApp subscription found' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // Generate new API key and update user
    const newApiKey = generateApiKey();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { apiKey: newApiKey },
      select: { apiKey: true, createdAt: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: updatedUser.apiKey,
        name: name || 'WhatsApp Service API Key',
        isActive: true,
        createdAt: updatedUser.createdAt
      },
      message: 'New API key generated successfully'
    });

  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
