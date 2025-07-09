import React, { useState, useEffect } from 'react';
import GooeyNav from './GooeyNav';

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);

  // Items dla GooeyNav
  const navItems = [
    { label: "Home", href: "#home" },
    { label: "Artykuły", href: "#artykuly" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const newScrolled = scrollPosition > 20;
      
      // Debug log
      console.log('Scroll position:', scrollPosition, 'Scrolled state:', newScrolled);
      
      setScrolled(newScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debug log dla stanu
  console.log('Current scrolled state:', scrolled);

  return (
    <nav 
      className={`
        fixed top-0 left-0 right-0 z-50 
        transition-all duration-700 ease-out
        ${scrolled 
          ? 'mt-2 mx-12' // Przy scroll: mniejszy odstęp od góry
          : 'mt-0 mx-2' // Bez scroll: bardziej przyklejone do krawędzi
        }
      `}
    >
      <div 
        className={`
          flex items-center justify-between 
          transition-all duration-700 ease-out
          ${scrolled 
            ? 'px-8 py-2 rounded-2xl shadow-2xl bg-black/60 backdrop-blur-md border border-gray-500/30' // Przy scroll: z tłem i obramowaniem
            : 'px-4 py-1 bg-transparent border border-transparent'   // Bez scroll: przezroczyste
          }
        `}
      >
        {/* Lewa strona - Logo i tytuł */}
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <img 
            src="/logo transparent.png" 
            alt="Straylight Logo" 
            className="w-12 h-12 object-contain transition-all duration-700 ease-out"
          />
          <span className={`
            text-lg font-medium transition-all duration-700 ease-out
            ${scrolled 
              ? 'text-white' 
              : 'text-white'
            }
          `}>
            Straylight
          </span>
        </div>

        {/* Prawa strona - GitHub link i GooeyNav */}
        <div className="flex items-center space-x-4">
          {/* Licznik artykułów */}
          <a 
            href="#artykuly" 
            className={`
              flex items-center space-x-2 transition-all duration-700 ease-out
              ${scrolled 
                ? 'text-white/80 hover:text-white' 
                : 'text-white/80 hover:text-white'
              }
            `}
          >
            <svg className={`
              w-5 h-5 fill-current transition-all duration-700 ease-out
            `} 
            viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v2H6V6zm0 4h8v2H6v-2z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              3
            </span>
          </a>

          {/* GooeyNav z przyciskami */}
          <GooeyNav
            items={navItems}
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
    </nav>
  );
};

export default Navigation; 