'use client';

import React, { useEffect, lazy, Suspense } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OrbSkeleton from '@/components/ui/skeletons/OrbSkeleton';
import ScrollAnimationSkeleton from '@/components/ui/skeletons/ScrollAnimationSkeleton';

// Lazy load heavy components
const Orb = lazy(() => import('@/components/effects/Orb/Orb'));
const StickyScroll = lazy(() =>
  import('@/components/ui/sticky-scroll-reveal').then((mod) => ({
    default: mod.StickyScroll,
  }))
);
const ContainerScroll = lazy(() =>
  import('@/components/ui/container-scroll-animation').then((mod) => ({
    default: mod.ContainerScroll,
  }))
);
const ProblemSolution = lazy(() =>
  import('@/components/ProblemSolution').then((mod) => ({
    default: mod.ProblemSolution,
  }))
);
const CommunityGrowth = lazy(() => import('@/components/home/CommunityGrowth'));
const FinalCTA = lazy(() => import('@/components/home/FinalCTA'));
const HeroNewsletterCTA = lazy(
  () => import('@/components/home/HeroNewsletterCTA')
);
export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Client-side fallback: redirect authenticated users to /home
  useEffect(() => {
    window.scrollTo(0, 0);

    // Only redirect if we're sure the user is authenticated and not loading
    if (!loading && user) {
      console.log(
        '🔄 Client-side redirect: Authenticated user detected, redirecting to /home'
      );
      router.push('/home');
    }
  }, [user, loading, router]);

  // Show landing page only for confirmed unauthenticated users
  return (
    <div className={`min-h-screen relative bg-black`}>
      {/* Performance optimization: Reduced motion support */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .motion-reduce-friendly * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
      {/* Full-Screen Orb Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden mb-12 sm:mb-20">
        {/* Large Background Orb - Mobile Optimized */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[75vw] h-[60vh] xxs:w-[70vw] xxs:h-[65vh] xs:w-[80vw] xs:h-[70vh] sm:w-[85vw] sm:h-[80vh] md:w-[90vw] md:h-[85vh] lg:w-[90vw] lg:h-[90vh] max-w-5xl max-h-5xl">
            <Suspense fallback={<OrbSkeleton />}>
              <Orb
                hue={260}
                hoverIntensity={0.4}
                rotateOnHover={true}
                forceHoverState={false}
              />
            </Suspense>
          </div>
        </div>

        {/* Hero Text Overlay - Mobile Optimized */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          <h1 className="text-3xl xxs:text-4xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white font-inter mb-4 xxs:mb-5 xs:mb-6 sm:mb-6 leading-tight">
            Odkryj Przyszłość AI z StrayLight
          </h1>
          <p className="text-base xxs:text-lg xs:text-lg sm:text-xl md:text-2xl text-white/90 font-source max-w-2xl xxs:max-w-2xl xs:max-w-3xl mx-auto mb-5 xxs:mb-6 xs:mb-7 sm:mb-8 leading-relaxed">
            Twoja platforma rozwoju kariery w erze sztucznej inteligencji
          </p>

          {/* CTA Buttons - Mobile Optimized */}
          <div className="flex flex-col xxs:flex-col xs:flex-col sm:flex-row gap-3 xxs:gap-3 xs:gap-3 sm:gap-4 justify-center items-center max-w-sm xxs:max-w-md xs:max-w-lg sm:max-w-none mx-auto">
            <a
              href="/auth/signup"
              className="w-full xxs:w-full xs:w-full sm:w-auto inline-flex items-center justify-center px-6 xxs:px-7 xs:px-8 sm:px-8 py-3 xxs:py-3 xs:py-3.5 sm:py-4 bg-white text-black text-sm xxs:text-base xs:text-base sm:text-lg font-semibold rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl touch-manipulation"
            >
              Dołącz do społeczności
            </a>
            <a
              href="/about"
              className="w-full xxs:w-full xs:w-full sm:w-auto inline-flex items-center justify-center px-6 xxs:px-7 xs:px-8 sm:px-8 py-3 xxs:py-3 xs:py-3.5 sm:py-4 bg-transparent border-2 border-white/30 text-white text-sm xxs:text-base xs:text-base sm:text-lg font-semibold rounded-full hover:border-white/50 hover:bg-white/5 transition-all duration-300 touch-manipulation"
            >
              Dowiedz się więcej
            </a>
          </div>
        </div>
      </section>

      {/* Problem → Solution Scroll Block */}
      <Suspense fallback={<ScrollAnimationSkeleton type="container" />}>
        <ProblemSolution />
      </Suspense>

      {/* LightTool CTA Section */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-sm bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-inter mb-4">
              Nie wiesz, od czego zacząć?
            </h2>
            <p className="text-lg md:text-xl text-white/80 font-source mb-8 max-w-2xl mx-auto">
              Wypełnij nasz 10-pytaniowy quiz i znajdź 3 narzędzia AI idealne
              dla Ciebie. Szybko, za darmo, spersonalizowane.
            </p>
            <a
              href="/quiz"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-black text-lg font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Wypróbuj LightTool 🚀
            </a>
            <p className="mt-4 text-sm text-white/60 text-center mx-auto">
              ⚡ Mniej niż minuta • 🎯 Inteligentne dopasowanie • ✨ Sprawdzone
              narzędzia
            </p>
          </div>
        </div>
      </section>

      {/* Container Scroll Animation Section */}
      <Suspense fallback={<ScrollAnimationSkeleton type="container" />}>
        <ContainerScroll
          titleComponent={
            <div className="text-center mb-6 xs:mb-8 px-4">
              <h2 className="text-2xl xxs:text-3xl xs:text-4xl sm:text-4xl md:text-6xl font-bold text-white font-inter mb-3 xs:mb-4 leading-tight">
                Nasze Narzędzia i Technologie
              </h2>
              <p className="text-sm xxs:text-base xs:text-lg sm:text-lg md:text-xl text-white/90 font-source max-w-xs xxs:max-w-sm xs:max-w-2xl mx-auto leading-relaxed">
                Odkryj rozwiązania, które kształtują przyszłość programowania i
                designu
              </p>
            </div>
          }
        >
          <div className="relative h-full w-full">
            <Image
              src="/gallery/features/home-dashboard-screen.png"
              alt="Podgląd głównej strony platformy StrayLight"
              fill
              className="hidden md:block object-cover"
              sizes="(max-width: 767px) 0px, 60rem"
              priority
            />
            <Image
              src="/gallery/features/home-dashboard-container.png"
              alt="Mobilny podgląd głównej strony StrayLight"
              fill
              className="md:hidden object-cover"
              sizes="(max-width: 767px) 90vw, 0px"
              priority
            />
          </div>
        </ContainerScroll>
      </Suspense>

      <main className="relative z-10 -mt-6 xs:-mt-8 sm:-mt-12 motion-reduce-friendly">
        {/* Features Walkthrough Section - Mobile Optimized */}
        <section className="px-4 sm:px-6 py-12 xs:py-16 sm:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 xxs:mb-10 xs:mb-12 sm:mb-16">
              <h2 className="text-2xl xxs:text-3xl xs:text-4xl sm:text-4xl md:text-6xl font-bold text-white font-inter mb-3 xxs:mb-4 xs:mb-4 sm:mb-4 leading-tight">
                Odkryj Możliwości Platformy
              </h2>
              <p className="text-sm xxs:text-base xs:text-lg sm:text-lg md:text-xl text-white/90 font-source max-w-xs xxs:max-w-sm xs:max-w-2xl sm:max-w-2xl mx-auto leading-relaxed">
                Przewiń, aby poznać funkcje, które sprawią, że Twoja podróż z AI
                będzie jeszcze bardziej efektywna
              </p>
            </div>

            <Suspense fallback={<ScrollAnimationSkeleton type="sticky" />}>
              <StickyScroll
                content={[
                  {
                    title: (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-ai-teal-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        Artykuły
                      </div>
                    ),
                    description:
                      'Dokładnie analizujemy teksty które publikujemy, dzięki temu masz pewność, że artykuły zawierają jedynie sprawdzone i wartościowe informacje.',
                    imageSrc: '/gallery/features/articles-screen.png',
                    imageAlt:
                      'Widok sekcji artykułów platformy StrayLight na ekranie iPhone 15 Pro',
                  },
                  {
                    title: (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-emerald-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                          />
                        </svg>
                        Biblioteka
                      </div>
                    ),
                    description:
                      'Nasze pozycje nie są przypadkowe. Każde narzędzie, źródło czy książka sprawi, że wyróżnisz się na rynku pracy, a także poszerzysz swoją wiedzę.',
                    imageSrc: '/gallery/features/library-screen.png',
                    imageAlt:
                      'Widok biblioteki zasobów StrayLight na ekranie iPhone 15 Pro',
                  },
                  {
                    title: (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                        Publikuj Własne Treści
                      </div>
                    ),
                    description:
                      'Każdy może napisać artykuł i go opublikować. Ty też!',
                    imageSrc: '/gallery/features/publish-screen.png',
                    imageAlt:
                      'Panel publikacji treści na platformie StrayLight widoczny na iPhonie',
                  },
                  {
                    title: (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-violet-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        Search & Filter
                      </div>
                    ),
                    description:
                      'Nie chcemy marnować twojego czasu, który szczególnie teraz, jest tak ważny. Dlatego w ramach StrayLight masz dostęp do funkcji inteligentnego wyszukiwania i filtrowania treści.',
                    imageSrc: '/gallery/features/search-screen.png',
                    imageAlt:
                      'Ekran wyszukiwania i filtrowania zasobów StrayLight na iPhonie',
                  },
                  {
                    title: (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-pink-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Networking & Public Profiles
                      </div>
                    ),
                    description:
                      '"Młodzi ludzie nie mają kontaktów" - to zdanie słyszał prawie każdy z nas. Dlatego StrayLight to miejsce gdzie możesz, dzięki publikacji artykułów i materiałów, rozwijać swoją sieć kontaktów i poznawać ludzi którzy myślą podobnie do ciebie.',
                    imageSrc: '/gallery/features/networking-screen.png',
                    imageAlt:
                      'Profil publiczny użytkownika StrayLight wyświetlony na iPhonie',
                  },
                  {
                    title: (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-emerald-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Newsletter
                      </div>
                    ),
                    description:
                      'Nasz Newsletter pozwoli ci być na czasie z najważniejszymi informacjami czy zmianami w świecie AI. Nie pozwól, żeby cokolwiek cię zaskoczyło!',
                    imageSrc: '/gallery/features/newsletter-screen.png',
                    imageAlt:
                      'Ekran zapisu do newslettera StrayLight na iPhonie',
                  },
                  {
                    title: (
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-6 h-6 text-yellow-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Rozpocznij swoją podróż
                      </div>
                    ),
                    description:
                      'Dołącz do nas i weź odpowiedzialność za swoją przyszłość!',
                    imageSrc: '/gallery/features/get-started-screen.png',
                    imageAlt:
                      'Ekran startowy aplikacji StrayLight zachęcający do rejestracji',
                  },
                ]}
              />
            </Suspense>
          </div>
        </section>

        {/* Community Growth Section */}
        <Suspense fallback={<ScrollAnimationSkeleton type="container" />}>
          <CommunityGrowth />
        </Suspense>

        {/* Final CTA Section */}
        <Suspense
          fallback={
            <div className="h-64 animate-pulse bg-white/5 rounded-xl mx-4"></div>
          }
        >
          <FinalCTA />
        </Suspense>

        {/* Hero Newsletter CTA Section */}
        <Suspense
          fallback={
            <div className="h-32 animate-pulse bg-white/5 rounded-xl mx-4"></div>
          }
        >
          <HeroNewsletterCTA />
        </Suspense>

        {/* Content spacing - global footer will be added by layout */}
        <div className="pb-16 sm:pb-20 lg:pb-24"></div>
      </main>
    </div>
  );
}
