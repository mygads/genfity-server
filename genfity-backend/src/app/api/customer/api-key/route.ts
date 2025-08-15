import { NextResponse } from 'next/server';
import { getCustomerAuth } from '@/lib/auth-helpers';
import { getOrCreateUserApiKey, regenerateApiKey } from '@/lib/api-key';

// GET /api/customer/api-key - Get current API key
export async function GET(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const apiKey = await getOrCreateUserApiKey(userAuth.id);

    return NextResponse.json({
      success: true,
      data: {
        apiKey,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[API KEY] Get API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve API key' },
      { status: 500 }
    );
  }
}

// POST /api/customer/api-key - Regenerate API key
export async function POST(request: Request) {
  try {
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const newApiKey = await regenerateApiKey(userAuth.id);

    return NextResponse.json({
      success: true,
      data: {
        apiKey: newApiKey,
        regeneratedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[API KEY] Regenerate API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to regenerate API key' },
      { status: 500 }
    );
  }
}
