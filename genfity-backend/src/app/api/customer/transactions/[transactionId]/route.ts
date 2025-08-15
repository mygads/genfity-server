import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { getCustomerAuth } from "@/lib/auth-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {  try {
    const { transactionId } = await params;
    const userAuth = await getCustomerAuth(request);
    if (!userAuth?.id) {
      return withCORS(NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      ));
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userAuth.id, // Ensure user can only access their own transactions
      },      include: {        productTransactions: {
          include: {
            package: {
              select: {
                id: true,
                name_en: true,
                name_id: true,
                description_en: true,
                description_id: true,
                price_idr: true,
                price_usd: true,
                image: true,
                features: {
                  select: {
                    id: true,
                    name_en: true,
                    name_id: true,
                    included: true,
                  },
                },
              },
            },
          },
        },
        addonTransactions: {
          include: {
            addon: {
              select: {
                id: true,
                name_en: true,
                name_id: true,
                description_en: true,
                description_id: true,
                price_idr: true,
                price_usd: true,
                image: true,
              },
            },
          },
        },
        whatsappTransaction: {
          include: {            whatsappPackage: {
              select: {
                id: true,
                name: true,
                description: true,
                priceMonth: true,
                priceYear: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            paymentDate: true,
          },
        },
      },
    });

    if (!transaction) {
      return withCORS(NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      ));
    }

    return withCORS(NextResponse.json({
      success: true,
      data: transaction,
    }));
  } catch (error) {
    console.error("[CUSTOMER_TRANSACTION_DETAILS_GET]", error);
    return withCORS(NextResponse.json(
      { success: false, error: "Failed to fetch transaction details" },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
