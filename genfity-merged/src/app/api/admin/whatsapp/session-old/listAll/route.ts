import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { waFetch } from '@/lib/whatsapp-services';
import { withCORS, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET() {
    try {
        // Step 1: Fetch current sessions from WhatsApp service untuk sync
        let waServiceSessions = [];
        try {
            const waServiceResponse = await waFetch('/session/listAll');
            waServiceSessions = waServiceResponse?.sessions || [];
        } catch (waError) {
            console.error('[LIST_ALL_SESSIONS] WhatsApp service error:', waError);
            // Jika WhatsApp service error, lanjut dengan data database saja
        }        // Step 2: Sync WhatsApp service data ke database
        if (waServiceSessions.length > 0) {
            // Ensure admin user exists untuk synced sessions
            let adminUser = await prisma.user.findFirst({
                where: { 
                    OR: [
                        { email: 'admin@system.local' },
                        { role: 'admin' }
                    ]
                }
            });
            
            if (!adminUser) {
                adminUser = await prisma.user.create({
                    data: {
                        email: 'admin@system.local',
                        name: 'System Admin',
                        role: 'admin'
                    }
                });
            }

            for (const waSession of waServiceSessions) {
                try {
                    // Update or create session in database
                    await prisma.whatsAppSession.upsert({
                        where: { sessionId: waSession.sessionId },
                        update: {
                            status: waSession.status || 'unknown',
                            message: waSession.message || null,
                            updatedAt: new Date()
                        },
                        create: {
                            sessionId: waSession.sessionId,
                            sessionName: waSession.sessionName || waSession.sessionId,
                            status: waSession.status || 'unknown',
                            message: waSession.message || null,
                            userId: adminUser.id,
                            isNotification: false
                        }
                    });
                } catch (upsertError) {
                    console.error(`[LIST_ALL_SESSIONS] Error syncing session ${waSession.sessionId}:`, upsertError);
                }
            }
        }        // Step 3: Fetch fresh data from database as single source of truth
        const dbSessions = await prisma.whatsAppSession.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        apiKey: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });        // Step 4: Add computed fields untuk UI
        const sessionsWithStatus = dbSessions.map(session => ({
            sessionId: session.sessionId,
            sessionName: session.sessionName,
            status: session.status,
            message: session.message,
            qr: session.qr,
            isNotification: session.isNotification,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            userId: session.userId,
            userApiKey: session.user?.apiKey || null,
            userName: session.user?.name || session.user?.phone || session.user?.email || 'Unknown',
            isConnected: session.status === 'session_connected',
            needsQR: session.status === 'qr_generated' && session.qr !== null,
            isLoading: session.status === 'loading' || session.status === 'connecting',
            hasError: session.status === 'auth_failure' || session.status === 'error',
            isStopped: session.status === 'stopped',
        }));

        const result = {
            success: true,
            sessions: sessionsWithStatus,
            total: sessionsWithStatus.length,
            syncedFromWhatsApp: waServiceSessions.length,
            timestamp: new Date().toISOString()
        };

        return withCORS(NextResponse.json(result));
    } catch (e) {
        console.error('[LIST_ALL_SESSIONS] Error:', e);
          // Fallback: return database data even if sync fails
        try {
            const dbSessions = await prisma.whatsAppSession.findMany({
                include: {                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            apiKey: true
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });

            const sessionsWithStatus = dbSessions.map(session => ({
                sessionId: session.sessionId,
                sessionName: session.sessionName,
                status: session.status,
                message: session.message,
                qr: session.qr,
                isNotification: session.isNotification,
                createdAt: session.createdAt,                updatedAt: session.updatedAt,
                userId: session.userId,
                userApiKey: session.user?.apiKey || null,
                userName: session.user?.name || session.user?.phone || session.user?.email || 'Unknown',
                isConnected: session.status === 'session_connected',
                needsQR: session.status === 'qr_generated' && session.qr !== null,
                isLoading: session.status === 'loading' || session.status === 'connecting',
                hasError: session.status === 'auth_failure' || session.status === 'error',
                isStopped: session.status === 'stopped',
            }));

            return withCORS(NextResponse.json({
                success: true,
                sessions: sessionsWithStatus,
                total: sessionsWithStatus.length,
                syncedFromWhatsApp: 0,
                warning: 'WhatsApp sync failed, showing database data only',
                timestamp: new Date().toISOString()
            }));
        } catch (dbError) {
            return withCORS(NextResponse.json({ 
                success: false,
                error: (e as Error).message,
                sessions: []
            }, { status: 500 }));
        }
    }
}
