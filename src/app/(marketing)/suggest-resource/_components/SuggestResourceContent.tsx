'use client';

import { PageStructuredData } from '@/components/seo/StructuredData';
import ResourceSuggestionForm from '@/components/resources/ResourceSuggestionForm';
import { MiniNewsletterSignup } from '@/components/newsletter/MiniNewsletterSignup';
import ClickSpark from '@/components/effects/ClickSpark';

export default function SuggestResourceContent() {
  return (
    <>
      <PageStructuredData
        pageType="suggest-resource"
        title="Suggest a Resource - Help Build the Ultimate AI Career Library | StrayLight"
        description="Share valuable AI career resources with our community."
        path="/suggest-resource"
      />

      <ClickSpark
        sparkColor={'#fff'}
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <div className={`min-h-screen relative ${'bg-black'}`}>
          <main className="relative z-10 pt-16">
            {/* Content Section */}
            <section className="px-6 pb-8">
              <div className="max-w-7xl mx-auto">
                {/* Form Section */}
                <div className="max-w-4xl mx-auto">
                  <ResourceSuggestionForm />
                </div>

                {/* Newsletter Signup Section - Only displays on suggest-resource page */}
                <section className="mt-16">
                  <MiniNewsletterSignup />
                </section>
              </div>
            </section>
          </main>
        </div>
      </ClickSpark>
    </>
  );
}
