import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { getCustomerAuth } from '@/lib/auth-helpers';
import { withCORS, corsOptionsResponse } from '@/lib/cors';

/**
 * Voucher Check API
 * 
 * This endpoint allows checking voucher validity and calculating discounts.
 * It supports both authenticated and public (unauthenticated) access:
 * 
 * - Authenticated: Full validation including user-specific usage checks
 * - Public: Basic voucher validation without user-specific restrictions
 * 
 * When used without authentication, the API will skip user-specific validations
 * such as "user has already used this voucher" checks.
 */

// Validation schema for voucher check
const checkVoucherSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  currency: z.enum(['idr', 'usd']).default('idr'),
  items: z.array(z.object({
    type: z.enum(['product', 'addon', 'addons', 'whatsapp']).transform((val) => {
      // Normalize 'addons' to 'addon' for consistency
      return val === 'addons' ? 'addon' : val;
    }),
    id: z.string(),
    quantity: z.number().positive().int().default(1),
    duration: z.enum(['month', 'year']).optional(), // Only for whatsapp items
  })).min(1, 'At least one item is required'),
});

// OPTIONS - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get('origin') || undefined);
}

// Helper function to create CORS-enabled JSON responses
function createCorsResponse(data: any, options: { status?: number } = {}, request: NextRequest) {
  const response = NextResponse.json(data, options);
  return withCORS(response, request.headers.get('origin') || undefined);
}

// POST - Check voucher validity and calculate discount
export async function POST(request: NextRequest) {
  try {
    // Get user authentication from JWT token (optional for public voucher check)
    const userAuth = await getCustomerAuth(request);
    const userId = userAuth?.id || null; // Allow null for public access

    const body = await request.json();
    const { code, currency, items } = checkVoucherSchema.parse(body);
    
    // For public access without userId, we skip user-specific validations    // Calculate total amount from items
    let originalAmount = 0;
    const itemDetails: Array<{
      id: string;
      type: 'product' | 'addon' | 'whatsapp';
      name: string;
      price: number;
      quantity: number;
      total: number;
    }> = [];

    // Fetch and calculate prices for each item
    for (const item of items) {
      let itemPrice = 0;
      let itemName = '';

      try {
        if (item.type === 'product') {
          const product = await prisma.package.findUnique({
            where: { id: item.id },
            select: {
              name_en: true,
              name_id: true,
              price_idr: true,
              price_usd: true,
            },
          });

          if (!product) {
            throw new Error(`Product with ID ${item.id} not found`);
          }

          itemName = currency === 'idr' ? product.name_id : product.name_en;
          itemPrice = currency === 'idr' ? Number(product.price_idr) : Number(product.price_usd);
        } else if (item.type === 'addon') {
          const addon = await prisma.addon.findUnique({
            where: { id: item.id },
            select: {
              name_en: true,
              name_id: true,
              price_idr: true,
              price_usd: true,
            },
          });

          if (!addon) {
            throw new Error(`Addon with ID ${item.id} not found`);
          }

          itemName = currency === 'idr' ? addon.name_id : addon.name_en;
          itemPrice = currency === 'idr' ? Number(addon.price_idr) : Number(addon.price_usd);
        } else if (item.type === 'whatsapp') {
          if (!item.duration) {
            throw new Error('Duration is required for WhatsApp packages');
          }

          const whatsappPackage = await prisma.whatsappApiPackage.findUnique({
            where: { id: item.id },
            select: {
              name: true,
              priceMonth: true,
              priceYear: true,
            },
          });

          if (!whatsappPackage) {
            throw new Error(`WhatsApp package with ID ${item.id} not found`);
          }

          // WhatsApp packages are IDR only, convert to USD if needed
          const priceIdr = item.duration === 'month' ? whatsappPackage.priceMonth : whatsappPackage.priceYear;
          itemName = whatsappPackage.name;
          
          if (currency === 'usd') {
            // Convert IDR to USD (approximate rate: 1 USD = 15000 IDR)
            itemPrice = priceIdr / 15000;
          } else {
            itemPrice = priceIdr;
          }
        }

        const itemTotal = itemPrice * item.quantity;
        originalAmount += itemTotal;        itemDetails.push({
          id: item.id,
          type: item.type,
          name: itemName,
          price: itemPrice,
          quantity: item.quantity,
          total: itemTotal,
        });
      } catch (error) {
        return createCorsResponse(
          {
            success: false,
            error: `Error processing item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isValid: false,
          },
          { status: 400 },
          request
        );
      }
    }    // Find voucher by code
    const voucher = await prisma.voucher.findUnique({
      where: { code },
      include: {
        voucherUsage: userId ? {
          where: { userId },
        } : false, // Don't include usage if no userId (public access)
        _count: {
          select: {
            voucherUsage: true,
          },
        },
      },
    });    if (!voucher) {
      return createCorsResponse(
        { 
          success: false, 
          error: 'Invalid voucher code',
          isValid: false,
        },
        { status: 400 },
        request
      );
    }    // Check if voucher is active
    if (!voucher.isActive) {
      return createCorsResponse(
        { 
          success: false, 
          error: 'Voucher is not active',
          isValid: false,
        },
        { status: 400 },
        request
      );
    }

    // Check date validity
    const now = new Date();
    const startDate = new Date(voucher.startDate);
    const endDate = voucher.endDate ? new Date(voucher.endDate) : null;    if (now < startDate) {
      return createCorsResponse(
        { 
          success: false, 
          error: 'Voucher is not yet valid',
          isValid: false,
        },
        { status: 400 },
        request
      );
    }    if (endDate && now > endDate) {
      return createCorsResponse(
        { 
          success: false, 
          error: 'Voucher has expired',
          isValid: false,
        },
        { status: 400 },
        request
      );
    }

    // Check usage limits
    if (voucher.maxUses && voucher._count.voucherUsage >= voucher.maxUses) {      return createCorsResponse(
        { 
          success: false, 
          error: 'Voucher usage limit reached',
          isValid: false,
        },
        { status: 400 },
        request
      );
    }    // Check if user has already used this voucher (unless multiple use per user is allowed)
    // Skip this check for public access (when userId is null)
    if (userId && !voucher.allowMultipleUsePerUser && voucher.voucherUsage && voucher.voucherUsage.length > 0) {
      return createCorsResponse(
        { 
          success: false, 
          error: 'You have already used this voucher',
          isValid: false,
        },
        { status: 400 },
        request
      );
    }    // Check minimum order amount
    if (voucher.minAmount && originalAmount < voucher.minAmount.toNumber()) {
      return createCorsResponse(
        { 
          success: false, 
          error: `Minimum order amount is ${voucher.minAmount}`,
          isValid: false,
        },
        { status: 400 },
        request
      );
    }

    // Calculate discount based on voucher type and discount type
    let discountAmount = 0;
    let applicableAmount = originalAmount;    // Filter items based on discount type
    if (voucher.discountType !== 'total') {
      const applicableItems = itemDetails.filter(item => {
        switch (voucher.discountType) {
          case 'products':
            return item.type === 'product';
          case 'addons':
          case 'addon':
            return item.type === 'addon';
          case 'whatsapp':
            return item.type === 'whatsapp';
          default:
            return true;
        }
      });
      
      applicableAmount = applicableItems.reduce((sum, item) => sum + item.total, 0);
    }// Calculate discount based on voucher type (percentage vs fixed_amount)
    // Handle both correct and swapped field scenarios
    let calculationType = voucher.type;
    
    // If type is not a calculation type, check if discountType contains the calculation type
    if (voucher.type !== 'percentage' && voucher.type !== 'fixed_amount') {
      if (voucher.discountType === 'percentage' || voucher.discountType === 'fixed_amount') {
        calculationType = voucher.discountType;
      } else {
        // Default to fixed_amount if neither field contains a valid calculation type
        calculationType = 'fixed_amount';
      }
    }
    
    if (calculationType === 'percentage') {
      discountAmount = (applicableAmount * voucher.value.toNumber()) / 100;
    } else {
      discountAmount = Math.min(voucher.value.toNumber(), applicableAmount);
    }

    // Apply maximum discount limit
    if (voucher.maxDiscount) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount.toNumber());
    }

    // Ensure discount doesn't exceed applicable amount
    discountAmount = Math.min(discountAmount, applicableAmount);    const finalAmount = originalAmount - discountAmount;

    return createCorsResponse({
      success: true,
      isValid: true,
      data: {
        voucher: {
          id: voucher.id,
          code: voucher.code,
          name: voucher.name,
          description: voucher.description,
          type: voucher.type,
          discountType: voucher.discountType,
          value: voucher.value,
          minAmount: voucher.minAmount,
          maxDiscount: voucher.maxDiscount,
        },
        calculation: {
          originalAmount: originalAmount,
          applicableAmount,
          discountAmount,
          finalAmount,
          savings: discountAmount,
          currency: currency,
          items: itemDetails,
        },
      },
    }, {}, request);} catch (error) {
    if (error instanceof z.ZodError) {
      return createCorsResponse(
        { 
          success: false, 
          error: 'Validation failed', 
          details: error.errors,
          isValid: false,
        },
        { status: 400 },
        request
      );
    }

    console.error('Error checking voucher:', error);
    return createCorsResponse(
      { 
        success: false, 
        error: 'Failed to check voucher',
        isValid: false,
      },
      { status: 500 },
      request
    );
  }
}
