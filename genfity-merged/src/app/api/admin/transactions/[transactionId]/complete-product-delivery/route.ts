import { NextRequest, NextResponse } from "next/server";
import { PaymentExpirationService } from "@/lib/payment-expiration";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const body = await request.json();
    const { adminUserId } = body;

    // Complete product delivery using the payment expiration service
    const result = await PaymentExpirationService.completeProductDelivery(transactionId, adminUserId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          transactionId,
          delivered: result.delivered,
          transactionCompleted: result.transactionCompleted
        },
        message: result.transactionCompleted 
          ? 'Product delivered and transaction completed'
          : 'Product delivered, waiting for other services'
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Failed to complete product delivery" 
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error completing product delivery:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to complete product delivery",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
