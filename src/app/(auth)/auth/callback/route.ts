// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const DEFAULT_REDIRECT = '/home';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const redirectParam =
    url.searchParams.get('redirect') ?? url.searchParams.get('next');

  // Check if user has pending quiz results to view
  // If redirect is to /quiz/results, preserve it
  const destination = redirectParam || DEFAULT_REDIRECT;

  // Build final destination URL with all query parameters from callback
  const destinationUrl = new URL(destination, url.origin);

  // Forward all query parameters except 'redirect', 'next', and 'code'
  url.searchParams.forEach((value, key) => {
    if (key !== 'redirect' && key !== 'next' && key !== 'code') {
      destinationUrl.searchParams.set(key, value);
    }
  });

  // Prepare redirect response now; we'll attach cookies to it
  const res = NextResponse.redirect(destinationUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          const cookieOptions = {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            ...(options ?? {}),
          } as any;

          res.cookies.set({
            name,
            value,
            ...cookieOptions,
          });
        },
        remove: (name, options) => {
          const deleteOptions = {
            name,
            path: '/',
            ...(options ?? {}),
          } as any;

          res.cookies.delete(deleteOptions);
        },
      },
    }
  );

  const code = url.searchParams.get('code');

  if (code) {
    // Force Next.js to hydrate incoming cookies so Supabase can access the PKCE verifier
    req.cookies.getAll();

    const isEmailVerificationError = (message?: string | null) => {
      if (!message) return false;
      const normalized = message.toLowerCase();
      return [
        'email not confirmed',
        'needs verification',
        'verify your email',
        'email needs confirmation',
        'provider_email_needs_verification',
      ].some((indicator) => normalized.includes(indicator));
    };

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const message = error.message ?? 'Unable to sign in with Google.';

      if (isEmailVerificationError(message)) {
        return NextResponse.redirect(new URL('/auth/verify-email', url.origin));
      }

      const signInUrl = new URL('/auth/signin', url.origin);
      signInUrl.searchParams.set('error', message);
      return NextResponse.redirect(signInUrl);
    }

    const session = data?.session ?? null;

    if (!session?.access_token || !session.refresh_token) {
      const user = data?.user;

      if (user && !user.email_confirmed_at) {
        return NextResponse.redirect(new URL('/auth/verify-email', url.origin));
      }

      const signInUrl = new URL('/auth/signin', url.origin);
      signInUrl.searchParams.set(
        'error',
        'We could not establish a session. Please try signing in again.'
      );
      return NextResponse.redirect(signInUrl);
    }

    // Use the already-built destinationUrl with all query params
    const hashParams = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    destinationUrl.hash = hashParams.toString();
    res.headers.set('Location', destinationUrl.toString());
  }

  return res;
}
