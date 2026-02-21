# Technology Stack

**Analysis Date:** 2026-02-16

## Languages

**Primary:**

- TypeScript 5.0 - All source files use strict mode for type safety across frontend and backend
- JavaScript (Node.js) - Server-side scripts and configuration files

**Secondary:**

- SQL - Database migrations and Supabase schema definitions in `supabase/migrations/`
- CSS - Tailwind CSS utility-first styling via `tailwind.config.js`

## Runtime

**Environment:**

- Node.js (Latest LTS) - Development and production runtime

**Package Manager:**

- npm (v8+) - All dependencies managed through `package.json`
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**

- Next.js 14.0.0 - App Router with App Directory structure (`src/app/`)
- React 18.0.0 - Component library and UI rendering

**Styling & UI:**

- Tailwind CSS 3.0.0 - Utility-first CSS framework with dark mode support
- Tailwind CSS Plugins:
  - @tailwindcss/typography - Prose styling for content
  - @tailwindcss/forms - Form element styling
  - @tailwindcss/aspect-ratio - Aspect ratio utilities
  - tailwindcss-animate - Animation utilities

**Content & Rich Text:**

- @tiptap/react 3.0.7 - Rich text editor component
- @tiptap/starter-kit 3.0.7 - TipTap default extensions
- @tiptap/extension-image 3.0.7 - Image support in editor
- remark 15.0.1 - Markdown processing engine
- remark-parse 11.0.0 - Markdown parser
- remark-html 16.0.1 - Markdown to HTML transformer
- remark-gfm 4.0.1 - GitHub Flavored Markdown support
- remark-frontmatter 5.0.0 - YAML frontmatter parsing
- remark-rehype 11.1.2 - Markdown to HTML AST conversion
- rehype-sanitize 6.0.0 - HTML sanitization for security
- rehype-highlight 7.0.2 - Syntax highlighting for code blocks
- rehype-stringify 10.0.1 - HTML AST to string conversion

**Animation & Visualization:**

- framer-motion 12.23.12 - Advanced animations and transitions
- motion 12.23.22 - Standalone motion library
- lottie-react 2.4.1 - Lottie animation support
- cobe 0.6.4 - 3D globe visualization
- ogl 1.0.11 - WebGL library for graphics

**Forms & Validation:**

- zod 4.0.5 - TypeScript-first schema validation

**Icons & UI Components:**

- lucide-react 0.540.0 - Icon library

**Design System:**

- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 - Conditional CSS class composition
- tailwind-merge 3.3.1 - Tailwind CSS class conflict resolution

## Testing & Build

**Dev Dependencies:**

- ESLint 8.0.0 - Code linting and quality
- eslint-config-next 14.0.0 - Next.js recommended ESLint rules
- Prettier 3.0.0 - Code formatting
- TypeScript 5.0.0 - Type checking compiler
- PostCSS 8.0.0 - CSS transformations via `postcss.config.js`
- Autoprefixer 10.0.0 - Browser vendor prefix automation
- Husky 8.0.0 - Git hooks for pre-commit actions
- lint-staged 15.0.0 - Run linters on staged files
- is-ci 4.1.0 - Detect CI environment

## Key Dependencies

**Critical:**

- @supabase/supabase-js 2.52.0 - PostgreSQL database client with real-time subscriptions
- @supabase/ssr 0.1.0 - Server-side rendering auth support for Supabase
- @mailchimp/mailchimp_marketing 3.0.80 - Newsletter email marketing API
- sharp 0.33.0 - Image optimization and processing (used in build scripts)
- glob 10.3.0 - File pattern matching for scripts
- ioredis 5.7.0 - Redis client for optional caching layer

**Analytics & Monitoring:**

- @vercel/analytics 1.5.0 - Vercel Web Analytics integration
- @vercel/speed-insights 1.2.0 - Vercel Speed Insights integration

**Types:**

- @types/node 20.0.0 - Node.js type definitions
- @types/react 18.0.0 - React type definitions
- @types/react-dom 18.0.0 - React DOM type definitions
- @types/mailchimp\_\_mailchimp_marketing 3.0.21 - Mailchimp SDK types
- @types/ioredis 4.28.10 - Redis client type definitions

## Configuration

**Environment:**

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Mailchimp: `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_LIST_ID`, `MAILCHIMP_WEBHOOK_SECRET`
- Analytics: `NEXT_PUBLIC_GA_ID` (Google Analytics)
- Site: `NEXT_PUBLIC_SITE_URL` (Deployment URL)
- Redis (optional): `REDIS_URL` for distributed rate limiting
- Affiliate tracking: `NEXT_PUBLIC_AMAZON_ASSOCIATE_ID`, `NEXT_PUBLIC_BARNES_NOBLE_AFFILIATE_ID`, `NEXT_PUBLIC_GUMROAD_AFFILIATE_ID`, `NEXT_PUBLIC_LEMONSQUEEZY_AFFILIATE_ID`, `NEXT_PUBLIC_PADDLE_AFFILIATE_ID`
- Rate limiting: `RATE_LIMIT_WHITELIST` for IP-based exclusions
- Development: `SIMULATE_API_ERRORS`, `SIMULATE_SLOW_API` for testing

**Build:**

- `next.config.js` - Next.js configuration with image optimization, caching headers, webpack chunking
- `tsconfig.json` - TypeScript compiler options with path aliases (`@/*` → `src/*`)
- `tailwind.config.js` - Tailwind CSS theme with dark mode, semantic colors, custom breakpoints
- `postcss.config.js` - PostCSS plugin configuration for Tailwind and Autoprefixer

## Platform Requirements

**Development:**

- Node.js 18+ required
- npm or yarn for package management
- Supabase account for database access
- Mailchimp account for newsletter functionality (optional for development)
- Redis server (optional, for production rate limiting)

**Production:**

- Vercel deployment platform (recommended for Next.js optimization)
- Supabase PostgreSQL database (mandatory)
- Mailchimp API credentials (mandatory)
- Redis instance (optional, falls back to in-memory rate limiting)
- CDN support for image optimization via Vercel or self-hosted

---

_Stack analysis: 2026-02-16_
