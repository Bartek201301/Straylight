'use client';

import Link from 'next/link';
export default function ResourceSuggestionCTA() {
  return (
    <div
      className={`backdrop-blur-sm border rounded-2xl p-8 text-center ${'bg-white/5 border-white/10'}`}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <svg
            className="w-10 h-10 mx-auto text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7zM9 21a1 1 0 001 1h4a1 1 0 001-1v-1H9v1z" />
          </svg>
        </div>
        <h3 className={`text-2xl font-bold mb-3 font-inter ${'text-white'}`}>
          Znasz Świetne Narzędzie?
        </h3>
        <p className={`mb-6 font-source leading-relaxed ${'text-white/70'}`}>
          Pomóż nam zbudować najlepszą bibliotekę kariery AI! Dziel się
          książkami, narzędziami, kursami lub innymi narzędziami, które pomogły
          Ci rozwijać się zawodowo. Twoje sugestie pomagają tysiącom
          profesjonalistów odkrywać wartościowe treści.
        </p>
        <div className="flex justify-center">
          <Link
            href="/suggest-resource"
            className={`px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 font-medium font-source inline-flex items-center gap-2 ${'bg-white text-black hover:bg-white/90'}`}
          >
            <span>Zaproponuj Narzędzie</span>
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
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
