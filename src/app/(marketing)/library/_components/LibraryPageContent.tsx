'use client';

import React from 'react';
import AffiliateLibraryList from '@/components/affiliate/AffiliateLibraryList';
import { MiniNewsletterSignup } from '@/components/newsletter/MiniNewsletterSignup';
import ResourceSuggestionCTA from '@/components/resources/ResourceSuggestionCTA';
import ClickSpark from '@/components/effects/ClickSpark';

// Structured data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'StrayLight Library',
  description:
    'Curated collection of books and AI tools for career development',
  url: 'https://straylight.app/library',
  mainEntity: {
    '@type': 'ItemList',
    name: 'Books and AI Tools',
    description:
      'Carefully selected resources for professional growth and AI learning',
  },
  publisher: {
    '@type': 'Organization',
    name: 'StrayLight',
    url: 'https://straylight.app',
  },
};

export default function LibraryPageContent() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <ClickSpark
        sparkColor={'#fff'}
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <div className={`min-h-screen relative ${'bg-black'}`}>
          <main className="relative z-10 pt-4">
            {/* Title Section */}
            <section className="px-6 py-16 md:py-20">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                  <h1
                    className={`text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-bold tracking-wider uppercase font-sans mb-6 sm:mb-8 ${'text-white'}`}
                  >
                    BIBLIOTEKA
                  </h1>
                  <p
                    className={`text-base sm:text-lg md:text-xl max-w-4xl mx-auto font-source leading-relaxed ${'text-white/80'}`}
                  >
                    Odkryj starannie wyselekcjonowane książki i narzędzia AI,
                    które przyspieszą rozwój Twojej kariery. Każdy zasób jest
                    ręcznie wybrany ze względu na jakość, trafność i wpływ na
                    rozwój zawodowy.
                  </p>
                </div>
              </div>
            </section>

            {/* Content Section */}
            <section className="px-6 py-0 mb-20">
              <div className="max-w-7xl mx-auto">
                {/* Library List Component - Fully accessible to all users */}
                <AffiliateLibraryList
                  showFilters={true}
                  showMetadata={false}
                  itemsPerPage={12}
                  className="max-w-7xl mx-auto"
                />

                {/* Resource Suggestion CTA */}
                <section className="mt-16">
                  <ResourceSuggestionCTA />
                </section>
              </div>
            </section>

            {/* Newsletter Signup Section - Only displays on library page */}
            <section className="py-12">
              <div className="max-w-6xl mx-auto px-6">
                <MiniNewsletterSignup />
              </div>
            </section>
          </main>
        </div>
      </ClickSpark>
    </>
  );
}
