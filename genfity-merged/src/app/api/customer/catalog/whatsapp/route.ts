import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

// GET /api/catalog/whatsapp - Get WhatsApp API packages (no authentication required)
export async function GET(request: Request) {
  try {
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
      },
    });

    // Add pricing comparison and recommendations
    const packagesWithRecommendations = packages.map(pkg => ({
      ...pkg,
      yearlyDiscount: pkg.priceYear < (pkg.priceMonth * 12) 
        ? Math.round(((pkg.priceMonth * 12 - pkg.priceYear) / (pkg.priceMonth * 12)) * 100)
        : 0,
      recommended: pkg.maxSession >= 5 && pkg.maxSession <= 20, // Example logic
      features: [
        `Up to ${pkg.maxSession} WhatsApp sessions`,
        'API webhook support',
        'Message automation',
        'Media file sending',
        '24/7 technical support',
      ],
    }));

    return withCORS(NextResponse.json({
      success: true,
      data: packagesWithRecommendations,
      total: packagesWithRecommendations.length,
      type: 'whatsapp'
    }));
  } catch (error) {
    console.error("[CATALOG_WHATSAPP_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch WhatsApp packages catalog" },
      { status: 500 }
    ));
  }
}
