import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import jwt from 'jsonwebtoken';

// Helper function to verify admin JWT token
async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    // Check if user has admin role (you may need to adjust this based on your JWT payload structure)
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// PUT /api/admin/addon-deliveries/[id] - Update addon delivery
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminUser = await verifyAdminToken(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, driveUrl, fileAssets, notes, deliveredAt } = body;

    // Validate status if provided
    if (status && !['pending', 'in_progress', 'delivered'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, in_progress, or delivered' },
        { status: 400 }
      );
    }

    // Check if delivery exists
    const existingDelivery = await prisma.servicesAddonsCustomers.findUnique({
      where: { id },
      include: {
        transaction: {
          select: { id: true, status: true }
        }
      }
    });

    if (!existingDelivery) {
      return NextResponse.json(
        { error: 'Addon delivery not found' },
        { status: 404 }
      );
    }

    // Update the delivery
    const updatedDelivery = await prisma.servicesAddonsCustomers.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(driveUrl !== undefined && { driveUrl }),
        ...(fileAssets !== undefined && { fileAssets }),
        ...(notes !== undefined && { notes }),
        ...(deliveredAt !== undefined && { deliveredAt: deliveredAt ? new Date(deliveredAt) : null }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        transaction: {
          select: {
            id: true,
            status: true,
            finalAmount: true,
            currency: true,
            createdAt: true
          }
        }
      }
    });

    return withCORS(NextResponse.json({
      success: true,
      data: updatedDelivery
    }));

  } catch (error) {
    console.error('[ADDON_DELIVERY_PUT]', error);
    return withCORS(NextResponse.json(
      { error: 'Failed to update addon delivery' },
      { status: 500 }
    ));
  }
}

// GET /api/admin/addon-deliveries/[id] - Get single addon delivery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminUser = await verifyAdminToken(request);
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get the delivery with related data
    const delivery = await prisma.servicesAddonsCustomers.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        transaction: {
          select: {
            id: true,
            status: true,
            finalAmount: true,
            currency: true,
            createdAt: true,            addonTransactions: {
              include: {
                addon: {
                  select: {
                    id: true,
                    name_en: true,
                    name_id: true,
                    description_en: true,
                    description_id: true,
                    price_idr: true,
                    price_usd: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Addon delivery not found' },
        { status: 404 }
      );
    }

    return withCORS(NextResponse.json({
      success: true,
      data: delivery
    }));

  } catch (error) {
    console.error('[ADDON_DELIVERY_GET]', error);
    return withCORS(NextResponse.json(
      { error: 'Failed to fetch addon delivery' },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
