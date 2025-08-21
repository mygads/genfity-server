import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/admin/whatsapp/packages
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const packages = await prisma.whatsappApiPackage.findMany({
      orderBy: { priceMonth: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        priceMonth: true,
        priceYear: true,
        maxSession: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: packages 
    });
  } catch (error) {
    console.error('Error fetching WhatsApp packages:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/admin/whatsapp/packages
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, priceMonth, priceYear, maxSession } = body;
    
    if (!name || !priceMonth || !priceYear || !maxSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, priceMonth, priceYear, and maxSession are required' 
      }, { status: 400 });
    }

    const created = await prisma.whatsappApiPackage.create({
      data: {
        name,
        description: description || null,
        priceMonth: Number(priceMonth),
        priceYear: Number(priceYear),
        maxSession: Number(maxSession),
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: created 
    });
  } catch (error) {
    console.error('Error creating WhatsApp package:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
