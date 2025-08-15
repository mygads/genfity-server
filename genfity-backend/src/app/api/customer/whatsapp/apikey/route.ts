import { NextRequest, NextResponse } from 'next/server';
import { getCustomerAuth } from '@/lib/auth-helpers';
import { hasActiveWhatsAppSubscription } from '@/lib/whatsapp-subscription';
import { generateApiKey } from '@/lib/api-key';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    let existingApiKey = await prisma.apiKey.findFirst({
      where: { userId }
    });

    // If no API key exists, create one
    if (!existingApiKey) {
      const newApiKey = generateApiKey();
      
      existingApiKey = await prisma.apiKey.create({
        data: {
          id: newApiKey,
          userId,
          name: 'WhatsApp Service API Key',
          isActive: true,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        apiKey: existingApiKey.id,
        name: existingApiKey.name,
        isActive: existingApiKey.isActive,
        createdAt: existingApiKey.createdAt
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

    // Generate new API key
    const newApiKey = generateApiKey();

    // Deactivate existing API keys
    await prisma.apiKey.updateMany({
      where: { userId },
      data: { isActive: false }
    });

    // Create new API key
    const apiKey = await prisma.apiKey.create({
      data: {
        id: newApiKey,
        userId,
        name: name || 'WhatsApp Service API Key',
        isActive: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: apiKey.id,
        name: apiKey.name,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt
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
