import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

// GET /api/catalog - Get complete catalog including products and WhatsApp packages (no authentication required)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "hierarchical"; // 'hierarchical' or 'flat'
    const include = searchParams.get("include")?.split(",") || ["product", "whatsapp"]; // What to include

    const catalogData: any = {
      success: true,
      data: {},
      meta: {
        format,
        included: include,
        timestamp: new Date().toISOString()
      }
    };

    // Fetch product data if requested
    if (include.includes("product")) {
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
        catalogData.data.product = {
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
      } else {
        // Hierarchical structure
        catalogData.data.product = categories.reduce((acc, category) => {
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
        }, {} as Record<string, any>);
      }
    }

    // Fetch WhatsApp packages if requested
    if (include.includes("whatsapp")) {
      const whatsappPackages = await prisma.whatsappApiPackage.findMany({
        orderBy: { priceMonth: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          priceMonth: true,
          priceYear: true,
          maxSession: true,
          createdAt: true,
        },
      });

      // Add pricing comparison and recommendations
      const packagesWithRecommendations = whatsappPackages.map(pkg => ({
        ...pkg,
        yearlyDiscount: pkg.priceYear < (pkg.priceMonth * 12) 
          ? Math.round(((pkg.priceMonth * 12 - pkg.priceYear) / (pkg.priceMonth * 12)) * 100)
          : 0,
        recommended: pkg.maxSession >= 5 && pkg.maxSession <= 20,
        features: [
          `Up to ${pkg.maxSession} WhatsApp sessions`,
          'API webhook support',
          'Message automation',
          'Media file sending',
          '24/7 technical support',
        ],
      }));

      catalogData.data.whatsapp = {
        packages: packagesWithRecommendations,
        total: packagesWithRecommendations.length,
      };
    }    // Add summary statistics
    catalogData.meta.counts = {
      ...(include.includes("product") && {
        categories: catalogData.data.product 
          ? (format === "flat" ? catalogData.data.product.categories?.length : Object.keys(catalogData.data.product).length) 
          : 0,
        packages: catalogData.data.product 
          ? (format === "flat" ? catalogData.data.product.packages?.length : 
             Object.values(catalogData.data.product).reduce((total: number, cat: any) => 
               total + Object.values(cat.subcategories || {}).reduce((subTotal: number, sub: any) => 
                 subTotal + Object.keys(sub.packages || {}).length, 0), 0))
          : 0,
        addons: catalogData.data.product 
          ? (format === "flat" ? catalogData.data.product.addons?.length :
             Object.values(catalogData.data.product).reduce((total: number, cat: any) => 
               total + Object.keys(cat.addons || {}).length, 0))
          : 0,
      }),
      ...(include.includes("whatsapp") && {
        whatsappPackages: catalogData.data.whatsapp?.total || 0,
      }),
    };

    return withCORS(NextResponse.json(catalogData));
  } catch (error) {
    console.error("[CATALOG_GET]", error);
    return withCORS(new NextResponse(JSON.stringify({ 
      success: false, 
      error: "Failed to fetch catalog data" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }));
  }
}
