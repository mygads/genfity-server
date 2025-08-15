import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';

const featureSchema = z.object({
  id: z.string().cuid().optional(),
  name_en: z.string().min(1, "Feature name (EN) is required").optional(),
  name_id: z.string().min(1, "Feature name (ID) is required").optional(),
  included: z.boolean(),
});

const packageUpdateSchema = z.object({
  name_en: z.string().min(1, "Name (EN) is required").optional(),
  name_id: z.string().min(1, "Name (ID) is required").optional(),
  description_en: z.string().min(1, "Description (EN) is required").optional(),
  description_id: z.string().min(1, "Description (ID) is required").optional(),
  price_idr: z.number().positive("Price IDR must be a positive number").optional(),
  price_usd: z.number().positive("Price USD must be a positive number").optional(),
  image: z.string().url("Image must be a valid URL").optional(),
  categoryId: z.string().cuid("Invalid Category ID").optional(),
  subcategoryId: z.string().cuid("Invalid Subcategory ID").optional(),
  popular: z.boolean().optional(),
  bgColor: z.string().optional().nullable(),
  features: z.array(featureSchema).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await context.params;
    if (!packageId) {
      return new NextResponse(JSON.stringify({ message: "Package ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        category: true,
        subcategory: true,
        features: true,
      },
    });

    if (!pkg) {
      return new NextResponse(JSON.stringify({ message: "Package not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("[PACKAGE_GET_BY_ID]", error);
    return new NextResponse(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await context.params;
    if (!packageId) {
      return new NextResponse(JSON.stringify({ message: "Package ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const validation = packageUpdateSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify(validation.error.errors), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { features, ...packageUpdateData } = validation.data;

    if (Object.keys(packageUpdateData).length === 0 && !features) {
        return new NextResponse(JSON.stringify({ message: "No fields to update" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const currentPackage = await prisma.package.findUnique({
        where: { id: packageId }
    });

    if (!currentPackage) {
        return new NextResponse(JSON.stringify({ message: "Package not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Validate category and subcategory if they are being changed
    if (packageUpdateData.categoryId || packageUpdateData.subcategoryId) {
        const targetCategoryId = packageUpdateData.categoryId || currentPackage.categoryId;
        const targetSubcategoryId = packageUpdateData.subcategoryId || currentPackage.subcategoryId;

        const subcategory = await prisma.subcategory.findUnique({
            where: { id: targetSubcategoryId },
        });

        if (!subcategory || subcategory.categoryId !== targetCategoryId) {
            return new NextResponse(
                JSON.stringify({ message: "Subcategory does not belong to the specified category or does not exist" }),
                {
                status: 400,
                headers: { "Content-Type": "application/json" },
                }
            );
        }
    }

    // Cek duplikat nama (multi-bahasa)
    if ((packageUpdateData.name_en && packageUpdateData.name_en !== currentPackage.name_en) || (packageUpdateData.name_id && packageUpdateData.name_id !== currentPackage.name_id)) {
      const existingPackageWithName = await prisma.package.findFirst({
        where: {
          id: { not: packageId },
          OR: [
            packageUpdateData.name_en ? { name_en: packageUpdateData.name_en } : undefined,
            packageUpdateData.name_id ? { name_id: packageUpdateData.name_id } : undefined,
          ].filter(Boolean) as any,
        },
      });
      if (existingPackageWithName) {
        return new NextResponse(
          JSON.stringify({ message: "Another package with this name already exists" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Hapus file gambar lama jika diganti dengan yang baru dan gambar lama adalah URL ke domain sendiri
    if (packageUpdateData.image && currentPackage.image && packageUpdateData.image !== currentPackage.image) {
      try {
        const url = new URL(currentPackage.image);
        if (url.hostname === 'localhost' || url.hostname === process.env.NEXT_PUBLIC_DOMAIN) {
          const imagePath = url.pathname;
          const absolutePath = path.join(process.cwd(), 'public', imagePath);
          await fs.unlink(absolutePath);
        }
      } catch (err) {
        if ((err as any).code !== 'ENOENT') {
          console.error('Gagal menghapus file gambar lama saat edit:', err);
        }
      }
    }

    const updatedPackage = await prisma.$transaction(async (tx) => {
      const result = await tx.package.update({
        where: { id: packageId },
        data: packageUpdateData,
      });

      if (features !== undefined) {
        // Delete existing features and create new ones
        await tx.feature.deleteMany({
          where: { packageId: packageId },
        });
        if (features.length > 0) {
            await tx.feature.createMany({
                data: features.map((feature) => ({
                    name_en: feature.name_en ?? '',
                    name_id: feature.name_id ?? '',
                    included: feature.included,
                    packageId: packageId,
                })),
            });
        }
      }
      return result;
    });

    const resultWithIncludes = await prisma.package.findUnique({
        where: { id: updatedPackage.id },
        include: { features: true, category: true, subcategory: true }
    });

    return NextResponse.json(resultWithIncludes);
  } catch (error) {
    console.error("[PACKAGE_PUT]", error);
    if ((error as any).code === 'P2025') { 
        return new NextResponse(JSON.stringify({ message: "Package not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }
    return new NextResponse(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await context.params;
    if (!packageId) {
      return new NextResponse(JSON.stringify({ message: "Package ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Cari data package sebelum dihapus
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (pkg && pkg.image && (pkg.image.startsWith('http://') || pkg.image.startsWith('https://'))) {
      try {
        const url = new URL(pkg.image);
        if (url.hostname === 'localhost' || url.hostname === process.env.NEXT_PUBLIC_DOMAIN) {
          const imagePath = url.pathname;
          const absolutePath = path.join(process.cwd(), 'public', imagePath);
          await fs.unlink(absolutePath);
        }
      } catch (err) {
        if ((err as any).code !== 'ENOENT') {
          console.error('Gagal menghapus file gambar package saat delete:', err);
        }
      }
    }

    // Features are deleted by cascade due to schema definition (onDelete: Cascade)
    await prisma.package.delete({
      where: { id: packageId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PACKAGE_DELETE]", error);
    if ((error as any).code === 'P2025') { 
        return new NextResponse(JSON.stringify({ message: "Package not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }
    return new NextResponse(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
