import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, supportedLocales } from './i18n/config';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static files, api routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if pathname has a supported locale
  const pathnameHasLocale = supportedLocales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // If path starts with an unsupported 2-letter segment (e.g. /fr/search), replace it with defaultLocale
  const unsupportedLocaleMatch = pathname.match(/^\/([a-zA-Z]{2})(\/.*|$)/);
  const normalizedPath = unsupportedLocaleMatch
    ? `/${defaultLocale}${unsupportedLocaleMatch[2] || ''}`
    : `/${defaultLocale}${pathname}`;

  const redirectUrl = new URL(normalizedPath, request.url);
  redirectUrl.search = request.nextUrl.search;
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
