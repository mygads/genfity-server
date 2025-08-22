import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const WHATSAPP_SERVER_API = process.env.WHATSAPP_SERVER_API;
const WHATSAPP_ADMIN_TOKEN = process.env.WHATSAPP_ADMIN_TOKEN;
const WHATSAPP_USER_TOKEN = process.env.WHATSAPP_USER_TOKEN;

// GET /api/admin/whatsapp/sessions - Sync from external service and return database sessions
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!WHATSAPP_SERVER_API || !WHATSAPP_ADMIN_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        error: 'WhatsApp service configuration missing' 
      }, { status: 500 });
    }

    // Step 1: Fetch sessions from external WhatsApp Go service untuk sync
    let externalSessions = [];
    try {
      const response = await fetch(`${WHATSAPP_SERVER_API}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': WHATSAPP_ADMIN_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          externalSessions = data.data;
        }
      }
    } catch (externalError) {
      console.error('[WHATSAPP_SESSIONS] External service error:', externalError);
      // Continue with database data if external service fails
    }

    // Step 2: Sync external sessions to database
    if (externalSessions.length > 0) {
      // Ensure system user exists for system sessions
      let systemUser = null;
      
      for (const extSession of externalSessions) {
        try {
          const isSystemSession = extSession.token === WHATSAPP_USER_TOKEN;
          let userId = null;

          if (isSystemSession) {
            // System session - no user required
            userId = null;
          } else {
            // User session - assign to admin user who created it or first admin
            if (!systemUser) {
              systemUser = await prisma.user.findFirst({
                where: { role: 'admin' }
              });
              
              if (!systemUser) {
                systemUser = await prisma.user.create({
                  data: {
                    email: 'admin@system.local',
                    name: 'System Admin',
                    role: 'admin'
                  }
                });
              }
            }
            userId = systemUser.id;
          }

          // Sync session to database
          await prisma.whatsAppSession.upsert({
            where: { sessionId: extSession.id },
            update: {
              sessionName: extSession.name,
              token: extSession.token,
              webhook: extSession.webhook || null,
              events: extSession.events || null,
              expiration: extSession.expiration || 0,
              connected: extSession.connected || false,
              loggedIn: extSession.loggedIn || false,
              jid: extSession.jid || null,
              qrcode: extSession.qrcode || null,
              status: extSession.connected && extSession.loggedIn ? 'connected' : 
                      !extSession.connected ? 'disconnected' : 
                      !extSession.loggedIn ? 'qr_required' : 'unknown',
              isSystemSession,
              proxyEnabled: extSession.proxy_config?.enabled || false,
              proxyUrl: extSession.proxy_config?.proxy_url || null,
              s3Enabled: extSession.s3_config?.enabled || false,
              s3Endpoint: extSession.s3_config?.endpoint || null,
              s3Region: extSession.s3_config?.region || null,
              s3Bucket: extSession.s3_config?.bucket || null,
              s3AccessKey: extSession.s3_config?.access_key || null,
              s3SecretKey: extSession.s3_config?.secret_key || null,
              s3PathStyle: extSession.s3_config?.path_style || false,
              s3PublicUrl: extSession.s3_config?.public_url || null,
              s3MediaDelivery: extSession.s3_config?.media_delivery || 'base64',
              s3RetentionDays: extSession.s3_config?.retention_days || 30,
              updatedAt: new Date()
            },
            create: {
              sessionId: extSession.id,
              sessionName: extSession.name,
              token: extSession.token,
              userId,
              webhook: extSession.webhook || null,
              events: extSession.events || null,
              expiration: extSession.expiration || 0,
              connected: extSession.connected || false,
              loggedIn: extSession.loggedIn || false,
              jid: extSession.jid || null,
              qrcode: extSession.qrcode || null,
              status: extSession.connected && extSession.loggedIn ? 'connected' : 
                      !extSession.connected ? 'disconnected' : 
                      !extSession.loggedIn ? 'qr_required' : 'unknown',
              isSystemSession,
              proxyEnabled: extSession.proxy_config?.enabled || false,
              proxyUrl: extSession.proxy_config?.proxy_url || null,
              s3Enabled: extSession.s3_config?.enabled || false,
              s3Endpoint: extSession.s3_config?.endpoint || null,
              s3Region: extSession.s3_config?.region || null,
              s3Bucket: extSession.s3_config?.bucket || null,
              s3AccessKey: extSession.s3_config?.access_key || null,
              s3SecretKey: extSession.s3_config?.secret_key || null,
              s3PathStyle: extSession.s3_config?.path_style || false,
              s3PublicUrl: extSession.s3_config?.public_url || null,
              s3MediaDelivery: extSession.s3_config?.media_delivery || 'base64',
              s3RetentionDays: extSession.s3_config?.retention_days || 30,
            }
          });
        } catch (syncError) {
          console.error(`[WHATSAPP_SESSIONS] Error syncing session ${extSession.id}:`, syncError);
        }
      }
    }

    // Step 3: Fetch sessions from database as single source of truth
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const whereClause: any = {};
    if (status && status !== 'all') {
      if (status === 'connected') whereClause.connected = true;
      if (status === 'disconnected') whereClause.connected = false;
      if (status === 'qr_required') {
        whereClause.connected = false;
        whereClause.loggedIn = false;
      }
    }

    const dbSessions = await prisma.whatsAppSession.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true
          }
        }
      },
      orderBy: [
        { isSystemSession: 'desc' }, // System sessions first
        { updatedAt: 'desc' }
      ]
    });

    // Step 4: Format sessions for frontend
    const formattedSessions = dbSessions.map(session => ({
      id: session.sessionId,
      name: session.sessionName,
      token: session.token,
      webhook: session.webhook,
      events: session.events,
      expiration: session.expiration,
      connected: session.connected,
      loggedIn: session.loggedIn,
      jid: session.jid,
      qrcode: session.qrcode,
      proxy_config: {
        enabled: session.proxyEnabled,
        proxy_url: session.proxyUrl
      },
      s3_config: {
        enabled: session.s3Enabled,
        endpoint: session.s3Endpoint,
        region: session.s3Region,
        bucket: session.s3Bucket,
        access_key: session.s3AccessKey,
        path_style: session.s3PathStyle,
        public_url: session.s3PublicUrl,
        media_delivery: session.s3MediaDelivery,
        retention_days: session.s3RetentionDays
      },
      // Add computed fields
      isSystemSession: session.isSystemSession,
      label: session.isSystemSession ? 'System (Genfity App)' : 'User Session',
      statusDisplay: session.status,
      userName: session.isSystemSession 
        ? 'System (Genfity App)' 
        : session.user?.name || session.user?.email || 'Admin (Unassigned)',
      userRole: session.isSystemSession 
        ? 'system' 
        : session.user?.role || 'admin',
      userId: session.userId, // Add userId for transfer functionality
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        sessions: formattedSessions,
        total: formattedSessions.length,
        syncedFromExternal: externalSessions.length
      }
    });

  } catch (error) {
    console.error('Error fetching WhatsApp sessions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch WhatsApp sessions' 
    }, { status: 500 });
  }
}

// POST /api/admin/whatsapp/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!WHATSAPP_SERVER_API || !WHATSAPP_ADMIN_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        error: 'WhatsApp service configuration missing' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { name, token, webhook, events, proxyConfig, s3Config } = body;

    if (!name || !token) {
      return NextResponse.json({ 
        success: false, 
        error: 'name and token are required' 
      }, { status: 400 });
    }

    // Check if token already exists in database
    const existingSession = await prisma.whatsAppSession.findUnique({
      where: { token }
    });

    if (existingSession) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session with this token already exists' 
      }, { status: 400 });
    }

    // Create session in external WhatsApp Go service first
    const response = await fetch(`${WHATSAPP_SERVER_API}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': WHATSAPP_ADMIN_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        token,
        webhook: webhook || '',
        events: events || 'All',
        proxyConfig: proxyConfig || {
          enabled: false,
          proxyURL: ''
        },
        s3Config: s3Config || {
          enabled: false,
          endpoint: '',
          region: '',
          bucket: '',
          accessKey: '',
          secretKey: '',
          pathStyle: false,
          publicURL: '',
          mediaDelivery: 'base64',
          retentionDays: 30
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `WhatsApp service error: ${response.status}`);
    }

    const externalData = await response.json();
    
    if (!externalData.success) {
      throw new Error(externalData.details || 'WhatsApp service returned error');
    }

    // Create session in database - assign to current admin
    const isSystemSession = token === WHATSAPP_USER_TOKEN;
    const newSession = await prisma.whatsAppSession.create({
      data: {
        sessionId: externalData.data.id,
        sessionName: name,
        token,
        userId: isSystemSession ? null : adminAuth.id,
        webhook: webhook || null,
        events: events || 'All',
        expiration: externalData.data.expiration || 0,
        connected: false,
        loggedIn: false,
        jid: null,
        qrcode: null,
        status: 'disconnected',
        isSystemSession,
        proxyEnabled: proxyConfig?.enabled || false,
        proxyUrl: proxyConfig?.proxyURL || null,
        s3Enabled: s3Config?.enabled || false,
        s3Endpoint: s3Config?.endpoint || null,
        s3Region: s3Config?.region || null,
        s3Bucket: s3Config?.bucket || null,
        s3AccessKey: s3Config?.accessKey || null,
        s3SecretKey: s3Config?.secretKey || null,
        s3PathStyle: s3Config?.pathStyle || false,
        s3PublicUrl: s3Config?.publicURL || null,
        s3MediaDelivery: s3Config?.mediaDelivery || 'base64',
        s3RetentionDays: s3Config?.retentionDays || 30,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newSession.sessionId,
        name: newSession.sessionName,
        token: newSession.token,
        webhook: newSession.webhook,
        events: newSession.events,
        isSystemSession: newSession.isSystemSession,
        createdAt: newSession.createdAt,
        external: externalData.data
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating WhatsApp session:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create WhatsApp session' 
    }, { status: 500 });
  }
}
