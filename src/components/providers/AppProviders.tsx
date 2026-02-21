'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ServiceWorkerProvider } from '@/components/providers/ServiceWorkerProvider';
import { ResourcePreloadProvider } from '@/components/providers/ResourcePreloadProvider';
import { AssetPerformanceProvider } from '@/components/providers/AssetPerformanceProvider';
import ClientProvider from '@/components/providers/ClientProvider';
import FontPerformanceProvider from '@/components/providers/FontPerformanceProvider';
import ChunkErrorBoundary from '@/components/errors/ChunkErrorBoundary';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Consolidated app providers to reduce layout nesting depth
 * and prevent chunk loading issues
 */
export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ChunkErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <ToastProvider>
              <ServiceWorkerProvider
                enableServiceWorker={process.env.NODE_ENV === 'production'}
                enableInDevelopment={false}
              >
                <ResourcePreloadProvider
                  enableSmartPreloading={true}
                  preloadFonts={true}
                  enableRoutePreloading={true}
                >
                  <AssetPerformanceProvider
                    enableByDefault={process.env.NODE_ENV === 'development'}
                    enableConsoleLogging={
                      process.env.NODE_ENV === 'development'
                    }
                  >
                    <ClientProvider>
                      {children}
                      <FontPerformanceProvider />
                    </ClientProvider>
                  </AssetPerformanceProvider>
                </ResourcePreloadProvider>
              </ServiceWorkerProvider>
            </ToastProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </ChunkErrorBoundary>
  );
}
