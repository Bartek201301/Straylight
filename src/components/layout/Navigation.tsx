'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Pre-sign-in navigation items
const publicNavItems = [
  { href: '/', label: 'Home' },
  { href: '/articles', label: 'Artykuły' },
  { href: '/library', label: 'Biblioteka' },
  { href: '/quiz', label: 'LightTool' },
  { href: '/about', label: 'O nas' },
];

// Post-sign-in navigation items
const authenticatedNavItems = [
  { href: '/home', label: 'Home' },
  { href: '/articles', label: 'Artykuły' },
  { href: '/library', label: 'Biblioteka' },
  { href: '/quiz', label: 'LightTool' },
  { href: '/about', label: 'O nas' },
];

function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Debug logging for authentication state
  // console.log('🔍 Navigation Debug:', {
  //   user: !!user,
  //   authLoading,
  //   mounted,
  //   userRole: user?.role,
  //   timestamp: new Date().toISOString(),
  // });

  // Determine which navigation items to use - wait for auth to resolve
  // Only determine navItems after mounting and auth loading is complete
  const navItems =
    mounted && !authLoading
      ? user
        ? authenticatedNavItems
        : publicNavItems
      : publicNavItems; // Default to public while loading

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Prevent hydration mismatch and detect mobile screen
  useEffect(() => {
    setMounted(true);

    // Check if we're on mobile (below lg breakpoint = 1024px)
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle scroll effect and mobile header visibility
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const newScrolled = scrollPosition > 20;
      setScrolled(newScrolled);

      // Only apply scroll-based hide/show logic on mobile screens
      if (isMobile) {
        const scrollDifference = scrollPosition - lastScrollY;

        // Always show header when at top of page
        if (scrollPosition < 100) {
          setIsHeaderVisible(true);
        }
        // Hide header when scrolling down (and not at top)
        else if (scrollDifference > 10 && scrollPosition > 100) {
          setIsHeaderVisible(false);
          setIsMobileMenuOpen(false); // Close mobile menu when hiding header
        }
        // Show header when scrolling up
        else if (scrollDifference < -10) {
          setIsHeaderVisible(true);
        }
      } else {
        // On desktop, always keep header visible
        setIsHeaderVisible(true);
      }

      setLastScrollY(scrollPosition);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted, lastScrollY, isMobile]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Show loading state while authentication is being determined
  const showLoadingState = authLoading && mounted;

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 
        transition-all duration-300 ease-out
        ${
          scrolled
            ? 'mt-1 mx-4 lg:mt-2 lg:mx-8 xl:mx-12' // Responsive margins for all desktop sizes
            : 'mt-2 mx-2' // Consistent simple margins for mobile/tablet
        }
        ${
          isMobile && !isHeaderVisible
            ? 'transform -translate-y-full'
            : 'transform translate-y-0'
        }
      `}
    >
      <div
        className={`
          relative flex items-center h-12
          transition-all duration-700 ease-out
          ${
            scrolled
              ? 'px-4 py-2 mx-2 rounded-2xl shadow-lg bg-black/60 backdrop-blur-md border border-gray-500/20 lg:mx-8 lg:px-8 lg:py-2 lg:rounded-2xl lg:shadow-2xl lg:bg-black/60 lg:backdrop-blur-md lg:border lg:border-gray-500/30 xl:mx-12'
              : 'px-4 py-1 bg-black'
          }
        `}
      >
        {/* Lewa strona - Logo i tytuł */}
        <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
          <img
            src="/logo transparent.png"
            alt="StrayLight Logo"
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain transition-all duration-700 ease-out"
          />
          <span
            className={`
            text-lg sm:text-xl font-bold transition-all duration-700 ease-out cursor-pointer
            bg-gradient-to-r from-white via-gray-100 to-cyan-200 bg-clip-text text-transparent hover:from-cyan-200 hover:via-white hover:to-purple-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:drop-shadow-[0_0_12px_rgba(100,255,255,0.6)]
            ${scrolled ? 'tracking-wide' : 'tracking-wider'}
          `}
          >
            STRAYLIGHT
          </span>
        </Link>

        {/* Środek - Navigation links - Hidden until lg (1024px) */}
        <div className="hidden lg:flex items-center justify-center flex-1 space-x-2">
          {showLoadingState ? (
            // Show skeleton loading state
            <div className="flex items-center space-x-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="px-4 py-2 bg-white/10 rounded-lg animate-pulse"
                  style={{ width: '80px', height: '36px' }}
                />
              ))}
            </div>
          ) : (
            navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg ${
                    isActive
                      ? 'bg-white text-black shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })
          )}
        </div>

        {/* Prawa strona - User Actions */}
        <div className="flex items-center space-x-4 ml-auto flex-shrink-0">
          {/* User Actions */}
          {showLoadingState ? (
            // Show skeleton loading for user actions
            <div className="hidden lg:flex items-center space-x-2">
              <div
                className="px-4 py-2 bg-white/10 rounded-lg animate-pulse"
                style={{ width: '60px', height: '36px' }}
              />
              <div
                className="px-4 py-2 bg-white/10 rounded-lg animate-pulse"
                style={{ width: '90px', height: '36px' }}
              />
              <div
                className="px-4 py-2 bg-white/10 rounded-lg animate-pulse"
                style={{ width: '80px', height: '36px' }}
              />
            </div>
          ) : mounted && !authLoading && user ? (
            <div className="hidden lg:flex items-center space-x-2">
              <Link
                href="/write"
                className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg ${
                  pathname === '/write'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Write
              </Link>
              <Link
                href="/dashboard"
                className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg ${
                  pathname?.startsWith('/dashboard')
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 font-medium transition-all duration-300 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                Sign Out
              </button>
            </div>
          ) : mounted && !authLoading && !user ? (
            <div className="hidden lg:flex items-center space-x-2">
              <Link
                href="/auth/signin"
                className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg ${'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg ${'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Get Started
              </Link>
            </div>
          ) : null}

          {/* Mobile menu button - Show up to lg (1024px) */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="focus:outline-none transition-colors duration-200 p-2 text-white/80 hover:text-white"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">
                {isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              </span>
              {/* Hamburger/Close icon */}
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu - Show up to lg (1024px) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-2">
          <div
            className={`
            px-4 pt-2 pb-3 space-y-1 rounded-2xl shadow-2xl
            ${
              scrolled
                ? 'bg-black backdrop-blur-md border border-gray-500/30'
                : 'bg-black backdrop-blur-md border border-gray-500/20'
            }
          `}
          >
            {showLoadingState
              ? // Mobile skeleton loading
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="block px-3 py-2 bg-white/10 rounded-lg animate-pulse"
                    style={{ height: '40px' }}
                  />
                ))
              : navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-3 py-2 font-medium transition-all duration-300 rounded-lg ${
                        isActive
                          ? 'bg-white text-black shadow-lg'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}

            {/* Mobile User Actions */}
            {showLoadingState ? (
              // Mobile user actions skeleton
              <>
                <div
                  className="block px-3 py-2 bg-white/10 rounded-lg animate-pulse"
                  style={{ height: '40px' }}
                />
                <div
                  className="block px-3 py-2 bg-white/10 rounded-lg animate-pulse"
                  style={{ height: '40px' }}
                />
                <div
                  className="block px-3 py-2 bg-white/10 rounded-lg animate-pulse"
                  style={{ height: '40px' }}
                />
              </>
            ) : mounted && !authLoading && user ? (
              <>
                <Link
                  href="/write"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 font-medium transition-all duration-300 rounded-lg ${
                    pathname === '/write'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Write
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 font-medium transition-all duration-300 rounded-lg ${
                    pathname?.startsWith('/dashboard')
                      ? 'bg-white text-black shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="block w-full text-left px-3 py-2 font-medium transition-all duration-300 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                >
                  Sign Out
                </button>
              </>
            ) : mounted && !authLoading && !user ? (
              <>
                <Link
                  href="/auth/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 font-medium transition-all duration-300 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 font-medium transition-all duration-300 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                >
                  Get Started
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navigation;
