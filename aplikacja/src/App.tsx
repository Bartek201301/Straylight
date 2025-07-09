import React from 'react';
import Aurora from './Aurora';
import Navigation from './Navigation';
import GooeyNav from './GooeyNav';
import RotatingText from './RotatingText';
import GlareHover from './components/GlareHover';
import BlurText from './components/BlurText';
import StarBorder from './components/StarBorder';
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import ReactPlugin from '@stagewise-plugins/react';

function App() {
  // Przycisk dla hero sekcji
  const heroButton = [
    { label: "Sprawdź nowy artykuł", href: "#nowy-artykul" }
  ];

  const handleAnimationComplete = () => {
    console.log('Animation completed!');
  };

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
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight font-inter">
                  Poznaj dziedzinę{' '}
                  <RotatingText
                    texts={['sztucznej', 'cyfrowej', 'mobilnej', 'quantum']}
                    mainClassName="px-3 pt-1 pb-4 mt-4 bg-white text-black rounded-md inline-block min-w-[9ch] w-fit text-center"
                    staggerFrom="first"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-200%", opacity: 0 }}
                    staggerDuration={0.025}
                    splitLevelClassName=""
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={2200}
                  />{' '}
                  inteligencji
                </h1>
                <p className="text-xl text-white/80 leading-relaxed font-source">
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
              
              {/* Prawa strona - filmik */}
              <div className="h-[500px] flex items-center justify-center md:justify-end">
                <video 
                  src="/Film bez tytułu ‐ Wykonano za pomocą Clipchamp.mp4" 
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-auto object-contain"
                >
                  Twoja przeglądarka nie obsługuje odtwarzania wideo.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* Sekcja - Dlaczego jesteśmy wyjątkowi */}
        <section className="px-6 py-20 relative">
          {/* Background grid pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
              maskImage: 'radial-gradient(ellipse 700px 400px at center bottom, black 40%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 700px 400px at center bottom, black 40%, transparent 70%)'
            }}></div>
          </div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <BlurText
                text="Dlaczego StrayLight?"
                delay={150}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
                className="text-4xl md:text-5xl font-bold text-white mb-6 font-inter"
              />
              <p className="text-xl text-white/80 max-w-3xl mx-auto font-source">
                Tworzymy wyjątkowe doświadczenie czytelnicze łącząc pasję, rzetelność i nowoczesny design
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              {/* Karta 1 - Design */}
              <GlareHover
                glareColor="#ffffff"
                glareOpacity={0.3}
                glareAngle={-30}
                glareSize={300}
                transitionDuration={800}
                playOnce={false}
                width="100%"
                height="100%"
                background="rgba(255, 255, 255, 0.05)"
                borderRadius="12px"
                className="backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group relative p-8"
              >
                <div>
                  <div className="absolute top-6 right-6 opacity-50 group-hover:opacity-70 transition-opacity">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9m12 0v12a4 4 0 01-4 4H9" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 font-inter">
                    Przemyślany Design
                  </h3>
                  <p className="text-white/70 leading-relaxed font-source">
                    Każdy element naszej strony został zaprojektowany z myślą o komforcie czytania. 
                    Nowoczesny interfejs sprawia, że odkrywanie treści staje się przyjemnością.
                  </p>
                </div>
              </GlareHover>

              {/* Karta 2 - Rzetelność */}
              <GlareHover
                glareColor="#ffffff"
                glareOpacity={0.3}
                glareAngle={-30}
                glareSize={300}
                transitionDuration={800}
                playOnce={false}
                width="100%"
                height="100%"
                background="rgba(255, 255, 255, 0.05)"
                borderRadius="12px"
                className="backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group relative p-8"
              >
                <div>
                  <div className="absolute top-6 right-6 opacity-50 group-hover:opacity-70 transition-opacity">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 font-inter">
                    Oficjalne Źródła
                  </h3>
                  <p className="text-white/70 leading-relaxed font-source">
                    Bazujemy wyłącznie na sprawdzonych, oficjalnych źródłach. Każda informacja jest 
                    weryfikowana, aby dostarczyć Ci rzetelną wiedzę bez dezinformacji.
                  </p>
                </div>
              </GlareHover>

              {/* Karta 3 - Pasja */}
              <GlareHover
                glareColor="#ffffff"
                glareOpacity={0.3}
                glareAngle={-30}
                glareSize={300}
                transitionDuration={800}
                playOnce={false}
                width="100%"
                height="100%"
                background="rgba(255, 255, 255, 0.05)"
                borderRadius="12px"
                className="backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group relative p-8"
              >
                <div>
                  <div className="absolute top-6 right-6 opacity-50 group-hover:opacity-70 transition-opacity">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 font-inter">
                    Pisane z Pasją
                  </h3>
                  <p className="text-white/70 leading-relaxed font-source">
                    Nasze artykuły tworzą prawdziwi pasjonaci technologii i AI. Dzielimy się wiedzą 
                    z entuzjazmem i autentycznym zainteresowaniem tematami, które poruszamy.
                  </p>
                </div>
              </GlareHover>
            </div>
          </div>
        </section>

        {/* Sekcja najpopularniejszych artykułów */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <BlurText
                text="Najpopularniejsze Artykuły"
                delay={150}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
                className="text-4xl md:text-5xl font-bold text-white mb-6 font-inter"
              />
              <p className="text-xl text-white/80 max-w-3xl mx-auto font-source">
                Odkryj nasze najczęściej czytane treści o AI, technologii i ich wpływie na świat
              </p>
            </div>
            
            {/* Nowy grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Główny artykuł - duży blok po lewej */}
              <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 group cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden min-h-[500px] flex flex-col">
                {/* Obrazek na górze - pełny i wycentrowany */}
                <div className="mb-12 flex justify-center">
                  <div className="w-72 h-72 flex items-center justify-center">
                    <img 
                      src="/aiwobronnosci.png" 
                      alt="AI w obronności" 
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
                    />
                  </div>
                </div>
                
                {/* Treść artykułu */}
                <div className="flex-1 flex flex-col justify-end space-y-4">
                  <div className="space-y-4">
                    <div className="mb-4">
                      <span className="text-white/60 text-sm font-mono">Jan Kowalski • 3 dni temu</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight font-inter">
                      Jak AI zmienia przemysł obronny w 2024 roku
                    </h3>
                    <p className="text-white/80 text-lg leading-relaxed font-source">
                      Analiza najnowszych trendów w wykorzystaniu sztucznej inteligencji w sektorze obronnym. 
                      Odkryj, jak autonomiczne systemy rewolucjonizują bezpieczeństwo narodowe.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-white/70 text-xs font-mono">AI & Obronność</span>
                      <span className="text-white/50 text-xs font-mono">• 8 min czytania</span>
                    </div>
                    <svg className="w-5 h-5 text-white/50 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </article>

              {/* Artykuły po prawej */}
              <div className="space-y-8">
                {/* Górny prawy artykuł */}
                <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 group cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                  {/* Obrazek na górze - pełny i wycentrowany */}
                  <div className="mb-6 flex justify-center">
                    <div className="w-32 h-32 flex items-center justify-center">
                      <img 
                        src="/etycznedylematyaizmedycyna.png" 
                        alt="AI w medycynie" 
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
                      />
                    </div>
                  </div>
                  
                  {/* Treść artykułu */}
                  <div className="space-y-3">
                    <div className="mb-3">
                      <span className="text-white/60 text-sm font-mono">Anna Nowak • 5 dni temu</span>
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight font-inter">
                      Etyczne dylematy AI w medycynie
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed font-source">
                      Jak sztuczna inteligencja wpływa na decyzje medyczne i jakie są konsekwencje etyczne.
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="px-2 py-1 bg-white/10 rounded-full text-white/70 text-xs font-mono">Medycyna</span>
                      <span className="text-white/50 text-xs font-mono">5 min</span>
                    </div>
                  </div>
                </article>

                {/* Dolny prawy artykuł */}
                <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 group cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                  {/* Obrazek na górze - pełny i wycentrowany */}
                  <div className="mb-6 flex justify-center">
                    <div className="w-32 h-32 flex items-center justify-center">
                      <img 
                        src="/Quantum Computing.png" 
                        alt="Quantum Computing" 
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
                      />
                    </div>
                  </div>
                  
                  {/* Treść artykułu */}
                  <div className="space-y-3">
                    <div className="mb-3">
                      <span className="text-white/60 text-sm font-mono">Piotr Wiśniewski • 1 tydzień temu</span>
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight font-inter">
                      Quantum Computing: Przyszłość czy fantazja?
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed font-source">
                      Odkryj potencjał komputerów kwantowych i ich wpływ na cyberbezpieczeństwo.
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="px-2 py-1 bg-white/10 rounded-full text-white/70 text-xs font-mono">Quantum</span>
                      <span className="text-white/50 text-xs font-mono">12 min</span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter sekcja */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div 
              className="bg-white/5 backdrop-blur-sm border border-white/10 text-center relative overflow-hidden"
              style={{
                borderRadius: '9999px',
                padding: '80px 120px'
              }}
            >
              
                              <div className="relative z-10">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-inter">
                    Otrzymuj najnowsze aktualizacje
                  </h2>
                  <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-source">
                    Zapisz się do newslettera, aby być na bieżąco z najnowszymi innowacjami ze świata AI i technologii.
                  </p>
                
                {/* Newsletter form */}
                <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-6">
                  <div className="flex-1 relative">
                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      placeholder="Adres email"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none transition-all duration-200 text-white bg-white/10 placeholder-white/60 font-source"
                    />
                  </div>
                  <button className="px-8 py-4 bg-white hover:bg-white/90 text-black font-medium rounded-full transition-all duration-200 hover:scale-105 whitespace-nowrap border border-white hover:border-white/80 font-source">
                    Zapisz się
                  </button>
                </div>
                
                {/* Privacy info */}
                <p className="text-sm text-white/60 max-w-xl mx-auto leading-relaxed font-source">
                  Akceptuję regulamin Straylight i potwierdzam, że moje informacje będą wykorzystywane zgodnie z 
                  <a href="#" className="text-white hover:text-white/80 underline mx-1">Polityką Prywatności</a>
                  Straylight.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
            {/* Logo i nazwa */}
            <div className="flex flex-col items-center justify-center space-y-3 mb-6">
              <img 
                src="/logo transparent.png" 
                alt="Straylight Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="text-lg font-orbitron font-bold bg-gradient-to-r from-white via-gray-100 to-cyan-200 bg-clip-text text-transparent tracking-wider">
                STRAYLIGHT
              </span>
            </div>
            
            {/* Podstrony */}
            <div className="flex justify-center space-x-6 text-sm">
              <a href="#home" className="text-white/70 hover:text-white transition-colors font-source">Home</a>
              <a href="#artykuly" className="text-white/70 hover:text-white transition-colors font-source">Artykuły</a>
            </div>

            {/* Email */}
            <p className="text-white/70 text-sm">
              <a href="mailto:straylightcenter@gmail.com" className="hover:text-white transition-colors font-mono">
                straylightcenter@gmail.com
              </a>
            </p>

            {/* Copyright i linki */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-white/60">
              <span className="font-source">© 2025 StrayLight Blog. Wszystkie prawa zastrzeżone.</span>
              <div className="flex space-x-3">
                <a href="#polityka-prywatnosci" className="hover:text-white transition-colors font-source">Polityka Prywatności</a>
                <a href="#regulamin" className="hover:text-white transition-colors font-source">Regulamin</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
      <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
    </div>
  );
}

export default App;
