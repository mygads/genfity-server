import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware({
  ...routing,
  localeDetection: false, // Manual locale detection
});

// Edge Runtime compatible JWT verification
async function verifyJWT(token: string, secret: string) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const [headerB64, payloadB64, signatureB64] = parts;
        
        const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            throw new Error('Token expired');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(`${headerB64}.${payloadB64}`);
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );

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

// IP Geolocation function (COMMENTED OUT as requested)
/*
async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/country/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js Middleware)',
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const country = await response.text();
      return country.trim().toUpperCase();
    }
  } catch (error) {
    console.error('Geolocation detection failed:', error);
  }
  return null;
}
*/

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (vercelForwardedFor) return vercelForwardedFor.split(',')[0].trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  
  return '127.0.0.1';
}

export async function middleware(req: NextRequest) {
    const { pathname, searchParams } = req.nextUrl;

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

    // ROOT REDIRECT LOGIC
    if (pathname === '/') {
        // Redirect to default locale
        return NextResponse.redirect(new URL('/en', req.url));
    }

    // ADMIN REDIRECT LOGIC
    if (pathname === '/admin') {
        // Redirect /admin to /[locale]/admin/
        return NextResponse.redirect(new URL('/en/admin', req.url));
    }

    // Check if path needs locale prefix
    const isRootPath = pathname === '/';
    const hasLocaleInPath = /^\/(en|id)/.test(pathname);
    const isApiRoute = pathname.startsWith('/api/');
    const isStaticAsset = /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname);

    // Handle locale detection for non-API, non-static routes
    if (!isApiRoute && !isStaticAsset && (!hasLocaleInPath || isRootPath)) {
        // Manual locale override (for testing)
        const forceLocale = searchParams.get('locale');
        if (forceLocale && ['en', 'id'].includes(forceLocale)) {
            const url = req.nextUrl.clone();
            url.pathname = `/${forceLocale}${pathname === '/' ? '' : pathname}`;
            url.searchParams.delete('locale');
            return NextResponse.redirect(url);
        }

        // Default to Indonesian for development
        // IP geolocation is commented out as requested
        let detectedLocale = 'id';

        // Check Accept-Language for localhost
        const clientIP = getClientIP(req);
        if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
            const acceptLanguage = req.headers.get('accept-language');
            if (acceptLanguage) {
                const languages = acceptLanguage.split(',').map(lang => lang.trim().split(';')[0]);
                if (languages.some(lang => lang.startsWith('en') && !lang.startsWith('en-ID'))) {
                    const hasIndonesian = languages.some(lang => 
                        lang.startsWith('id') || 
                        lang.startsWith('ms') || 
                        lang === 'en-ID'
                    );
                    if (!hasIndonesian) {
                        detectedLocale = 'en';
                    }
                }
            }
        }

        const url = req.nextUrl.clone();
        url.pathname = `/${detectedLocale}${pathname === '/' ? '' : pathname}`;
        return NextResponse.redirect(url);
    }

    // API ROUTES AUTHENTICATION
    if (isApiRoute) {
        // Get tokens
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        
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

        // Public routes
        const publicRoutes = [
            '/api/auth/',
            '/api/customer/catalog',
            '/api/customer/check-voucher',
            '/api/services/whatsapp/',
        ];

        if (publicRoutes.some(route => pathname.startsWith(route))) {
            const response = NextResponse.next();
            response.headers.set("Access-Control-Allow-Origin", "*");
            response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return response;
        }

        // Customer API routes - require JWT
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
            
            const response = NextResponse.next();
            response.headers.set("Access-Control-Allow-Origin", "*");
            response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return response;
        }

        // Admin API routes - require JWT with admin role
        if (pathname.startsWith('/api/admin')) {
            if (!jwtToken || (jwtToken.role !== 'admin' && jwtToken.role !== 'super_admin')) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: 'Admin authentication required',
                        message: 'Please provide a valid admin JWT token in Authorization header' 
                    }, 
                    { status: 403 }
                );
            }
            
            const response = NextResponse.next();
            response.headers.set("Access-Control-Allow-Origin", "*");
            response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return response;
        }

        // All other API routes - require admin token
        if (!jwtToken || (jwtToken.role !== 'admin' && jwtToken.role !== 'super_admin')) {
            return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
        }
        
        const response = NextResponse.next();
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return response;
    }

    // UI ROUTES - Apply intl middleware for localized routes
    if (hasLocaleInPath && !isApiRoute && !isStaticAsset) {
        const locale = pathname.split('/')[1];
        const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
        
        // Admin UI Routes Protection
        if (pathWithoutLocale.startsWith('/admin')) {
            // Skip authentication check for signin page
            if (pathWithoutLocale === '/admin/signin') {
                return intlMiddleware(req);
            }
            
            // Check for JWT token in cookies for admin UI
            const jwtToken = req.cookies.get('admin-token')?.value;
            
            let isValidAdmin = false;
            if (jwtToken) {
                try {
                    const payload = await verifyJWT(jwtToken, JWT_SECRET);
                    isValidAdmin = payload && (payload.role === 'admin' || payload.role === 'super_admin');
                } catch (error) {
                    console.error('Admin JWT verification failed:', error);
                }
            }
            
            if (!isValidAdmin) {
                const signInUrl = new URL(`/${locale}/admin/signin`, req.url);
                signInUrl.searchParams.set('callbackUrl', req.url);
                return NextResponse.redirect(signInUrl);
            }
        }

        // Apply next-intl middleware
        return intlMiddleware(req);
    }

    return NextResponse.next();
}

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
