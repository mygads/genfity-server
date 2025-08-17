import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("[PRODUCT_TRANSACTIONS_API] Fetching product transactions...");
    
    // Fetch all TransactionProduct records with related transaction and package data
    const productTransactions = await prisma.transactionProduct.findMany({
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
            },
            productCustomers: {
              select: {
                id: true,
                packageId: true, // Add packageId to properly match delivery records
                status: true,
                deliveredAt: true
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
      },
      orderBy: {
        transaction: {
          createdAt: 'desc'
        }
      }
    });    // Transform the data to match the expected frontend structure
    const transformedData = productTransactions.map(productTx => {
      // Calculate unit price and total amount based on quantity
      const unitPriceIdr = productTx.package?.price_idr ? Number(productTx.package.price_idr) : 0;
      const unitPriceUsd = productTx.package?.price_usd ? Number(productTx.package.price_usd) : 0;
      const quantity = productTx.quantity || 1;
      const totalPriceIdr = unitPriceIdr * quantity;
      const totalPriceUsd = unitPriceUsd * quantity;

      // Get delivery status from ServicesProductCustomers - match by packageId and transactionId
      const deliveryRecord = productTx.transaction.productCustomers?.find(pc => 
        pc.packageId === productTx.packageId
      );
      const deliveryStatus = deliveryRecord?.status || null; // null if no delivery record exists

      // Calculate the correct amount based on package price and quantity
      const calculatedAmount = productTx.transaction.currency === 'usd' ? totalPriceUsd : totalPriceIdr;

      return {
        id: productTx.id, // Use TransactionProduct ID as unique identifier
        transactionId: productTx.transactionId, // Keep reference to original transaction
        userId: productTx.transaction.userId,
        amount: calculatedAmount, // Use calculated amount from package price * quantity
        status: productTx.status, // Use child transaction status, not main transaction status
        currency: productTx.transaction.currency,
        type: productTx.transaction.type,
        createdAt: productTx.transaction.createdAt,
        updatedAt: productTx.transaction.updatedAt,
        notes: productTx.transaction.notes, // Include transaction notes from checkout
        payment: productTx.transaction.payment,
        user: productTx.transaction.user,
        // Main transaction status for reference
        mainTransactionStatus: productTx.transaction.status,
        // Delivery status
        deliveryStatus: deliveryStatus,
        // Product specific data
        productInfo: {
          id: productTx.id,
          packageId: productTx.packageId,
          quantity: quantity,
          startDate: productTx.startDate,
          endDate: productTx.endDate,
          referenceLink: productTx.referenceLink,
          package: productTx.package,
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
    });

    console.log(`[PRODUCT_TRANSACTIONS_API] Found ${transformedData.length} product transaction records`);
    
    // Log sample data for debugging
    if (transformedData.length > 0) {
      console.log('[PRODUCT_TRANSACTIONS_API] Sample transaction data:', {
        id: transformedData[0].id,
        hasPackage: !!transformedData[0].productInfo?.package,
        hasFeatures: !!transformedData[0].productInfo?.package?.features,
        featuresLength: transformedData[0].productInfo?.package?.features?.length || 0,
        categoryIcon: transformedData[0].productInfo?.package?.category?.icon
      });
    }

    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error("Error fetching product transactions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
