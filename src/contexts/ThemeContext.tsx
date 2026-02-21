'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';

interface ThemeContextType {
  theme: 'dark';
  resolvedTheme: 'dark';
  isInitialized: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Track if theme has been initialized to prevent hydration flash
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to initialize and apply dark theme
  useEffect(() => {
    const root = document.documentElement;

    // Ensure dark mode is always applied
    root.classList.remove('light');
    root.classList.add('dark');

    // Update meta theme-color for mobile browsers (dark theme color)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#09090b');
    }

    // Mark as initialized
    setIsInitialized(true);
  }, []);

  const value = useMemo(
    () => ({
      theme: 'dark' as const,
      resolvedTheme: 'dark' as const,
      isInitialized,
    }),
    [isInitialized]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
