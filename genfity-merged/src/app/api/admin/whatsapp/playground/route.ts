import { NextRequest, NextResponse } from 'next/server';
import { withCORS, corsOptionsResponse } from "@/lib/cors";
import { withRoleAuthentication } from "@/lib/request-auth";
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessageDetailed } from '@/lib/whatsapp';
import { normalizePhoneNumber } from '@/lib/auth';

// GET /api/admin/whatsapp/playground - Get sessions for playground
export async function GET(req: NextRequest) {
  return withRoleAuthentication(req, ['admin'], async (user) => {
    try {
      // Get all WhatsApp sessions with stats - same structure as sessions API
      const sessions = await prisma.whatsAppSession.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: [
          { isSystemSession: 'desc' }, // System sessions first
          { updatedAt: 'desc' }
        ]
      });

      // Get message stats for each session and format like sessions API
      const sessionsWithStats = await Promise.all(
        sessions.map(async (session) => {
          const stats = await prisma.whatsAppMessageStats.findFirst({
            where: {
              sessionId: session.sessionId
            }
          });

          return {
            sessionId: session.sessionId,
            sessionName: session.sessionName,
            status: session.status,
            connected: session.connected,
            loggedIn: session.loggedIn,
            jid: session.jid, // WhatsApp phone number when logged in
            // Database computed fields matching sessions API
            userName: session.isSystemSession 
              ? 'System (Genfity App)' 
              : session.user?.name || session.user?.email || 'Admin (Unassigned)',
            userRole: session.isSystemSession 
              ? 'system' 
              : session.user?.role || 'admin',
            userId: session.userId,
            updatedAt: session.updatedAt,
            stats: stats ? {
              totalMessagesSent: stats.totalMessagesSent,
              totalMessagesFailed: stats.totalMessagesFailed,
              totalMessages: stats.totalMessagesSent + stats.totalMessagesFailed,
              successRate: stats.totalMessagesSent + stats.totalMessagesFailed > 0 
                ? ((stats.totalMessagesSent / (stats.totalMessagesSent + stats.totalMessagesFailed)) * 100).toFixed(2)
                : '0.00',
              lastMessageSentAt: stats.lastMessageSentAt,
              lastMessageFailedAt: stats.lastMessageFailedAt
            } : {
              totalMessagesSent: 0,
              totalMessagesFailed: 0,
              totalMessages: 0,
              successRate: '0.00',
              lastMessageSentAt: null,
              lastMessageFailedAt: null
            }
          };
        })
      );

      return withCORS(NextResponse.json({
        success: true,
        data: sessionsWithStats
      }));

    } catch (error) {
      console.error('Error getting playground sessions:', error);
      return withCORS(NextResponse.json({
        success: false,
        error: 'Failed to get sessions'
      }, { status: 500 }));
    }
  });
}

// POST /api/admin/whatsapp/playground - Send test message
export async function POST(req: NextRequest) {
  return withRoleAuthentication(req, ['admin'], async (user) => {
    try {
      const { phoneNumber, message, sessionId } = await req.json();

      if (!phoneNumber || !message || !sessionId) {
        return withCORS(NextResponse.json({
          success: false,
          error: 'Phone number, message, and session ID are required'
        }, { status: 400 }));
      }

      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Validate phone number format (Indonesian)
      if (!normalizedPhone.match(/^628\d{8,12}$/)) {
        return withCORS(NextResponse.json({
          success: false,
          error: 'Invalid Indonesian phone number format'
        }, { status: 400 }));
      }

      try {
        // Send message using real WhatsApp API
        const result = await sendWhatsAppMessageDetailed(normalizedPhone, message);
        
        if (result.success) {
          // Track the successful message
          if (sessionId) {
            const targetUser = await prisma.user.findFirst({
              where: { phone: normalizedPhone }
            });
            
            if (targetUser) {
              // Update or create message stats
              await prisma.whatsAppMessageStats.upsert({
                where: {
                  userId_sessionId: {
                    userId: targetUser.id,
                    sessionId: sessionId
                  }
                },
                update: {
                  totalMessagesSent: {
                    increment: 1
                  },
                  lastMessageSentAt: new Date()
                },
                create: {
                  userId: targetUser.id,
                  sessionId: sessionId,
                  totalMessagesSent: 1,
                  totalMessagesFailed: 0,
                  lastMessageSentAt: new Date()
                }
              });
            }
          }
          
          return withCORS(NextResponse.json({
            success: true,
            data: {
              phoneNumber: normalizedPhone,
              message,
              sentAt: new Date().toISOString(),
              sessionId
            }
          }));
        } else {
          // Track the failed message
          if (sessionId) {
            const targetUser = await prisma.user.findFirst({
              where: { phone: normalizedPhone }
            });
            
            if (targetUser) {
              // Update or create message stats
              await prisma.whatsAppMessageStats.upsert({
                where: {
                  userId_sessionId: {
                    userId: targetUser.id,
                    sessionId: sessionId
                  }
                },
                update: {
                  totalMessagesFailed: {
                    increment: 1
                  },
                  lastMessageFailedAt: new Date()
                },
                create: {
                  userId: targetUser.id,
                  sessionId: sessionId,
                  totalMessagesSent: 0,
                  totalMessagesFailed: 1,
                  lastMessageFailedAt: new Date()
                }
              });
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
          
          return withCORS(NextResponse.json({
            success: false,
            error: errorMessage
          }, { status: 500 }));
        }
      } catch (error) {
        console.error('WhatsApp send error:', error);
        return withCORS(NextResponse.json({
          success: false,
          error: 'Failed to send WhatsApp message'
        }, { status: 500 }));
      }

    } catch (error) {
      console.error('Playground API error:', error);
      return withCORS(NextResponse.json({
        success: false,
        error: 'Internal server error'
      }, { status: 500 }));
    }
  });
}

export async function OPTIONS(req: NextRequest) {
  return corsOptionsResponse();
}
