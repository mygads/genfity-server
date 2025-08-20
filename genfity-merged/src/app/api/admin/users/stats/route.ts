import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/auth-helpers";
import { withCORS, corsOptionsResponse } from "@/lib/cors";

// GET /api/admin/users/stats - Get user statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return withCORS(NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 401 }
      ));
    }

    // Get current date for recent registrations calculation
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all counts in parallel
    const [
      totalUsers,
      totalCustomers,
      totalAdmins,
      verifiedUsers,
      recentUsers
    ] = await Promise.all([
      // Total users (all roles)
      prisma.user.count(),
      
      // Total customers
      prisma.user.count({
        where: { role: 'customer' }
      }),
      
      // Total admins
      prisma.user.count({
        where: { role: 'admin' }
      }),
      
      // Verified users (have BOTH emailVerified AND phoneVerified)
      prisma.user.count({
        where: { 
          AND: [
            { emailVerified: { not: null } },
            { phoneVerified: { not: null } }
          ]
        }
      }),
      
      // Recent registrations (last 7 days)
      prisma.user.count({
        where: { 
          createdAt: {
            gte: oneWeekAgo
          }
        }
      })
    ]);

    const stats = {
      totalUsers,
      totalCustomers,
      totalAdmins,
      verifiedUsers,
      recentRegistrations: recentUsers
    };

    return withCORS(NextResponse.json({
      success: true,
      data: stats
    }));
  } catch (error) {
    console.error("[USER_STATS_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch user statistics" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}