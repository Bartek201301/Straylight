import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from './Navigation';
import Aurora from './Aurora';
import ClickSpark from './components/ClickSpark';
import TextPressure from './TextPressure';

// Typy danych
interface Article {
  id: number;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  image: string;
  category: string;
  readTime: string;
  link: string;
}

// Dane artykułów
const articlesData: Article[] = [
  {
    id: 1,
    title: "Jak AI zmienia przemysł obronny w 2024 roku",
    author: "Jan Kowalski",
    date: "3 dni temu",
    excerpt: "Analiza najnowszych trendów w wykorzystaniu sztucznej inteligencji w sektorze obronnym.",
    image: "/sztucznainteligencja.jpg",
    category: "Sztuczna Inteligencja",
    readTime: "8 min",
    link: "/artykuly/anthropic-eksperyment"
  },
  {
    id: 2,
    title: "Etyczne dylematy AI w medycynie",
    author: "Anna Nowak",
    date: "5 dni temu",
    excerpt: "Jak sztuczna inteligencja wpływa na decyzje medyczne i jakie są konsekwencje etyczne.",
    image: "/medycynaai.png",
    category: "Artykuł ekspercki",
    readTime: "5 min",
    link: "/artykuly/etyka-ai"
  },
  {
    id: 3,
    title: "Quantum Computing: Przyszłość czy fantazja?",
    author: "Piotr Wiśniewski",
    date: "1 tydzień temu",
    excerpt: "Odkryj potencjał komputerów kwantowych i ich wpływ na cyberbezpieczeństwo.",
    image: "/quantiumcomputing.jpg",
    category: "Vibe coding",
    readTime: "12 min",
    link: "/artykuly/quantum"
  },
  {
    id: 4,
    title: "Automatyzacja procesów w przemyśle 4.0",
    author: "Maria Kowalczyk",
    date: "2 tygodnie temu",
    excerpt: "Jak robotyka i AI rewolucjonizują nowoczesne fabryki i procesy produkcyjne.",
    image: "/automatyzacjaprocesow.jpg",
    category: "Automatyzacja",
    readTime: "6 min",
    link: "/artykuly/automatyzacja"
  },
  {
    id: 5,
    title: "Polityka cyfrowa UE wobec AI",
    author: "Tomasz Nowacki",
    date: "3 tygodnie temu",
    excerpt: "Analiza najnowszych regulacji Unii Europejskiej dotyczących sztucznej inteligencji.",
    image: "/flagaeu.png",
    category: "Polityka",
    readTime: "10 min",
    link: "/artykuly/polityka-ai"
  }
];

const categories = [
  "Wszystkie",
  "Sztuczna Inteligencja", 
  "Artykuł ekspercki", 
  "Polityka", 
  "Automatyzacja", 
  "Vibe coding"
];

function Artykuly() {
  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [sortBy, setSortBy] = useState("date"); // "date" lub "alphabetical"
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 4;
  
  // Przewiń na górę po wejściu na stronę
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filtrowanie artykułów według kategorii
  const filteredArticles = selectedCategory === "Wszystkie" 
    ? articlesData 
    : articlesData.filter(article => article.category === selectedCategory);

  // Sortowanie artykułów
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === "alphabetical") {
      return a.title.localeCompare(b.title);
    }
    // Sortowanie po dacie (domyślnie)
    return a.id - b.id;
  });

  // Paginacja
  const totalPages = Math.ceil(sortedArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const currentArticles = sortedArticles.slice(startIndex, startIndex + articlesPerPage);

  return (
    <ClickSpark
      sparkColor='#fff'
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <div className="min-h-screen bg-black">
        <Aurora
          colorStops={["#FFFFFF", "#F8F8FF", "#F0F0F0"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
        <Navigation />
        
        {/* Główna zawartość */}
        <main className="relative z-10 pt-4">
          {/* Sekcja z nagłówkiem TextPressure */}
          <section className="px-6 py-20">
            <div className="max-w-7xl mx-auto">
              <div style={{position: 'relative', height: '300px', marginBottom: '80px'}}>
                <TextPressure
                  text="Artykuły"
                  flex={true}
                  alpha={false}
                  stroke={false}
                  width={true}
                  weight={true}
                  italic={true}
                  textColor="#ffffff"
                  strokeColor="#ff0000"
                  minFontSize={36}
                />
              </div>
            </div>
          </section>

          {/* Sekcja wszystkich artykułów */}
          <section className="px-6 py-0 mb-20">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-8">
                {/* Sidebar z kategoriami - lewa strona */}
                <div className="w-64 flex-shrink-0">
                  <div className="sticky top-8">
                    <h3 className="text-lg font-bold text-white mb-6 font-inter">Kategorie</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            setCurrentPage(1); // Reset na pierwszą stronę
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg font-mono text-sm transition-colors ${
                            selectedCategory === category
                              ? 'bg-white text-black'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Główna zawartość z artykułami - prawa strona */}
                <div className="flex-1">


                  {/* Grid artykułów */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {currentArticles.map((article) => (
                      <Link key={article.id} to={article.link}>
                        <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 relative h-[480px] flex flex-col">
                          {/* Obrazek - zajmuje około połowę karty */}
                          <div className="h-[240px] w-full overflow-hidden rounded-t-2xl">
                            {article.image.endsWith('.mp4') ? (
                              <video 
                                src={article.image}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                muted
                                loop
                                autoPlay
                              />
                            ) : (
                              <img 
                                src={article.image} 
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            )}
                          </div>
                          
                          {/* Treść - pozostała część karty */}
                          <div className="flex-1 flex flex-col p-6 space-y-3">
                            <div className="mb-2">
                              <span className="text-white/60 text-sm font-mono">{article.author} • {article.date}</span>
                            </div>
                            <h3 className="text-lg font-bold text-white leading-tight font-inter">
                              {article.title}
                            </h3>
                            <p className="text-white/80 text-sm leading-relaxed font-source flex-1">
                              {article.excerpt}
                            </p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-white/10 rounded-full text-white/70 text-xs font-mono">
                                  {article.category}
                                </span>
                                <span className="text-white/50 text-xs font-mono">• {article.readTime}</span>
                              </div>
                              <svg className="w-4 h-4 text-white/50 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>

                  {/* Paginacja */}
                  <div className="flex justify-start gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
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
                <Link to="/" className="text-white/70 hover:text-white transition-colors font-source">Home</Link>
                <Link to="/artykuly" className="text-white/70 hover:text-white transition-colors font-source">Artykuły</Link>
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
                  <button type="button" className="hover:text-white transition-colors font-source bg-transparent border-none cursor-pointer">Polityka Prywatności</button>
                  <button type="button" className="hover:text-white transition-colors font-source bg-transparent border-none cursor-pointer">Regulamin</button>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </ClickSpark>
  );
}

export default Artykuly; 