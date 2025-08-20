import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";

const categorySchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_id: z.string().min(1, 'Indonesian name is required'),
  icon: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const categories = await prisma.category.findMany({
      include: {
        subcategories: true,
        addons: true,
        packages: true,
      },
    });
    return withCORS(NextResponse.json(categories));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return withCORS(NextResponse.json({ message: 'Failed to fetch categories' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const body = await request.json();
    const validation = categorySchema.safeParse(body);
    if (!validation.success) {
      return withCORS(NextResponse.json({ message: 'Validation failed', errors: validation.error.flatten() }, { status: 400 }));
    }
    const { name_en, name_id, icon } = validation.data;
    const newCategory = await prisma.category.create({
      data: {
        name_en,
        name_id,
        icon: icon ?? '',
      },
    });
    return withCORS(NextResponse.json(newCategory, { status: 201 }));
  } catch (error) {
    console.error('Error creating category:', error);
    return withCORS(NextResponse.json({ message: 'Failed to create category' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
