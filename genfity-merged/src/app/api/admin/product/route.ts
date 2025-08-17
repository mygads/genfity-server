import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "hierarchical"; // 'hierarchical' or 'flat'

    // Fetch all categories with their related data
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          include: {
            packages: {
              include: {
                features: true,
              },
              orderBy: {
                name_en: 'asc',
              },
            },
          },
          orderBy: {
            name_en: 'asc',
          },
        },
        addons: {
          orderBy: {
            name_en: 'asc',
          },
        },
      },
      orderBy: {
        name_en: 'asc',
      },
    });

    if (format === "flat") {
      // Return flat structure for backward compatibility
      const flatData = {
        categories: categories.map(cat => ({
          id: cat.id,
          name_en: cat.name_en,
          name_id: cat.name_id,
          icon: cat.icon,
        })),
        subcategories: categories.flatMap(cat => 
          cat.subcategories.map(sub => ({
            id: sub.id,
            name_en: sub.name_en,
            name_id: sub.name_id,
            categoryId: cat.id,
          }))
        ),
        packages: categories.flatMap(cat => 
          cat.subcategories.flatMap(sub => 
            sub.packages.map(pkg => ({
              id: pkg.id,
              name_en: pkg.name_en,
              name_id: pkg.name_id,
              description_en: pkg.description_en,
              description_id: pkg.description_id,
              price_idr: Number(pkg.price_idr),
              price_usd: Number(pkg.price_usd),
              image: pkg.image,
              categoryId: cat.id,
              subcategoryId: sub.id,
              popular: pkg.popular,
              bgColor: pkg.bgColor,
              features: pkg.features.map(feature => ({
                id: feature.id,
                name_en: feature.name_en,
                name_id: feature.name_id,
                included: feature.included,
              })),
            }))
          )
        ),
        addons: categories.flatMap(cat => 
          cat.addons.map(addon => ({
            id: addon.id,
            name_en: addon.name_en,
            name_id: addon.name_id,
            description_en: addon.description_en,
            description_id: addon.description_id,
            price_idr: Number(addon.price_idr),
            price_usd: Number(addon.price_usd),
            image: addon.image,
            categoryId: cat.id,
          }))
        ),
      };
      return withCORS(NextResponse.json(flatData));
    }

    // Transform the data into the requested hierarchical structure
    const transformedData = {
      product: categories.reduce((acc, category) => {
        acc[category.name_en] = {
          id: category.id,
          name_en: category.name_en,
          name_id: category.name_id,
          icon: category.icon,
          subcategories: category.subcategories.reduce((subAcc, subcategory) => {
            subAcc[subcategory.name_en] = {
              id: subcategory.id,
              name_en: subcategory.name_en,
              name_id: subcategory.name_id,
              packages: subcategory.packages.reduce((pkgAcc, pkg) => {
                pkgAcc[pkg.name_en] = {
                  id: pkg.id,
                  name_en: pkg.name_en,
                  name_id: pkg.name_id,
                  description_en: pkg.description_en,
                  description_id: pkg.description_id,
                  price_idr: Number(pkg.price_idr),
                  price_usd: Number(pkg.price_usd),
                  image: pkg.image,
                  popular: pkg.popular,
                  bgColor: pkg.bgColor,
                  features: pkg.features.map(feature => ({
                    id: feature.id,
                    name_en: feature.name_en,
                    name_id: feature.name_id,
                    included: feature.included,
                  })),
                };
                return pkgAcc;
              }, {} as Record<string, any>),
            };
            return subAcc;
          }, {} as Record<string, any>),
          addons: category.addons.reduce((addonAcc, addon) => {
            addonAcc[addon.name_en] = {
              id: addon.id,
              name_en: addon.name_en,
              name_id: addon.name_id,
              description_en: addon.description_en,
              description_id: addon.description_id,
              price_idr: Number(addon.price_idr),
              price_usd: Number(addon.price_usd),
              image: addon.image,
            };
            return addonAcc;
          }, {} as Record<string, any>),
        };
        return acc;
      }, {} as Record<string, any>),
    };

    return withCORS(NextResponse.json(transformedData));
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    return withCORS(new NextResponse(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }));
  }
}