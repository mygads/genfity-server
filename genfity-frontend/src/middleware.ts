import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create custom middleware that includes geolocation detection
const i18nMiddleware = createMiddleware({
  ...routing,
  localeDetection: false, // We'll handle locale detection manually
});

// Define which paths require authentication
const protectedPaths = ["/dashboard"]
const authPaths = ["/signin", "/signup", "/email-verification", "/forgot-password", "/reset-password"]

// Function to detect country from IP address
async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    console.log('Fetching country for IP:', ip);
    
    // Use ipapi.co for geolocation (free tier available)
    const response = await fetch(`https://ipapi.co/${ip}/country/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js Middleware)',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    });
    
    // console.log('Geolocation API response status:', response.status);
    
    if (response.ok) {
      const country = await response.text();
      // console.log('Raw country response:', country);
      return country.trim().toUpperCase();
    } else {
      console.error('Geolocation API error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Geolocation detection failed:', error);
  }
  return null;
}

// Function to get client IP address
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  
  // console.log('IP Detection Debug:', {
  //   forwarded,
  //   realIP,
  //   cfConnectingIP,
  //   vercelForwardedFor,
  //   userAgent: request.headers.get('user-agent'),
  //   headers: Object.fromEntries(request.headers.entries())
  // });
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback to localhost for development
  return '127.0.0.1';
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // console.log('Middleware called for:', pathname);
  
  // Check if the request is for the root path without locale
  const isRootPath = pathname === '/';
  const hasLocaleInPath = /^\/(en|id)/.test(pathname);
  
  // console.log('Path analysis:', { isRootPath, hasLocaleInPath, pathname });
  
  // If it's root path or doesn't have locale, detect locale from IP
  if (isRootPath || !hasLocaleInPath) {
    const clientIP = getClientIP(request);
    
    // console.log('Detected client IP:', clientIP);
    
    // Check for manual locale override in development (query parameter)
    const forceLocale = searchParams.get('locale');
    if (forceLocale && ['en', 'id'].includes(forceLocale)) {
      // console.log('Locale override detected:', forceLocale);
      const url = request.nextUrl.clone();
      url.pathname = `/${forceLocale}${pathname === '/' ? '' : pathname}`;
      url.searchParams.delete('locale'); // Remove the locale param from URL
      return NextResponse.redirect(url);
    }
      // For localhost/development, try to detect from Accept-Language header
    if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
      // console.log('Local IP detected, checking Accept-Language header');
      
      const acceptLanguage = request.headers.get('accept-language');
      // console.log('Accept-Language header:', acceptLanguage);
      
      let detectedLocale = 'id'; // Default to Indonesian for development testing
      
      // Check if Indonesian is preferred in Accept-Language
      if (acceptLanguage) {
        const languages = acceptLanguage.split(',').map(lang => lang.trim().split(';')[0]);
        // console.log('Parsed languages:', languages);
        
        // Check for English language preferences specifically
        if (languages.some(lang => lang.startsWith('en') && !lang.startsWith('en-ID'))) {
          // Only switch to English if English is explicitly preferred and not en-ID
          const hasIndonesian = languages.some(lang => 
            lang.startsWith('id') || 
            lang.startsWith('ms') || 
            lang === 'en-ID'
          );
          
          if (!hasIndonesian) {
            detectedLocale = 'en';
            // console.log('English language detected without Indonesian preference');
          }
        }
      }
      
      console.log('Selected locale for localhost:', detectedLocale);
      const url = request.nextUrl.clone();
      url.pathname = `/${detectedLocale}${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url);
    }
    
    try {
      // console.log('Attempting geolocation for IP:', clientIP);
      const country = await getCountryFromIP(clientIP);
      // console.log('Detected country:', country);
      
      const detectedLocale = country === 'ID' ? 'id' : 'en';
      // console.log('Selected locale:', detectedLocale);
      
      const url = request.nextUrl.clone();
      url.pathname = `/${detectedLocale}${pathname === '/' ? '' : pathname}`;
      // console.log('Redirecting to:', url.pathname);
      return NextResponse.redirect(url);
    } catch (error) {
      console.error('Geolocation failed:', error);
      // Fallback to default locale if geolocation fails
      const url = request.nextUrl.clone();
      url.pathname = `/en${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url);
    }
  }
  
  // console.log('Applying i18n middleware for path with locale:', pathname);
  
  // Apply i18n middleware for paths that already have locale
  const i18nResponse = i18nMiddleware(request);
  
  // Extract locale from the path
  const locale = pathname.split('/')[1] || 'en'
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'

  // Check if the path is protected (requires authentication)
  const isProtectedPath = protectedPaths.some((path) =>
    pathWithoutLocale.startsWith(path)
  )

  // Check if the path is auth-related (signin, signup, etc.)
  const isAuthPath = authPaths.some((path) =>
    pathWithoutLocale.startsWith(path)
  )

  // Let client-side AuthProtectedRoute handle auth validation
  // Middleware just ensures proper routing structure
  return i18nResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo, images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-dark.svg|logo-light.svg|placeholder.svg|web-icon.svg|images|robots.txt|sitemap.xml).*)',
  ]
};

