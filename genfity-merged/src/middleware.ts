import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import requestIp from 'request-ip';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

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

// Indonesian IP ranges (major ISPs and providers)
const INDONESIAN_IP_RANGES = [
    // Telkom Indonesia (Extensive ranges)
    { start: '118.96.0.0', end: '118.99.255.255' },
    { start: '125.160.0.0', end: '125.167.255.255' },
    { start: '139.192.0.0', end: '139.195.255.255' },
    { start: '180.241.0.0', end: '180.255.255.255' },
    { start: '182.23.0.0', end: '182.23.255.255' },
    { start: '202.43.160.0', end: '202.43.191.255' },
    { start: '202.154.176.0', end: '202.154.191.255' },
    { start: '103.255.0.0', end: '103.255.255.255' },
    { start: '36.66.0.0', end: '36.67.255.255' },
    { start: '36.68.0.0', end: '36.95.255.255' },
    
    // Indosat Ooredoo (Complete ranges)
    { start: '114.121.0.0', end: '114.125.255.255' },
    { start: '202.152.0.0', end: '202.155.255.255' },
    { start: '203.142.0.0', end: '203.142.255.255' },
    { start: '116.212.96.0', end: '116.212.127.255' },
    { start: '175.103.32.0', end: '175.103.63.255' },
    
    // XL Axiata (Extended ranges)
    { start: '103.10.64.0', end: '103.10.127.255' },
    { start: '180.244.0.0', end: '180.247.255.255' },
    { start: '210.210.145.0', end: '210.210.151.255' },
    { start: '103.31.0.0', end: '103.31.255.255' },
    { start: '103.105.32.0', end: '103.105.63.255' },
    
    // First Media / Link Net / PLN
    { start: '103.28.14.0', end: '103.28.15.255' },
    { start: '119.110.64.0', end: '119.110.127.255' },
    { start: '103.47.132.0', end: '103.47.135.255' },
    
    // Biznet Networks
    { start: '103.23.22.0', end: '103.23.23.255' },
    { start: '103.3.60.0', end: '103.3.63.255' },
    { start: '203.34.118.0', end: '203.34.119.255' },
    
    // Common Indonesian ISP ranges
    { start: '36.64.0.0', end: '36.95.255.255' },
    { start: '103.8.0.0', end: '103.31.255.255' },
    { start: '110.136.0.0', end: '110.139.255.255' },
    { start: '114.4.0.0', end: '114.7.255.255' },
    { start: '180.240.0.0', end: '180.243.255.255' },
    { start: '202.67.32.0', end: '202.67.47.255' },
    { start: '103.194.170.0', end: '103.194.171.255' },
    { start: '103.233.0.0', end: '103.233.255.255' },
    { start: '182.253.0.0', end: '182.253.255.255' },
    { start: '103.215.220.0', end: '103.215.223.255' },
    
    // Additional major ISP blocks
    { start: '202.158.0.0', end: '202.158.255.255' },
    { start: '203.130.0.0', end: '203.130.255.255' },
    { start: '115.178.0.0', end: '115.178.255.255' },
    { start: '103.140.0.0', end: '103.140.255.255' },
    { start: '118.136.0.0', end: '118.139.255.255' },
    { start: '103.226.0.0', end: '103.226.255.255' },
    { start: '103.76.0.0', end: '103.76.255.255' },
    { start: '103.13.0.0', end: '103.13.255.255' },
];

// Convert IP address to integer
function ipToInt(ip: string): number {
    const parts = ip.split('.').map(Number);
    return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

// Check if IP is in Indonesian ranges
function isIndonesianIP(ip: string): boolean {
    try {
        const ipInt = ipToInt(ip);
        // console.log('IP as integer:', ipInt, 'for IP:', ip);
        
        const isIndonesian = INDONESIAN_IP_RANGES.some(range => {
            const startInt = ipToInt(range.start);
            const endInt = ipToInt(range.end);
            const inRange = ipInt >= startInt && ipInt <= endInt;
            
            if (inRange) {
                // console.log(`✅ IP ${ip} matches Indonesian range: ${range.start} - ${range.end}`);
            }
            
            return inRange;
        });
        
        if (!isIndonesian) {
            // console.log(`❌ IP ${ip} does not match any Indonesian range`);
        }
        
        return isIndonesian;
    } catch (error) {
        console.error('Error checking Indonesian IP:', error);
        return false;
    }
}

// Helper function to check if Accept-Language indicates Indonesian preference
function hasIndonesianLanguagePreference(acceptLanguage: string | null): boolean {
    if (!acceptLanguage) {
        return false;
    }
    
    const languages = acceptLanguage.split(',').map(lang => lang.trim().split(';')[0].toLowerCase());
    
    // Check for Indonesian language indicators
    return languages.some(lang => 
        lang.startsWith('id') ||        // Indonesian
        lang.startsWith('ms') ||        // Malay (similar to Indonesian)
        lang === 'en-id' ||            // English (Indonesia)
        lang.includes('indonesia') ||   // Any variation with Indonesia
        lang.includes('bahasa')         // Bahasa Indonesia
    );
}

// IP Geolocation function for Indonesia detection
function detectLocaleFromIP(request: NextRequest): string {
    try {
        // Get client IP using request-ip library
        const clientIP = requestIp.getClientIp({
            headers: Object.fromEntries(request.headers.entries()),
            connection: {},
            socket: {}
        } as any);

        // Get Accept-Language header
        const acceptLanguage = request.headers.get('accept-language');
        const hasIndoLangPref = hasIndonesianLanguagePreference(acceptLanguage);
        
        // console.log('Detected IP:', clientIP);
        // console.log('Accept-Language:', acceptLanguage);
        // console.log('Has Indonesian language preference:', hasIndoLangPref);

        // Case 1: Jika gagal detect IP dan tidak ada accept language, arahkan ke id
        if (!clientIP) {
            if (!acceptLanguage) {
                // console.log('❌ No IP detected and no Accept-Language - defaulting to Indonesian');
                return 'id';
            }
            // Jika ada accept language, gunakan preferensi bahasa
            // console.log('❌ No IP detected but has Accept-Language:', hasIndoLangPref ? 'Indonesian' : 'English');
            return hasIndoLangPref ? 'id' : 'en';
        }

        // Case 2: IP local indonesia, tetap arahkan ke id (ignore accept-language)
        if (clientIP === '127.0.0.1' || 
            clientIP === '::1' || 
            clientIP.startsWith('192.168.') || 
            clientIP.startsWith('10.') ||
            clientIP.startsWith('172.16.') ||
            clientIP.startsWith('172.17.') ||
            clientIP.startsWith('172.18.') ||
            clientIP.startsWith('172.19.') ||
            clientIP.startsWith('172.2') ||
            clientIP.startsWith('172.30.') ||
            clientIP.startsWith('172.31.')) {
            
            // console.log('🏠 Local IP detected - always defaulting to Indonesian locale');
            return 'id';
        }

        // Check if IP is from Indonesia using our IP ranges
        // console.log('Checking if IP is Indonesian:', clientIP);
        const isIndonesianIPAddress = isIndonesianIP(clientIP);
        
        if (isIndonesianIPAddress) {
            // Case 3: IP Indonesia - selalu ke Indonesian (ignore accept-language)
            // console.log('🇮🇩 Indonesian IP detected - redirecting to /id');
            return 'id';
        } else {
            // Case 4: IP luar Indonesia
            if (hasIndoLangPref) {
                // IP luar Indonesia tapi accept-language Indonesian - ke id
                // console.log('🌍 Foreign IP but Indonesian language preference - redirecting to /id');
                return 'id';
            } else {
                // IP luar Indonesia dan accept-language bukan Indonesian - ke en
                // console.log('🌍 Foreign IP and non-Indonesian language preference - redirecting to /en');
                return 'en';
            }
        }
        
    } catch (error) {
        console.error('Error in locale detection:', error);
        // Fallback to Indonesian on any error
        return 'id';
    }
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
        // Use IP geolocation for automatic locale detection
        const detectedLocale = detectLocaleFromIP(req);
        return NextResponse.redirect(new URL(`/${detectedLocale}`, req.url));
    }

    // ADMIN REDIRECT LOGIC
    if (pathname === '/admin') {
        // Use IP geolocation for automatic locale detection
        const detectedLocale = detectLocaleFromIP(req);
        return NextResponse.redirect(new URL(`/${detectedLocale}/admin`, req.url));
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
        // Use IP geolocation for automatic locale detection
        const detectedLocale = detectLocaleFromIP(req);

        const url = req.nextUrl.clone();
        url.pathname = `/${detectedLocale}${pathname === '/' ? '' : pathname}`;
        return NextResponse.redirect(url);
    }

    // API ROUTES AUTHENTICATION
    if (isApiRoute) {
        // Get JWT token from Authorization header
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

        // Public routes (tidak memerlukan token)
        const publicRoutes = [
            '/api/auth/',
            '/api/public/',
            '/api/health',
            '/api/cron/',
        ];

        if (publicRoutes.some(route => pathname.startsWith(route))) {
            const response = NextResponse.next();
            response.headers.set("Access-Control-Allow-Origin", "*");
            response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return response;
        }

        // Account API routes - require JWT (semua user yang login)
        if (pathname.startsWith('/api/account')) {
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

        // Customer API routes - require JWT with customer role (or admin/super_admin)
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
            
            // Customer routes allow customer, admin, and super_admin roles
            if (jwtToken.role !== 'customer' && jwtToken.role !== 'admin' && jwtToken.role !== 'super_admin') {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: 'Insufficient permissions',
                        message: 'Customer access required' 
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
        
        // Customer Dashboard Routes Protection
        if (pathWithoutLocale.startsWith('/dashboard')) {
            // Skip authentication check for signin and signup pages
            if (pathWithoutLocale === '/signin' || pathWithoutLocale === '/signup') {
                return NextResponse.next();
            }
            
            // Check for JWT token in localStorage via cookies for customer UI
            const jwtToken = req.cookies.get('auth-token')?.value;
            
            let isValidCustomer = false;
            if (jwtToken) {
                try {
                    const payload = await verifyJWT(jwtToken, JWT_SECRET);
                    // Only allow customers to access customer dashboard, redirect admin to admin panel
                    if (payload && payload.role === 'customer') {
                        isValidCustomer = true;
                    } else if (payload && (payload.role === 'admin' || payload.role === 'super_admin')) {
                        // Redirect admin to admin dashboard
                        return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, req.url));
                    }
                } catch (error) {
                    // JWT verification failed
                }
            }
            
            if (!isValidCustomer) {
                const signInUrl = new URL(`/${locale}/signin`, req.url);
                signInUrl.searchParams.set('callbackUrl', req.url);
                return NextResponse.redirect(signInUrl);
            }
        }

        // Admin UI Routes Protection
        if (pathWithoutLocale.startsWith('/admin')) {
            // Skip authentication check for signin page
            if (pathWithoutLocale === '/admin/signin') {
                return NextResponse.next();
            }
            
            // Check for JWT token in cookies for admin UI (same cookie as customer but check admin role)
            const jwtToken = req.cookies.get('auth-token')?.value;
            
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

        // Continue processing other UI routes
        return NextResponse.next();
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
