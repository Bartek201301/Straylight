# Codebase Structure

**Analysis Date:** 2026-02-16

## Directory Layout

```
StrayLight/
├── .claude/                    # Claude Code configuration
├── .husky/                     # Git hooks (pre-commit, pre-push)
├── .planning/                  # Project planning and documentation
│   └── codebase/              # Codebase analysis documents
├── docs/                       # Additional documentation
├── public/                     # Static assets
│   ├── gallery/               # Feature screenshots and images
│   ├── optimized/             # Optimized image variants
│   └── *.{png,jpg,svg}        # Favicons, OG images, other static files
├── scripts/                    # Build and maintenance scripts
├── src/                        # Application source code
│   ├── app/                   # Next.js 14 App Router (pages + API routes)
│   ├── components/            # React components
│   ├── contexts/              # React context providers
│   ├── fonts/                 # Custom font files
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Business logic, utilities, types
├── supabase/                   # Database migrations and configuration
│   └── migrations/            # SQL migration files (numbered)
├── middleware.ts               # Next.js middleware (auth, routing)
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Directory Purposes

**src/app/**

- Purpose: Next.js App Router pages and API endpoints
- Contains: Page components (page.tsx), layouts (layout.tsx), API routes (route.ts), error boundaries (error.tsx)
- Key files:
  - `layout.tsx`: Root layout with providers and global UI
  - `page.tsx`: Landing page for unauthenticated users
  - `globals.css`: Global styles and Tailwind directives
  - `api/*/route.ts`: RESTful API handlers

**src/app/api/**

- Purpose: Backend API routes organized by resource
- Contains: HTTP route handlers with RESTful structure
- Key subdirectories:
  - `admin/`: Admin-only endpoints (analytics, management, approvals)
  - `articles/`: Article CRUD and related operations
  - `affiliate-library/`: Library item management and click tracking
  - `auth/`: Authentication endpoints (password reset, forgot password)
  - `newsletter/`: Newsletter subscription and webhook handlers
  - `search/`: Search endpoints with autocomplete and analytics
  - `profile/`: User profile operations
  - `quiz/`: Quiz recommendations endpoint

**src/components/**

- Purpose: Reusable React components organized by feature/type
- Contains: UI components, feature-specific components, layout components
- Key subdirectories:
  - `admin/`: Admin dashboard components (`PendingArticlesList.tsx`)
  - `articles/`: Article display and editing components
  - `auth/`: Authentication UI (`ConditionalNavigation.tsx`)
  - `chat/`: Chatbot components (`ConditionalFloatingChat.tsx`)
  - `editor/`: TipTap editor components (`ArticleEditor.tsx`)
  - `effects/`: Visual effects (Orb, animations)
  - `errors/`: Error boundaries (`ChunkErrorBoundary.tsx`)
  - `home/`: Landing page sections
  - `layout/`: Navigation, footer, conditional rendering
  - `newsletter/`: Newsletter signup forms
  - `notifications/`: Notification UI and toast container
  - `providers/`: Provider components (`AppProviders.tsx`)
  - `seo/`: SEO components (`StructuredData.tsx`)
  - `ui/`: Base UI components (buttons, skeletons, icons, feedback)

**src/contexts/**

- Purpose: React context providers for global state
- Contains: Context definitions and provider components
- Key files:
  - `AuthContext.tsx`: User authentication state (22KB - comprehensive)
  - `NotificationContext.tsx`: Real-time notifications
  - `ThemeContext.tsx`: Dark mode theme management
  - `ToastContext.tsx`: Toast notification system

**src/hooks/**

- Purpose: Custom React hooks for reusable logic
- Contains: Stateful logic, side effects, data fetching
- Key files:
  - `useArticleValidation.ts`: Article form validation
  - `useAutosave.ts`: Auto-save functionality for drafts
  - `useDebounce.ts`: Debounced input handling
  - `useErrorRecovery.ts`: Error recovery with draft restoration
  - `useImageUpload.ts`: Image upload with progress
  - `useNotifications.ts`: Notification subscription and management
  - `useRealtimeDashboard.ts`: Real-time admin analytics
  - `useRetry.ts`: Retry logic for failed operations
  - `useTagManagement.ts`: Tag selection and validation

**src/lib/**

- Purpose: Business logic, utilities, and type definitions
- Contains: Pure functions, service classes, validation schemas, type definitions
- Key files:
  - `supabase.ts`: Database client configuration and types (27KB)
  - `markdown.ts`: Markdown processing and sanitization
  - `reading-time.ts`: Reading time calculation
  - `article-status.ts`: Article workflow logic
  - `affiliate.ts`: Affiliate link injection
  - `session-manager.ts`: Session utilities
  - `mailchimp.ts`: Newsletter integration (22KB)
  - `opengraph.ts`: OG image generation
  - `twitter-cards.ts`: Twitter Card generation
  - `structured-data.ts`: Schema.org JSON-LD

**src/lib/auth/**

- Purpose: Authentication and authorization utilities
- Contains: Middleware helpers, role verification, route protection
- Key files:
  - `middleware-utils.ts`: Route matching and protection config
  - `role-verification.ts`: Role-based access control logic
  - `api-middleware.ts`: API-specific auth middleware

**src/lib/services/**

- Purpose: Data access layer and complex query logic
- Contains: Service classes for database operations
- Key files:
  - `search-service.ts`: Full-text search with ranking (24KB)
  - `ranking-service.ts`: Content ranking algorithms (21KB)
  - `notification-service.ts`: Notification CRUD operations
  - `vote-service.ts`: Voting system logic
  - `admin-articles.ts`: Admin article management
  - `search-cache.ts`: Search result caching (17KB)
  - `search-performance.ts`: Search performance monitoring (15KB)

**src/lib/cache/**

- Purpose: Query result caching and invalidation
- Contains: Cache implementation with TTL and tagging
- Key files:
  - `query-cache.ts`: In-memory cache with tag-based invalidation

**src/lib/validation/**

- Purpose: Zod validation schemas for API requests
- Contains: Schema definitions for request/response validation
- Key files:
  - `articles.ts`: Article validation schemas
  - Other resource validation schemas

**src/lib/types/**

- Purpose: TypeScript type definitions
- Contains: Shared types and interfaces

**src/lib/errors/**

- Purpose: Error handling utilities
- Contains: Custom error classes and API error formatters
- Key files:
  - `api-errors.ts`: Standardized API error responses

**src/lib/api/**

- Purpose: API route utilities and middleware
- Contains: Request/response helpers, validation utilities
- Key files:
  - `error-handling.ts`: API error handling and response formatting
  - `index.ts`: Optimized API handler factory

**supabase/migrations/**

- Purpose: Database schema evolution
- Contains: Numbered SQL migration files
- Key files:
  - `001_create_users_table.sql`: Users table schema
  - `002_users_rls_policies.sql`: Row-level security for users
  - `003_users_auth_triggers.sql`: Auto-create profile on signup
  - `004_create_articles_table.sql`: Articles table with workflow
  - `005_articles_rls_policies.sql`: Article access control
  - `010_create_votes_table.sql`: Voting system
  - Additional migrations for library items, notifications, newsletter

**public/**

- Purpose: Static assets served directly
- Contains: Images, fonts, favicons, OG images
- Key subdirectories:
  - `gallery/features/`: Feature screenshots for landing page
  - `optimized/`: Performance-optimized image variants

**scripts/**

- Purpose: Build, development, and maintenance scripts
- Contains: Utility scripts for common tasks

## Key File Locations

**Entry Points:**

- `src/app/layout.tsx`: Root layout (global providers, navigation)
- `src/app/page.tsx`: Landing page
- `src/app/home/page.tsx`: Authenticated user home
- `middleware.ts`: Request interceptor for auth/routing

**Configuration:**

- `next.config.js`: Next.js build and runtime config
- `tailwind.config.js`: Design system configuration
- `tsconfig.json`: TypeScript compiler options
- `.eslintrc.json`: Linting rules
- `.prettierrc`: Code formatting rules
- `components.json`: shadcn/ui configuration

**Core Logic:**

- `src/lib/supabase.ts`: Database client and types
- `src/contexts/AuthContext.tsx`: Authentication state
- `src/lib/auth/middleware-utils.ts`: Route protection
- `src/lib/markdown.ts`: Content processing

**Testing:**

- Not detected (no test files found in initial scan)

## Naming Conventions

**Files:**

- React components: PascalCase with .tsx extension (`ArticleEditor.tsx`)
- Utility modules: kebab-case with .ts extension (`article-status.ts`)
- API routes: route.ts (Next.js convention)
- Pages: page.tsx (Next.js convention)
- Layouts: layout.tsx (Next.js convention)
- Hooks: camelCase with "use" prefix (`useDebounce.ts`)
- Types: kebab-case with .ts extension, often in dedicated types/ directory

**Directories:**

- Feature directories: kebab-case (`affiliate-library/`, `seo-tools/`)
- Component categories: lowercase (`admin/`, `auth/`, `ui/`)
- API routes: kebab-case matching REST resource names (`articles/`, `newsletter/`)
- Dynamic routes: square brackets (`[slug]/`, `[id]/`)

**Variables:**

- React components: PascalCase
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE (`ALLOWED_TAG_SLUGS`)
- Database tables: snake_case (following Supabase convention)

**CSS Classes:**

- Tailwind utilities: kebab-case (built-in)
- Custom classes: kebab-case (`card-base`, `ai-teal-500`)
- Component classes: BEM-like structure where needed

## Where to Add New Code

**New Feature:**

- Primary code:
  - Page: `src/app/[feature-name]/page.tsx`
  - Components: `src/components/[feature-name]/`
  - API routes: `src/app/api/[feature-name]/route.ts`
  - Business logic: `src/lib/[feature-name].ts` or `src/lib/services/[feature-name]-service.ts`
- Tests: Not configured (would go in `__tests__/` or co-located `*.test.tsx`)

**New Component/Module:**

- Implementation:
  - UI component: `src/components/ui/[ComponentName].tsx`
  - Feature component: `src/components/[feature]/[ComponentName].tsx`
  - Layout component: `src/components/layout/[ComponentName].tsx`

**Utilities:**

- Shared helpers: `src/lib/utils/[utility-name].ts` or `src/lib/[utility-name].ts`
- React hooks: `src/hooks/use[FeatureName].ts`
- Type definitions: `src/lib/types/[resource].ts`
- Validation schemas: `src/lib/validation/[resource].ts`

**API Endpoints:**

- REST resource: `src/app/api/[resource]/route.ts`
- Nested resource: `src/app/api/[resource]/[sub-resource]/route.ts`
- Dynamic route: `src/app/api/[resource]/[id]/route.ts`
- Action endpoint: `src/app/api/[resource]/[action]/route.ts` (e.g., `/approve`)

**Database Changes:**

- New migration: `supabase/migrations/[number]_[description].sql`
- Follow numbering sequence (check highest existing number + 1)
- Include table creation, RLS policies, and triggers in separate files

**Context Providers:**

- New context: `src/contexts/[Feature]Context.tsx`
- Register in: `src/components/providers/AppProviders.tsx`

**Styling:**

- Global styles: `src/app/globals.css`
- Component styles: Inline Tailwind classes (preferred)
- Theme configuration: `tailwind.config.js`

## Special Directories

**.planning/**

- Purpose: Project documentation and planning artifacts
- Generated: No (manually created)
- Committed: Yes

**.claude/**

- Purpose: Claude Code configuration
- Generated: Yes (by Claude)
- Committed: Yes

**.husky/**

- Purpose: Git hooks for code quality (pre-commit linting/formatting)
- Generated: Yes (by husky install)
- Committed: Yes

**.next/**

- Purpose: Next.js build output
- Generated: Yes (during build)
- Committed: No (in .gitignore)

**node_modules/**

- Purpose: Installed dependencies
- Generated: Yes (by npm install)
- Committed: No (in .gitignore)

**public/**

- Purpose: Static assets accessible at root URL
- Generated: No (manually added)
- Committed: Yes

**src/components/ui/skeletons/**

- Purpose: Loading state components
- Generated: No (manually created)
- Committed: Yes
- Contains: Skeleton screens for better perceived performance

**src/lib/cache/**

- Purpose: Runtime caching logic
- Generated: No (manually implemented)
- Committed: Yes
- Contains: In-memory cache (not persisted)

**supabase/.temp/**

- Purpose: Temporary Supabase CLI files (if exists)
- Generated: Yes (by Supabase CLI)
- Committed: No

---

_Structure analysis: 2026-02-16_
