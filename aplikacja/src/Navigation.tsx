import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchInput from './components/SearchInput';

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

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
          : 'mt-1 mx-2' // Bez scroll: minimalny odstęp od góry
        }
      `}
    >
      <div 
        className={`
          flex items-center justify-between h-12
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
            className="w-20 h-20 object-contain transition-all duration-700 ease-out"
          />
          <span className={`
            text-xl font-orbitron font-bold transition-all duration-700 ease-out
            bg-gradient-to-r from-white via-gray-100 to-cyan-200 bg-clip-text text-transparent
            hover:from-cyan-200 hover:via-white hover:to-purple-200
            drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]
            hover:drop-shadow-[0_0_12px_rgba(100,255,255,0.6)]
            cursor-default
            ${scrolled 
              ? 'tracking-wide' 
              : 'tracking-wider'
            }
          `}>
            STRAYLIGHT
          </span>
        </div>

        {/* Prawa strona - Navigation links */}
        <div className="flex items-center space-x-4">
          {/* Komponent wyszukiwania (tylko na stronie artykułów) */}
          {location.pathname === '/artykuly' && <SearchInput />}
          
          {/* Licznik artykułów */}
          <Link 
            to="/artykuly" 
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
          </Link>

          {/* Navigation buttons */}
          <div className="flex items-center space-x-2">
            <Link 
              to="/" 
              className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg ${
                location.pathname === '/' 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/artykuly" 
              className={`px-4 py-2 font-medium transition-all duration-300 rounded-lg ${
                location.pathname === '/artykuly' 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Artykuły
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 