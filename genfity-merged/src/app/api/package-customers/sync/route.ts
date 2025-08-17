import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {  try {    
    // ⚠️ DEPRECATED: This endpoint now uses ServicesProductCustomers
    // Find all paid product transactions that don't have ServicesProductCustomers records yet
    const paidTransactions = await prisma.transaction.findMany({
      where: {
        type: "product",
        status: "paid",
        productTransactions: {
          some: {}
        },
        productCustomers: {
          none: {}
        }
      },
      include: {
        productTransactions: true
      }
    });    const createdRecords = [];

    // Create ServicesProductCustomers records for each paid transaction
    for (const transaction of paidTransactions) {
      if (transaction.productTransactions && transaction.productTransactions.length > 0) {
        // ⚠️ DEPRECATED: This endpoint now uses ServicesProductCustomers
        // Handle multiple products per transaction
        for (const productTx of transaction.productTransactions) {
          if (productTx.packageId) {
            const packageCustomer = await prisma.servicesProductCustomers.create({
              data: {
                transactionId: transaction.id,
                customerId: transaction.userId,
                packageId: productTx.packageId,
                quantity: productTx.quantity || 1,
                status: transaction.status === 'success' ? 'delivered' : 'awaiting_delivery',
                deliveredAt: transaction.status === 'success' ? new Date() : null
              }
            });
            
            createdRecords.push(packageCustomer);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdRecords.length} package customer records`,
      data: {
        created: createdRecords.length,
        records: createdRecords
      }
    });

  } catch (error) {
    console.error("Error creating package customer records:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create package customer records"
      },
      { status: 500 }
    );
  }
}
