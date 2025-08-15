import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessageDetailed } from '@/lib/whatsapp';
import { WhatsAppMessageTracker } from '@/lib/whatsapp-message-tracker';

// Normalize Indonesian phone numbers (08xxx, +62xxx, 62xxx, 8xxx)
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different Indonesian phone number formats
  if (cleaned.startsWith('0')) {
    // 08xxxxxxxxx -> 628xxxxxxxxx
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('62')) {
    // Already in 62xxxxxxxxx format
    // Do nothing
  } else if (cleaned.startsWith('8')) {
    // 8xxxxxxxxx -> 628xxxxxxxxx
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const { action, phoneNumber, message, sessionId } = await request.json();

    switch (action) {
      case 'send_message':
        if (!phoneNumber || !message) {
          return NextResponse.json({
            success: false,
            message: 'Phone number and message are required'
          }, { status: 400 });
        }

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phoneNumber);

        // Validate phone number format (Indonesian)
        if (!normalizedPhone.match(/^628\d{8,12}$/)) {
          return NextResponse.json({
            success: false,
            message: 'Invalid Indonesian phone number format'
          }, { status: 400 });
        }        try {          // Send message using real WhatsApp API
          const result = await sendWhatsAppMessageDetailed(normalizedPhone, message);
          
          if (result.success) {
            // If sessionId is provided, track the message
            if (sessionId) {
              console.log('Looking for user with phone:', normalizedPhone);
              // Find user by phone number (for tracking purposes)
              const user = await prisma.user.findFirst({
                where: { phone: normalizedPhone }
              });
              
              console.log('User found:', user ? `ID: ${user.id}` : 'No user found');
              
              if (user) {
                console.log('Updating counter for success - userId:', user.id, 'sessionId:', sessionId);
                await WhatsAppMessageTracker.updateMessageCounter({
                  userId: user.id,
                  sessionId: sessionId,
                  isSuccess: true
                });
                console.log('Counter updated successfully for success');
              }
            }
            
            return NextResponse.json({
              success: true,
              message: 'Message sent successfully via WhatsApp',
              data: {
                phoneNumber: normalizedPhone,
                message,
                sentAt: new Date().toISOString()
              }
            });          } else {
            // If sessionId is provided, track the failed message
            if (sessionId) {
              console.log('Looking for user with phone (failed):', normalizedPhone);
              // Find user by phone number (for tracking purposes)
              const user = await prisma.user.findFirst({
                where: { phone: normalizedPhone }
              });
              
              console.log('User found (failed):', user ? `ID: ${user.id}` : 'No user found');
              
              if (user) {
                console.log('Updating counter for failure - userId:', user.id, 'sessionId:', sessionId);
                await WhatsAppMessageTracker.updateMessageCounter({
                  userId: user.id,
                  sessionId: sessionId,
                  isSuccess: false
                });
                console.log('Counter updated successfully for failure');
              }
            }
            
            // Determine error message based on error type
            let errorMessage = 'Failed to send message - WhatsApp service unavailable';
            
            if (result.error) {
              switch (result.error.type) {
                case 'TIMEOUT':
                  errorMessage = 'WhatsApp connection timeout. Please try again.';
                  break;
                case 'NETWORK_ERROR':
                  errorMessage = 'Cannot connect to WhatsApp server. Please check your connection.';
                  break;
                case 'AUTH_ERROR':
                  errorMessage = 'WhatsApp service authentication failed. Please contact administrator.';
                  break;
                case 'CONFIG_ERROR':
                  errorMessage = 'WhatsApp service is not properly configured.';
                  break;
                default:
                  errorMessage = result.error.message || 'Failed to send WhatsApp message';
              }
            }
            
            return NextResponse.json({
              success: false,
              message: errorMessage,
              error: result.error?.type || 'WHATSAPP_ERROR'
            }, { status: 500 });
          }
        } catch (error) {
          console.error('WhatsApp send error:', error);
          return NextResponse.json({
            success: false,
            message: 'Failed to send WhatsApp message'
          }, { status: 500 });
        }

      case 'get_sessions':
        try {
          // Get all WhatsApp sessions with connected status
          const sessions = await prisma.whatsAppSession.findMany({
            where: {
              status: 'CONNECTED'
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            },
            orderBy: {
              updatedAt: 'desc'
            }
          });

          return NextResponse.json({
            success: true,
            data: sessions.map(session => ({
              sessionId: session.sessionId,
              sessionName: session.sessionName,
              status: session.status,
              user: session.user,
              updatedAt: session.updatedAt
            }))
          });
        } catch (error) {
          console.error('Error getting sessions:', error);
          return NextResponse.json({
            success: false,
            message: 'Failed to get sessions'
          }, { status: 500 });
        }

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Playground API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
