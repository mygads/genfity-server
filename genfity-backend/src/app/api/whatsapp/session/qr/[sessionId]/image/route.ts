import { NextResponse } from "next/server";

const WA_API = process.env.WHATSAPP_SERVER_API;
const API_KEY = process.env.WHATSAPP_API_KEY;

// GET /api/whatsapp/session/qr/[sessionId]/image - Stream QR image from WhatsApp service
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!WA_API || !API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: "WhatsApp service configuration missing" 
        },
        { status: 500 }
      );
    }

    // Call WhatsApp service to get QR image stream using raw fetch
    const response = await fetch(`${WA_API}/session/qr/${sessionId}/image`, {
      method: 'GET',
      headers: {
        'access-token': API_KEY,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to get QR image: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    // Get the image data as buffer
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return the image as a streaming response
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error(`[QR_IMAGE_STREAM] Error for session ${(await params).sessionId}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to stream QR image" 
      },
      { status: 500 }
    );
  }
}
