import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getAdminAuth } from "@/lib/auth-helpers";

export async function OPTIONS() {
  return corsOptionsResponse();
}

const categorySchema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_id: z.string().min(1, "Indonesian name is required"),
  icon: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const params = await paramsPromise;
    const { categoryId } = params;
    if (!categoryId) {
      return withCORS(NextResponse.json({ message: "Category ID is required" }, {
        status: 400,
      }));
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        subcategories: true,
        addons: true,
        packages: true,
      },
    });

    if (!category) {
      return new NextResponse(JSON.stringify({ message: "Category not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return withCORS(NextResponse.json(category));
  } catch (error) {
    console.error("[CATEGORY_GET_BY_ID]", error);
    return withCORS(NextResponse.json({ message: "Internal server error" }, {
      status: 500,
    }));
  }
}

export async function PUT(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const params = await paramsPromise;
    const { categoryId } = params;
    if (!categoryId) {
      return withCORS(NextResponse.json({ message: "Category ID is required" }, {
        status: 400,
      }));
    }

    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(validation.error.errors, {
        status: 400,
      }));
    }    const { name_en, name_id, icon } = validation.data;

    const existingCategoryWithName = await prisma.category.findFirst({
      where: {
        name_en: name_en,
        id: { not: categoryId },
      },
    });

    if (existingCategoryWithName) {
      return withCORS(NextResponse.json({ message: "Category name already exists" }, {
        status: 409,
      }));
    }    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name_en: name_en,
        name_id: name_id,
        icon,
      },
    });

    return withCORS(NextResponse.json(updatedCategory));
  } catch (error) {
    console.error("[CATEGORY_PUT]", error);
    if ((error as any).code === 'P2025') { // Prisma error code for record not found
        return withCORS(NextResponse.json({ message: "Category not found" }, {
            status: 404,
        }));
    }
    return withCORS(NextResponse.json({ message: "Internal server error" }, {
      status: 500,
    }));
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ));
    }

    const params = await paramsPromise;
    const { categoryId } = params;
    if (!categoryId) {
      return withCORS(NextResponse.json({ message: "Category ID is required" }, {
        status: 400,
      }));
    }

    // Check if category is being used by subcategories, packages, or addons
    const relatedItems = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
            subcategories: { take: 1 },
            packages: { take: 1 },
            addons: { take: 1 },
        }
    });

    if (relatedItems?.subcategories?.length || relatedItems?.packages?.length || relatedItems?.addons?.length) {
        let message = "Cannot delete category. It is currently associated with:";
        if (relatedItems.subcategories.length) message += " subcategories";
        if (relatedItems.packages.length) message += (relatedItems.subcategories.length ? "," : "") + " packages";
        if (relatedItems.addons.length) message += (relatedItems.subcategories.length || relatedItems.packages.length ? "," : "") + " addons";
        message += ". Please remove associations before deleting.";
        return withCORS(NextResponse.json({ message }, {
            status: 409, // Conflict
        }));
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return withCORS(new NextResponse(null, { status: 204 }));
  } catch (error) {
    console.error("[CATEGORY_DELETE]", error);
    if ((error as any).code === 'P2025') { // Prisma error code for record not found
        return withCORS(NextResponse.json({ message: "Category not found" }, {
            status: 404,
        }));
    }
    return withCORS(NextResponse.json({ message: "Internal server error" }, {
      status: 500,
    }));
  }
}
