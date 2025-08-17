import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/admin-auth";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['customer', 'admin']).default('customer'),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
  role: z.enum(['customer', 'admin']).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const adminVerification = await verifyAdminToken(request);
    if (!adminVerification.success) {
      return withCORS(NextResponse.json(
        { success: false, error: adminVerification.error },
        { status: 401 }
      ));
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const whereCondition: any = {};

    // Search filter
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      whereCondition.role = role;
    }    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        include: {
          transactions: {
            select: { id: true },
            take: 5,
          },
          whatsAppSessions: {
            select: { id: true },
            take: 5,
          },
          whatsappCustomers: {
            select: { id: true },
            take: 5,
          },
        },
        orderBy: { id: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where: whereCondition }),
    ]);const formattedUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      stats: {
        totalTransactions: user.transactions?.length || 0,
        activeWhatsAppSessions: user.whatsAppSessions?.length || 0,
        whatsappServices: user.whatsappCustomers?.length || 0,
      },
    }));

    return withCORS(NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }));
  } catch (error) {
    console.error("[USERS_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    ));
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const adminVerification = await verifyAdminToken(request);
    if (!adminVerification.success) {
      return withCORS(NextResponse.json(
        { success: false, error: adminVerification.error },
        { status: 401 }
      ));
    }

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return withCORS(NextResponse.json(
        { success: false, error: validation.error.errors },
        { status: 400 }
      ));
    }

    const { name, email, phone, password, role } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return withCORS(NextResponse.json(
        { success: false, error: "User with this email or phone already exists" },
        { status: 409 }
      ));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        emailVerified: new Date(), // Admin created users are pre-verified
      },      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return withCORS(NextResponse.json({
      success: true,
      data: user,
      message: "User created successfully",
    }));
  } catch (error) {
    console.error("[USERS_POST]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
