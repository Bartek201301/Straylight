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
          ? 'mt-3 mx-12' // Przy scroll: mniejszy odstęp od góry
          : 'mt-0 mx-2' // Bez scroll: bardziej przyklejone do krawędzi
        }
      `}
    >
      <div 
        className={`
          flex items-center justify-between 
          transition-all duration-700 ease-out
          ${scrolled 
            ? 'px-8 py-3 rounded-2xl shadow-2xl bg-black/60 backdrop-blur-md border border-gray-500/30' // Przy scroll: z tłem i obramowaniem
            : 'px-4 py-2 bg-transparent border border-transparent'   // Bez scroll: przezroczyste
          }
        `}
      >
        {/* Lewa strona - Logo i tytuł */}
        <div className="flex items-center space-x-4">
          {/* Logo - białe w obu stanach */}
          <div className={`
            w-7 h-7 rounded-lg flex items-center justify-center border
            transition-all duration-700 ease-out
            ${scrolled 
              ? 'bg-white border-white' 
              : 'bg-white border-white'
            }
          `}>
            <span className={`
              text-xs font-bold transition-all duration-700 ease-out
              ${scrolled 
                ? 'text-black' 
                : 'text-black'
              }
            `}>
              SL
            </span>
          </div>
          <span className={`
            text-base font-medium transition-all duration-700 ease-out
            ${scrolled 
              ? 'text-white' 
              : 'text-white'
            }
          `}>
            StrayLight Blog
          </span>
        </div>

        {/* Prawa strona - GitHub link i GooeyNav */}
        <div className="flex items-center space-x-4">
          {/* GitHub link - biały w obu stanach */}
          <a 
            href="https://github.com/your-repo" 
            className={`
              flex items-center space-x-2 transition-all duration-700 ease-out
              ${scrolled 
                ? 'text-white/80 hover:text-white' 
                : 'text-white/80 hover:text-white'
              }
            `}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className={`
              w-4 h-4 fill-current transition-all duration-700 ease-out
            `} 
            viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">
              ⭐ 1.2k
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