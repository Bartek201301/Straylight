'use client';

import { PageStructuredData } from '@/components/seo/StructuredData';
import { MiniNewsletterSignup } from '@/components/newsletter/MiniNewsletterSignup';
import StackingCardsSection from '@/components/effects/StackingCardsSection';
import dynamic from 'next/dynamic';

const CobeGlobe = dynamic(() => import('@/components/effects/CobeGlobe'), {
  ssr: false,
});
import MobileHorizontalScroll from '@/components/effects/MobileHorizontalScroll';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { LinkedInIcon, InstagramIcon } from '@/components/ui/icons';

// Team members data
const teamMembers = [
  {
    name: 'Kajetan',
    role: 'Co-founder',
    bio: '',
    image: '/kai profilowe.jpg',
    linkedin: 'https://www.linkedin.com/in/kajetan-kotfis-1931b1353/',
    instagram: 'https://www.instagram.com/kotfis2025/',
  },
  {
    name: 'Julian',
    role: 'Co-founder',
    bio: '',
    image: '/julian profiowe.jpg',
    linkedin: 'https://www.linkedin.com/in/julian-malicki-216367218/',
    instagram: 'https://www.instagram.com/juianmalicki/',
  },
  {
    name: 'Bartek',
    role: 'Co-founder',
    bio: '',
    image: '/bartek profile.jpg',
    linkedin: 'https://www.linkedin.com/in/bartosz-swiridow-96520636b/',
    instagram: 'https://www.instagram.com/bartekswiridow/',
  },
  {
    name: 'Maciek',
    role: 'Co-founder',
    bio: '',
    image: '/maciek profilowe.jpg',
    linkedin: 'https://www.linkedin.com/in/maciej-d%C4%99bicki-3aaa5b363/',
    instagram: 'https://www.instagram.com/maciek_debicki_/',
  },
];

export default function AboutContent() {
  return (
    <>
      {/* Enhanced Structured Data */}
      <PageStructuredData
        pageType="about"
        title="About StrayLight - AI Career Guidance for Gen-Z Professionals"
        description="Learn about StrayLight's mission to guide Gen-Z professionals through the AI revolution. Discover how we bridge research and practical career guidance."
        path="/about"
      />

      {/* Mobile-only */}
      <div
        className={`block sm:hidden ${false ? 'bg-white text-black' : 'bg-black text-white'}`}
      >
        <section className="pt-16 pb-10 px-4 relative">
          <div className="max-w-md mx-auto text-center">
            {/* Górny nagłówek (jak Vidyard: About Us) */}
            <p className="text-xs tracking-widest uppercase text-white/70">
              O nas
            </p>

            {/* Dolny większy nagłówek */}
            <h2 className="mt-3 text-3xl font-bold leading-snug">
              Twój klucz do rozwoju w erze sztucznej inteligencji.
            </h2>

            {/* Treść (akapit) */}
            <p className={`mt-4 text-base leading-7 ${'text-white/80'}`}>
              StrayLight to platforma, która pomaga młodym ludziom zrozumieć i
              wykorzystać AI. Użytkownicy mogą publikować własne artykuły,
              korzystać z materiałów i poradników dostępnych na stronie oraz
              sięgać po narzędzia wspierające ich rozwój zawodowy.
            </p>

            {/* Jeden przycisk CTA */}
            <div className="mt-6">
              <a
                href="/auth/signup"
                className="inline-block px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold"
              >
                Załóż konto za darmo
              </a>
            </div>
          </div>
        </section>

        {/* Sekcja Stacking Cards */}
        <StackingCardsSection />

        {/* Cel projektu + globus (mobile only) */}
        <section className={`py-12 border-t ${'border-white/10'}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-white">
                Jaki jest cel projektu?
              </h2>
              <p
                className={`mt-4 text-base leading-7 text-center ${'text-white/80'}`}
              >
                Naszą ambicją jest globalny wpływ – chcemy demokratyzować rozwój
                kariery w świecie AI i ułatwiać dostęp do wiedzy, narzędzi oraz
                społeczności niezależnie od miejsca zamieszkania. W erze
                globalizacji wierzymy, że mądrze dobrane treści, praktyczne
                ścieżki i otwarta społeczność mogą realnie poprawiać życie i
                możliwości zawodowe ludzi na całym świecie.
              </p>
            </div>

            <div className="mt-8">
              <CobeGlobe />
            </div>
          </div>
        </section>

        {/* Sekcja: Poziomy scrolling (mobile only, ostatnia sekcja) */}
        <section className={`pt-10 pb-0 border-t ${'border-white/10'}`}>
          <div className="px-4">
            <h3 className="text-2xl font-bold text-white mb-4">
              Poznaj nas bliżej
            </h3>
          </div>
          <div className="block sm:hidden">
            <MobileHorizontalScroll />
          </div>
        </section>
      </div>

      {/* Desktop-only */}
      <div
        className={`min-h-screen relative z-10 hidden sm:block ${
          false ? 'bg-white text-black' : 'bg-black text-white'
        }`}
      >
        {/* 1. Hero Section - matching mobile content */}
        <section className="pt-20 pb-16 sm:pt-28 sm:pb-20 md:pt-32 lg:pt-40 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 sm:space-y-6 max-w-4xl mx-auto">
              <p className="text-xs tracking-widest uppercase text-white/70">
                O nas
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-snug">
                Twój klucz do rozwoju w erze sztucznej inteligencji.
              </h1>
              <p
                className={`text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-7 sm:leading-8 ${'text-white/80'}`}
              >
                StrayLight to platforma, która pomaga młodym ludziom zrozumieć i
                wykorzystać AI. Użytkownicy mogą publikować własne artykuły,
                korzystać z materiałów i poradników dostępnych na stronie oraz
                sięgać po narzędzia wspierające ich rozwój zawodowy.
              </p>
              <div className="mt-8">
                <a
                  href="/auth/signup"
                  className="inline-block px-6 py-3 rounded-xl bg-white text-black text-base font-semibold hover:bg-white/90 transition-colors"
                >
                  Załóż konto za darmo
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Stacking Cards Section - matching mobile */}
        <StackingCardsSection />

        {/* 4. Project Goal + Globe Section - matching mobile */}
        <section
          className={`py-12 sm:py-16 lg:py-20 border-t ${'border-white/10'}`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Jaki jest cel projektu?
              </h2>
              <p
                className={`mt-6 text-base sm:text-lg md:text-xl leading-7 sm:leading-8 text-center ${'text-white/80'}`}
              >
                Naszą ambicją jest globalny wpływ – chcemy demokratyzować rozwój
                kariery w świecie AI i ułatwiać dostęp do wiedzy, narzędzi oraz
                społeczności niezależnie od miejsca zamieszkania. W erze
                globalizacji wierzymy, że mądrze dobrane treści, praktyczne
                ścieżki i otwarta społeczność mogą realnie poprawiać życie i
                możliwości zawodowe ludzi na całym świecie.
              </p>
            </div>

            <div className="mt-12 sm:mt-16">
              <CobeGlobe />
            </div>
          </div>
        </section>

        {/* 5. Team Section - adapted from mobile horizontal scroll to desktop grid */}
        <section
          className={`py-12 sm:py-16 lg:py-20 border-t ${'border-white/10'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Poznaj nas bliżej
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
              {teamMembers.map((member) => (
                <div key={member.name} className="text-center group">
                  <div className="relative mb-6">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-full mx-auto overflow-hidden bg-neutral-500/40 border border-white/20 ring-2 ring-white/30 shadow-2xl">
                      <OptimizedImage
                        src={member.image}
                        alt={member.name}
                        aspectRatio="square"
                        className="w-full h-full"
                        priority={true}
                        sizes="(max-width: 768px) 160px, (max-width: 1024px) 192px, 224px"
                      />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white">
                    {member.name}
                  </h3>
                  <p className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
                    {member.role}
                  </p>
                  {(member.linkedin || member.instagram) && (
                    <div className="mb-3 flex items-center justify-center gap-4">
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 hover:text-white transition-colors"
                          aria-label={`${member.name}'s LinkedIn profile`}
                        >
                          <LinkedInIcon size={20} />
                        </a>
                      )}
                      {member.instagram && (
                        <a
                          href={member.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 hover:text-white transition-colors"
                          aria-label={`${member.name}'s Instagram profile`}
                        >
                          <InstagramIcon size={20} />
                        </a>
                      )}
                    </div>
                  )}
                  <div className="mx-auto h-px w-12 bg-white/20 mb-4" />
                  <p className="text-base text-white/80 leading-7 max-w-md mx-auto">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup Section - Only displays on about page */}
        <section className="py-8 sm:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <MiniNewsletterSignup />
          </div>
        </section>
      </div>
    </>
  );
}
