import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Edge Runtime compatible JWT verification
async function verifyJWT(token: string, secret: string) {
    try {
        // Split the JWT token
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const [headerB64, payloadB64, signatureB64] = parts;
        
        // Decode header and payload
        const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        
        // Check if token is expired
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            throw new Error('Token expired');
        }

        // Create signature to verify
        const encoder = new TextEncoder();
        const data = encoder.encode(`${headerB64}.${payloadB64}`);
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );

        // Verify signature
        const signature = Uint8Array.from(
            atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
            c => c.charCodeAt(0)
        );
        
        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signature,
            data
        );

        if (!isValid) {
            throw new Error('Invalid signature');
        }

        return payload;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`JWT verification failed: ${errorMessage}`);
    }
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Handle CORS for all API routes
    if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    // Get NextAuth token for admin routes
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Check for JWT token in Authorization header for customer routes
    let jwtToken = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenValue = authHeader.substring(7);
        try {
            jwtToken = await verifyJWT(tokenValue, JWT_SECRET);
        } catch (error) {
            console.error('JWT verification failed:', error);
        }
    }

    // Public routes (no authentication required)
    const publicRoutes = [
        '/api/auth/',
        '/api/customer/catalog', // Public catalog access
        '/api/customer/check-voucher', // Public check voucher access
        '/api/services/whatsapp/', // Public WhatsApp chat access

    ];

    if (publicRoutes.some(route => pathname.startsWith(route))) {
        const response = NextResponse.next();
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return response;
    }

    // Customer API routes - require JWT authentication
    if (pathname.startsWith('/api/customer')) {
        if (!jwtToken) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Authentication required',
                    message: 'Please provide a valid JWT token in Authorization header' 
                }, 
                { status: 401 }
            );
        }
        
        // Add user info to headers for customer routes
        const response = NextResponse.next();
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return response;
    }

    // All other API routes - require admin authentication (NextAuth)
    if (pathname.startsWith('/api/')) {
        if (!token || token.role !== 'admin') {
            return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
        }
        
        const response = NextResponse.next();
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return response;
    }

    // UI Dashboard routes (admin only)
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            const signInUrl = new URL('/auth/signin', req.url);
            signInUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(signInUrl);
        } else if (token.role !== 'admin') {
            const signInUrl = new URL('/auth/signin', req.url);
            const response = NextResponse.redirect(signInUrl);
            response.cookies.set('next-auth.session-token', '', { path: '/', maxAge: 0 });
            response.cookies.set('__Secure-next-auth.session-token', '', { path: '/', maxAge: 0 });
            return response;
        }
        return NextResponse.next();
    }

    // UI Auth pages
    if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup')) {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        return NextResponse.next();
    }

    // Root path
    if (pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        } else {
            return NextResponse.redirect(new URL('/auth/signin', req.url));
        }
    }

    return NextResponse.next();
}

// Updated matcher to ensure the middleware runs on all relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc. ending with common extensions)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
