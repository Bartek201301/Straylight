/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Dark mode only
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xxs: '320px',
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      mobile: {
        max: '639px',
      },
      tablet: {
        min: '640px',
        max: '1023px',
      },
      desktop: {
        min: '1024px',
      },
      portrait: {
        raw: '(orientation: portrait)',
      },
      landscape: {
        raw: '(orientation: landscape)',
      },
      hd: {
        min: '1920px',
      },
    },
    extend: {
      colors: {
        dark: {
          400: '#686875',
          500: '#4a4a57',
          600: '#2f2f38',
          700: '#232329',
          800: '#18181c',
          900: '#111114',
          950: '#0B0B0F',
        },
        neutral: {
          50: '#f4f4f7',
          100: '#e8e8ed',
          200: '#d9d9df',
          300: '#c2c2cd',
          400: '#a0a0af',
          500: '#70707c',
          600: '#525260',
          700: '#36363d',
          800: '#26262b',
          900: '#171719',
        },
        primary: {
          100: '#d3ebfc',
          200: '#aad5f9',
          300: '#82bef5',
          400: '#5aa7f2',
          500: '#3190ee',
          600: '#2579c8',
          700: '#1e62a3',
          800: '#174b7e',
          900: '#0f365c',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        accent: {
          100: '#ebdefe',
          200: '#d7c3fd',
          300: '#c4aafc',
          400: '#b191fb',
          500: '#9d78fa',
          600: '#8b63f5',
          700: '#7a50e4',
          800: '#6941c8',
          900: '#55369a',
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        success: {
          500: '#22c55e',
        },
        error: {
          500: '#ef4444',
        },
        warning: {
          500: '#eab308',
        },
        info: {
          500: '#3b82f6',
        },
        'ai-teal': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#32E0C4',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        'ai-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#845EF7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        sora: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        'ai-primary': ['var(--font-sora)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Consolas', 'Monaco', 'monospace'],
        dyslexic: ['OpenDyslexic', 'Comic Sans MS', 'system-ui', 'sans-serif'],
        // Legacy support
        standard: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              opacity: 0.75,
              fontWeight: '500',
              textDecoration: 'underline',
              '&:hover': {
                opacity: 1,
                color: 'var(--tw-prose-links)',
              },
            },
            b: {
              color: 'inherit',
            },
            strong: {
              color: 'inherit',
            },
            em: {
              color: 'inherit',
            },
            h1: {
              color: 'inherit',
            },
            h2: {
              color: 'inherit',
            },
            h3: {
              color: 'inherit',
            },
            h4: {
              color: 'inherit',
            },
            code: {
              color: 'inherit',
            },
          },
        },
      },
      fontSize: {
        '9xl': [
          '8rem',
          {
            lineHeight: '1',
          },
        ],
        '8xl': [
          '6rem',
          {
            lineHeight: '1',
          },
        ],
        '7xl': [
          '4.5rem',
          {
            lineHeight: '1',
          },
        ],
        '6xl': [
          '3.75rem',
          {
            lineHeight: '1',
          },
        ],
        '5xl': [
          '3rem',
          {
            lineHeight: '1.05',
          },
        ],
        '4xl': [
          '2.25rem',
          {
            lineHeight: '1.1',
          },
        ],
        '3xl': [
          '1.875rem',
          {
            lineHeight: '1.2',
          },
        ],
        '2xl': [
          '1.5rem',
          {
            lineHeight: '1.3',
          },
        ],
        xl: [
          '1.25rem',
          {
            lineHeight: '1.4',
          },
        ],
        lg: [
          '1.125rem',
          {
            lineHeight: '1.5',
          },
        ],
        base: [
          '1rem',
          {
            lineHeight: '1.6',
          },
        ],
        sm: [
          '0.875rem',
          {
            lineHeight: '1.6',
          },
        ],
        xs: [
          '0.75rem',
          {
            lineHeight: '1.5',
          },
        ],
        'fluid-2xl': [
          'clamp(1.5rem, 5vw, 3rem)',
          {
            lineHeight: '1.2',
          },
        ],
        'fluid-xl': [
          'clamp(1.25rem, 4vw, 2rem)',
          {
            lineHeight: '1.3',
          },
        ],
        'fluid-lg': [
          'clamp(1.125rem, 3vw, 1.5rem)',
          {
            lineHeight: '1.4',
          },
        ],
        'fluid-base': [
          'clamp(1rem, 2vw, 1.125rem)',
          {
            lineHeight: '1.5',
          },
        ],
        'fluid-sm': [
          'clamp(0.875rem, 1.5vw, 1rem)',
          {
            lineHeight: '1.5',
          },
        ],
      },
      boxShadow: {
        soft: 'rgba(0, 0, 0, 0.12) 0px 2px 8px 0px',
        medium: 'rgba(0, 0, 0, 0.16) 0px 4px 16px 0px',
        hard: 'rgba(0, 0, 0, 0.25) 0px 8px 25px 0px',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        focus: '0 0 0 3px rgba(66, 153, 225, 0.5)',
        'ai-glow': '0 0 20px rgba(50, 224, 196, 0.3)',
        'ai-glow-lg': '0 0 30px rgba(50, 224, 196, 0.4)',
        'ai-glow-purple': '0 0 20px rgba(132, 94, 247, 0.3)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        112: '28rem',
        128: '32rem',
        144: '36rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        content: '72rem',
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
      },
      minHeight: {
        'screen-without-nav': 'calc(100vh - 4rem)',
        'half-screen': '50vh',
        'quarter-screen': '25vh',
      },
      aspectRatio: {
        portrait: '9 / 16',
        landscape: '16 / 9',
        square: '1 / 1',
        widescreen: '21 / 9',
        ultrawide: '32 / 9',
        golden: '1.618 / 1',
      },
      zIndex: {
        1: '1',
        '-1': '-1',
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
        dyslexic: '0.075em',
      },
      gridTemplateColumns: {
        'auto-fill-xs': 'repeat(auto-fill, minmax(10rem, 1fr))',
        'auto-fill-sm': 'repeat(auto-fill, minmax(15rem, 1fr))',
        'auto-fill-md': 'repeat(auto-fill, minmax(20rem, 1fr))',
        'auto-fill-lg': 'repeat(auto-fill, minmax(25rem, 1fr))',
      },
      keyframes: {
        shimmer: {
          '0%': {
            'background-position': '-200% 0',
          },
          '100%': {
            'background-position': '200% 0',
          },
        },
        wave: {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '50%': {
            transform: 'translateX(100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        glow: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
          },
        },
        'spin-slow': {
          from: {
            transform: 'rotate(0deg)',
          },
          to: {
            transform: 'rotate(360deg)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(50, 224, 196, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(50, 224, 196, 0.5)',
          },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        wave: 'wave 1.6s linear infinite',
        glow: 'glow 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        float: 'float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'cell-ripple': 'cell-ripple 200ms ease-out forwards',
        'webkit-cell-ripple':
          'cell-ripple 200ms cubic-bezier(0, 0, 0.2, 1) forwards',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'webkit-ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'webkit-ease-in-out': 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      backgroundImage: {
        'ai-gradient': 'linear-gradient(90deg, #32E0C4 0%, #845EF7 100%)',
        'ai-radial':
          'radial-gradient(at 50% 0, rgba(50,224,196,0.15) 0%, rgba(11,11,15,0) 80%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('tailwindcss-animate')],
};
