import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the TransactionProduct record with related data
    const productTransaction = await prisma.transactionProduct.findUnique({
      where: {
        id: id
      },
      include: {
        transaction: {
          include: {
            payment: {
              select: {
                id: true,
                status: true,
                method: true,
                amount: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              }
            }
          }
        },
        package: {
          select: {
            id: true,
            name_en: true,
            name_id: true,
            description_en: true,
            description_id: true,
            price_idr: true,
            price_usd: true,
            category: {
              select: {
                id: true,
                name_en: true,
                name_id: true,
                icon: true
              }
            },
            subcategory: {
              select: {
                id: true,
                name_en: true,
                name_id: true
              }
            },
            features: {
              select: {
                id: true,
                name_en: true,
                name_id: true,
                included: true
              }
            }
          }
        }
      }
    });    if (!productTransaction) {
      return NextResponse.json(
        { success: false, error: "Product transaction not found" },
        { status: 404 }
      );
    }

    console.log('[DETAIL_API] Product transaction found:', {
      id: productTransaction.id,
      packageId: productTransaction.packageId,
      hasPackage: !!productTransaction.package,
      hasFeatures: !!productTransaction.package?.features,
      featuresLength: productTransaction.package?.features?.length || 0,
      categoryIcon: productTransaction.package?.category?.icon
    });

    // Get delivery record if exists - match by packageId and transactionId
    const deliveryRecord = await prisma.servicesProductCustomers.findFirst({
      where: {
        transactionId: productTransaction.transactionId,
        packageId: productTransaction.packageId
      }
    });

    // Add delivery status to the transformed data
    const deliveryStatus = deliveryRecord?.status || null;

    // Calculate unit price and total amount based on quantity
    const unitPriceIdr = productTransaction.package?.price_idr ? Number(productTransaction.package.price_idr) : 0;
    const unitPriceUsd = productTransaction.package?.price_usd ? Number(productTransaction.package.price_usd) : 0;
    const quantity = productTransaction.quantity || 1;
    const totalPriceIdr = unitPriceIdr * quantity;
    const totalPriceUsd = unitPriceUsd * quantity;

    // Calculate the correct amount based on package price and quantity
    const calculatedAmount = productTransaction.transaction.currency === 'usd' ? totalPriceUsd : totalPriceIdr;

    // Transform to match frontend structure
    const transformedData = {
      id: productTransaction.id,
      transactionId: productTransaction.transactionId,
      userId: productTransaction.transaction.userId,
      amount: calculatedAmount, // Use calculated amount from package price * quantity
      status: productTransaction.status, // Use child transaction status
      currency: productTransaction.transaction.currency,
      type: productTransaction.transaction.type,
      createdAt: productTransaction.transaction.createdAt,
      updatedAt: productTransaction.transaction.updatedAt,
      notes: productTransaction.transaction.notes, // Include transaction notes from checkout
      payment: productTransaction.transaction.payment,
      user: productTransaction.transaction.user,
      mainTransactionStatus: productTransaction.transaction.status, // Keep reference to main status
      deliveryStatus: deliveryStatus, // Add delivery status
      productInfo: {
        id: productTransaction.id,
        packageId: productTransaction.packageId,
        quantity: productTransaction.quantity,
        startDate: productTransaction.startDate,
        endDate: productTransaction.endDate,
        referenceLink: productTransaction.referenceLink,
        package: productTransaction.package,
        // Price calculations
        unitPrice: {
          idr: unitPriceIdr,
          usd: unitPriceUsd
        },
        totalPrice: {
          idr: totalPriceIdr,
          usd: totalPriceUsd
        }
      }
    };

    // Check what actions are available based on payment status and delivery status
    const canStartProgress = productTransaction.transaction.payment?.status === 'paid' && 
                           deliveryStatus === 'pending';
                           
    const canComplete = productTransaction.transaction.payment?.status === 'paid' && 
                       deliveryStatus && ['pending', 'in_progress'].includes(deliveryStatus);

    return NextResponse.json({
      success: true,
      data: {
        transaction: transformedData,
        canStartProgress,
        canComplete
      }
    });

  } catch (error) {
    console.error("Error fetching transaction detail:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transaction detail"
      },
      { status: 500 }
    );
  }
}
