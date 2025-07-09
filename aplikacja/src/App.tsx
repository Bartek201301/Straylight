import React from 'react';
import Aurora from './Aurora';
import Navigation from './Navigation';

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Aurora
        colorStops={["#FFFFFF", "#F8F8FF", "#F0F0F0"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />
      <Navigation />
      {/* Główna zawartość z większym paddingiem na górze dla lepszej widoczności nawigacji */}
      <main className="relative z-10 pt-40">
        {/* Hero sekcja */}
        <section className="px-6 py-20 text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            StrayLight Blog
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Odkryj najnowsze trendy w technologii, programowaniu i designie. 
            Dzielimy się wiedzą i inspiracjami dla developerów.
          </p>
          <button className="bg-white text-black px-8 py-4 rounded-lg font-medium hover:bg-white/90 transition-colors">
            Rozpocznij czytanie
          </button>
        </section>

        {/* Sekcja z artykułami */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-12 text-center">
              Najnowsze artykuły
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <article key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Artykuł numer {i}
                  </h3>
                  <p className="text-white/70 mb-4">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">5 min czytania</span>
                    <button className="text-white hover:text-white/80 transition-colors">
                      Czytaj więcej →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Dodatkowa sekcja dla większej wysokości strony */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-8">
              O nas
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              Jesteśmy zespołem pasjonatów technologii, którzy uwielbiają dzielić się wiedzą 
              i pomagać innym w rozwoju umiejętności programistycznych.
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              {['Frontend', 'Backend', 'Design'].map((category) => (
                <div key={category} className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    {category}
                  </h3>
                  <p className="text-white/70">
                    Ekspertyza w nowoczesnych technologiach i najlepszych praktykach.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-white/60">
              © 2024 StrayLight Blog. Wszystkie prawa zastrzeżone.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
