import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Sora, JetBrains_Mono, Inter } from 'next/font/google';
import './globals.css';
import ConditionalNavigation from '@/components/auth/ConditionalNavigation';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import {
  WebsiteStructuredData,
  OrganizationStructuredData,
} from '@/components/seo/StructuredData';
import ToastContainer from '@/components/notifications/ToastContainer';
import { CookieConsent } from '@/components/ui/feedback/CookieConsent';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Suspense, lazy } from 'react';
import ChatSkeleton from '@/components/ui/skeletons/ChatSkeleton';
import AppProviders from '@/components/providers/AppProviders';

// Configure optimized fonts
const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'arial'],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
  fallback: ['Consolas', 'Monaco', 'monospace'],
});

// Lazy load interactive components
const ConditionalFloatingChat = lazy(
  () => import('@/components/chat/ConditionalFloatingChat')
);

export const metadata: Metadata = {
  metadataBase: new URL('https://straylight.ai'), // Update with your actual domain
  title: {
    default: 'StrayLight - Kompletny Zestaw Narzędzi AI i Centrum Wiedzy',
    template: '%s | StrayLight',
  },
  description:
    'Kompleksowa platforma AI oferująca bibliotekę zaawansowanych narzędzi, możliwość tworzenia i czytania artykułów oraz bogate zasoby wiedzy.',
  keywords: [
    'AI career guidance',
    'professional development',
    'technology careers',
    'Gen-Z careers',
    'future of work',
    'career coaching',
  ],
  authors: [{ name: 'StrayLight Team' }],
  creator: 'StrayLight',
  publisher: 'StrayLight',
  applicationName: 'StrayLight',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://straylight.ai',
    siteName: 'StrayLight',
    title: 'StrayLight - AI-Powered Career Guidance for Gen-Z Professionals',
    description:
      'AI-powered career guidance platform helping Gen-Z professionals navigate the future of work with expert insights and career development resources.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'StrayLight - AI Career Guidance Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StrayLight - AI-Powered Career Guidance for Gen-Z Professionals',
    description:
      'AI-powered career guidance platform helping Gen-Z professionals navigate the future of work.',
    creator: '@straylight', // Update with your actual Twitter handle
    images: ['/og-default.jpg'],
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${inter.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        {/* Favicon and Web App Manifest */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />

        {/* Global Structured Data */}
        <WebsiteStructuredData />
        <OrganizationStructuredData />

        {/* Dark Mode Only Script - Simplified */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Only run once to prevent conflicts with ThemeProvider
                if (document.documentElement.hasAttribute('data-theme-initialized')) return;
                
                // Always use dark mode
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
                document.documentElement.setAttribute('data-theme-initialized', 'true');
              })();
            `,
          }}
        />

        {/* Google Analytics - Optimized loading */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                
                // Set default consent state
                gtag('consent', 'default', {
                  analytics_storage: 'denied'
                });
                
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  anonymize_ip: true,
                  page_title: document.title,
                  page_location: window.location.href
                });
                
                // Check for existing consent after DOM is ready
                if (typeof window !== 'undefined') {
                  const consent = localStorage.getItem('cookieConsent');
                  if (consent === 'accepted') {
                    gtag('consent', 'update', {
                      analytics_storage: 'granted'
                    });
                  }
                }
              `}
            </Script>
          </>
        )}
      </head>
      <body className="antialiased text-rendering-optimize">
        <AppProviders>
          <ConditionalNavigation />
          <main>{children}</main>
          <ConditionalFooter />
          <ToastContainer position="top-right" />
          <CookieConsent />
          <Suspense
            fallback={<ChatSkeleton />}
            // Add error boundary for the lazy-loaded chat component
          >
            <ConditionalFloatingChat />
          </Suspense>
        </AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
