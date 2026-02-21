'use client';

import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t mt-0 bg-black text-white border-neutral-800">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-black"></div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12 text-center md:text-left">
            {/* Brand Column */}
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-6">
                <img
                  src="/logo transparent.png"
                  alt="StrayLight Logo"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                />
                <span className="text-2xl font-bold text-white">
                  STRAYLIGHT
                </span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed mb-8 max-w-sm">
                Przewodnictwo kariery wspierane przez AI dla następnej generacji
                profesjonalistów. Nawiguj przyszłość pracy z pewnością siebie.
              </p>

              {/* Social Icons */}
              <div className="flex space-x-4 justify-center md:justify-start">
                {/* X (formerly Twitter) */}
                <a
                  href="https://x.com/straylight404"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer relative z-10"
                  aria-label="Follow StrayLight on X"
                  title="X - @straylight404"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/company/straylight-center/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer relative z-10"
                  aria-label="Follow StrayLight on LinkedIn"
                  title="LinkedIn - @straylightcenter"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/straylightcenter/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer relative z-10"
                  aria-label="Follow StrayLight on Instagram"
                  title="Instagram - @straylightcenter"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@straylightcenter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer relative z-10"
                  aria-label="Follow StrayLight on TikTok"
                  title="TikTok - @straylightcenter"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Firma
              </h3>
              <nav className="space-y-3">
                <Link
                  href="/about"
                  className="block text-neutral-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  O Nas
                </Link>
                <Link
                  href="/auth/signup"
                  className="block text-neutral-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Dołącz do nas
                </Link>
                <Link
                  href="/help"
                  className="block text-neutral-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Pomoc
                </Link>
              </nav>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Prawne
              </h3>
              <nav className="space-y-3">
                <Link
                  href="/privacy"
                  className="block text-neutral-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Polityka Prywatności
                </Link>
                <Link
                  href="/terms"
                  className="block text-neutral-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Regulamin
                </Link>
                <Link
                  href="/cookies"
                  className="block text-neutral-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Polityka Cookies
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
            <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-2 md:gap-0">
              {/* Copyright */}
              <div className="text-sm text-neutral-400 text-center md:text-left">
                © 2025 StrayLight Center. Wszystkie prawa zastrzeżone.
              </div>

              {/* Contact Email */}
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                <a
                  href="mailto:straylightcenter@gmail.com"
                  className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  straylightcenter@gmail.com
                </a>

                {/* Language selector */}
                <div className="text-sm text-neutral-400 flex items-center space-x-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                    />
                  </svg>
                  <span>Polski</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
