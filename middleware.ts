import { NextRequest, NextResponse } from 'next/server';
import {
  isPublicRoute,
  requiresAuth,
  getRequiredRoles,
  requiresEmailVerification,
  shouldBypassAPI,
  hasRequiredRole,
  getUserInfoFromCookies,
  hasValidSession,
  MiddlewareRedirects,
  MiddlewareLogger,
  DEFAULT_ROUTE_PROTECTION,
} from '@/lib/auth/middleware-utils';

/**
 * Enhanced middleware for role-based access control
 * Supports admin dashboard, moderator features, and fine-grained permissions
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // Skip middleware so OAuth callbacks can set cookies before protection runs
    if (pathname.startsWith('/auth/callback')) {
      return NextResponse.next();
    }

    // Skip middleware for static files and API routes that should bypass
    if (
      pathname.startsWith('/_next/') ||
      pathname.includes('.') ||
      shouldBypassAPI(pathname)
    ) {
      return NextResponse.next();
    }

    // Get user information from cookies
    const userInfo = getUserInfoFromCookies(request);
    const hasSession = hasValidSession(request);

    // Handle landing page (/) specially - redirect authenticated users to /home
    if (pathname === '/') {
      console.log('🏠 Middleware: Processing landing page route /', {
        hasSession,
        isAuthenticated: userInfo?.isAuthenticated,
        shouldRedirect: hasSession && userInfo?.isAuthenticated,
      });

      if (hasSession && userInfo?.isAuthenticated) {
        const redirectUrl = new URL('/home', request.url);
        console.log(
          '🔄 Middleware: Redirecting authenticated user from / to /home'
        );
        return NextResponse.redirect(redirectUrl);
      }

      // If not authenticated, allow access to landing page
      console.log(
        '👤 Middleware: Allowing unauthenticated access to landing page'
      );
      return NextResponse.next();
    }

    // Skip middleware for other public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Check if route requires authentication
    if (requiresAuth(pathname)) {
      if (!hasSession || !userInfo?.isAuthenticated) {
        const redirectUrl = MiddlewareRedirects.toSignIn(request);
        MiddlewareLogger.redirectAuth(pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Check role requirements for protected admin/moderator routes
    const requiredRoles = getRequiredRoles(pathname);
    if (requiredRoles && userInfo?.isAuthenticated) {
      if (!hasRequiredRole(userInfo.role, requiredRoles)) {
        const redirectUrl = MiddlewareRedirects.toAccessDenied(
          request,
          'insufficient_role',
          {
            required: requiredRoles.join(','),
            current: userInfo.role || 'none',
          }
        );
        MiddlewareLogger.denyRole(pathname, userInfo.role, requiredRoles);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Check email verification requirements
    if (requiresEmailVerification(pathname) && userInfo?.isAuthenticated) {
      if (!userInfo.emailVerified) {
        const redirectUrl = MiddlewareRedirects.toEmailVerification(request);
        MiddlewareLogger.redirectEmailVerification(pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Handle authenticated users trying to access auth pages
    const authPages = ['/auth/signin', '/auth/signup'];
    if (
      authPages.includes(pathname) &&
      hasSession &&
      userInfo?.isAuthenticated
    ) {
      const redirectUrl = MiddlewareRedirects.fromAuthPages(request);
      MiddlewareLogger.redirectFromAuthPage(pathname, redirectUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Log successful access
    MiddlewareLogger.allowAccess(pathname, userInfo);
    return NextResponse.next();
  } catch (error) {
    MiddlewareLogger.error(error, pathname);

    // In case of error, allow the request to continue
    // Client-side ProtectedRoute components will handle verification
    return NextResponse.next();
  }
}

// Enhanced matcher configuration for better performance
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (static files)
     * - api/auth (auth API routes)
     * - api/public (public API routes)
     * - Files with extensions (images, css, js, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/auth|api/public|.*\\..*).*)',
  ],
};
