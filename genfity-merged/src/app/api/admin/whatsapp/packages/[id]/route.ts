import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/whatsapp/packages/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, priceMonth, priceYear, maxSession } = body;
    
    if (!name || !priceMonth || !priceYear || !maxSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, priceMonth, priceYear, and maxSession are required' 
      }, { status: 400 });
    }

    const updated = await prisma.whatsappApiPackage.update({
      where: { id },
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
      data: updated 
    });
  } catch (error) {
    console.error('Error updating WhatsApp package:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/whatsapp/packages/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.whatsappApiPackage.delete({ 
      where: { id } 
    });

    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('Error deleting WhatsApp package:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
