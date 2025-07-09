import React from 'react';
import Aurora from './Aurora';
import Navigation from './Navigation';
import GooeyNav from './GooeyNav';
import RotatingText from './RotatingText';

function App() {
  // Przycisk dla hero sekcji
  const heroButton = [
    { label: "Sprawdź nowy artykuł", href: "#nowy-artykul" }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Aurora
        colorStops={["#FFFFFF", "#F8F8FF", "#F0F0F0"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />
      <Navigation />
      {/* Główna zawartość z mniejszym paddingiem na górze */}
      <main className="relative z-10 pt-8">
        {/* Hero sekcja */}
        <section className="px-6 py-4">
          <div className="max-w-6xl mx-auto transform translate-x-12">
            <div className="grid md:grid-cols-2 gap-0 items-center">
              {/* Lewa strona - tekst i przycisk */}
              <div className="h-[500px] flex flex-col justify-center space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                  Poznaj dziedzinę{' '}
                  <RotatingText
                    texts={['sztucznej', 'cyfrowej', 'mobilnej', 'quantum']}
                    mainClassName="px-3 py-1 bg-white text-black overflow-hidden rounded-md inline-block min-w-[9ch] w-fit text-center"
                    staggerFrom="first"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={2200}
                  />{' '}
                  inteligencji
                </h1>
                <p className="text-xl text-white/80 leading-relaxed">
                  Dzielimy się najnowszymi trendami w programowaniu, designie i AI. 
                  Poznaj praktyczne rozwiązania, które pomogą Ci rozwijać swoje umiejętności 
                  i tworzyć innowacyjne projekty.
                </p>
                {/* Przycisk z animacją GooeyNav wyrównany do tekstu */}
                <div className="-ml-4">
                  <GooeyNav
                    items={heroButton}
                    particleCount={3}
                    particleDistances={[90, 10]}
                    particleR={100}
                    initialActiveIndex={0}
                    animationTime={600}
                    timeVariance={300}
                    colors={[1]}
                  />
                </div>
              </div>
              
              {/* Prawa strona - obrazek */}
              <div className="h-[500px] flex items-center justify-center md:justify-end">
                <img 
                  src="/obrazeknastrone.png" 
                  alt="AI Robot - StrayLight Blog" 
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          </div>
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
