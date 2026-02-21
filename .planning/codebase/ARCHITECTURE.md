# Architecture

**Analysis Date:** 2026-02-16

## Pattern Overview

**Overall:** Next.js 14 App Router with Server-Side Rendering (SSR), React Server Components (RSC), and Client-Side Interactivity

**Key Characteristics:**

- Multi-layered security with middleware, context providers, and RLS policies
- Server components for initial rendering with client components for interactivity
- Separation of concerns: pages (UI), API routes (backend), lib (business logic), services (data layer)
- Real-time capabilities via Supabase subscriptions with performance optimization
- Provider-based architecture for cross-cutting concerns (auth, theme, notifications, toast)

## Layers

**Presentation Layer:**

- Purpose: Server and client-side rendering of UI components
- Location: `src/app/*/page.tsx`, `src/components/`
- Contains: Page components, UI components, client-side interactivity
- Depends on: Contexts (AuthContext, ThemeContext), hooks, lib utilities
- Used by: End users via browser

**API Layer:**

- Purpose: RESTful endpoints for data operations and server-side business logic
- Location: `src/app/api/*/route.ts`
- Contains: HTTP handlers (GET, POST, PUT, DELETE), validation, error handling
- Depends on: lib/services (data access), lib/validation (Zod schemas), lib/errors (error handling)
- Used by: Client components via fetch, external webhooks

**Business Logic Layer:**

- Purpose: Reusable business logic, utilities, and transformations
- Location: `src/lib/`
- Contains: Markdown processing (`markdown.ts`), article status logic (`article-status.ts`), affiliate link injection (`affiliate.ts`), session management (`session-manager.ts`)
- Depends on: Supabase client, type definitions
- Used by: API routes, server components, client components

**Service Layer:**

- Purpose: Data access abstraction and complex query operations
- Location: `src/lib/services/`
- Contains: `search-service.ts`, `ranking-service.ts`, `notification-service.ts`, `vote-service.ts`, `admin-articles.ts`
- Depends on: Supabase admin client, cache layer
- Used by: API routes, server components

**Data Access Layer:**

- Purpose: Direct database operations with Row-Level Security
- Location: `src/lib/supabase.ts` (client factory), `supabase/migrations/*.sql` (schema)
- Contains: Supabase client initialization, admin client factory, type definitions
- Depends on: PostgreSQL database, RLS policies
- Used by: Service layer, API routes, server components

**Cache Layer:**

- Purpose: Query result caching and invalidation
- Location: `src/lib/cache/query-cache.ts`
- Contains: In-memory cache with TTL, tag-based invalidation
- Depends on: Nothing (standalone)
- Used by: API routes, service layer

**Middleware Layer:**

- Purpose: Request interception for authentication and authorization
- Location: `middleware.ts`, `src/lib/auth/middleware-utils.ts`
- Contains: Route protection logic, role verification, session validation
- Depends on: Cookie parsing, route configuration
- Used by: Next.js request pipeline (runs before all routes)

## Data Flow

**Article Publication Flow:**

1. User submits article via `src/app/write/page.tsx` (client component)
2. Client validates with `useArticleValidation` hook
3. Request sent to `POST /api/articles` route
4. API route validates with Zod schema (`lib/validation/articles`)
5. Service layer (`lib/services/admin-articles.ts`) processes and inserts to database
6. RLS policies in Supabase enforce author ownership
7. Cache invalidated via `queryCache.invalidateByTag(CacheTags.ARTICLES)`
8. Admin notified via `lib/services/notification-service.ts`
9. Response returned to client with article ID

**Authentication Flow:**

1. User signs in via `src/app/auth/signin/page.tsx`
2. Supabase Auth handles OAuth/email+password
3. `middleware.ts` intercepts request, validates session cookie
4. `AuthContext.tsx` provides client-side auth state
5. `ProtectedRoute` component enforces component-level access control
6. Database trigger creates user profile in `users` table
7. User role stored in profile, enforced by middleware and RLS

**Search Flow:**

1. User types query in search component
2. Debounced hook (`useDebounce`) delays API calls
3. Request to `/api/search` with query params
4. `search-service.ts` executes optimized full-text search
5. Results cached by `query-cache` with 5-minute TTL
6. Analytics tracked via `search-analytics.ts`
7. Results rendered with skeleton states during loading

**State Management:**

- Server state: Fetched in server components, passed as props
- Client state: React hooks (useState, useReducer) in client components
- Global state: Context providers (AuthContext, ThemeContext, NotificationContext, ToastContext)
- URL state: Next.js searchParams and router for filters/pagination
- Cache state: In-memory cache (`query-cache.ts`) for API responses

## Key Abstractions

**ProtectedRoute:**

- Purpose: Component-level access control wrapper
- Examples: `src/components/auth/ProtectedRoute.tsx`
- Pattern: Higher-order component that checks auth state and roles before rendering children

**AppProviders:**

- Purpose: Centralized provider composition to reduce nesting
- Examples: `src/components/providers/AppProviders.tsx`
- Pattern: Single component wrapping all context providers in correct order

**API Handler Wrapper:**

- Purpose: Standardized error handling and response formatting
- Examples: `lib/api/error-handling.ts` (`apiHandler`, `withErrorHandling`)
- Pattern: Higher-order function wrapping route handlers with try-catch and logging

**Service Pattern:**

- Purpose: Encapsulate complex database queries and business logic
- Examples: `lib/services/search-service.ts`, `lib/services/ranking-service.ts`
- Pattern: Exported functions that accept parameters and return typed data

**Cache Abstraction:**

- Purpose: Transparent query result caching with automatic invalidation
- Examples: `lib/cache/query-cache.ts` (`queryCache.get()`, `invalidateByTag()`)
- Pattern: Key-value store with TTL and tag-based batch invalidation

## Entry Points

**Root Layout:**

- Location: `src/app/layout.tsx`
- Triggers: All page requests
- Responsibilities: Renders HTML shell, injects global providers, includes navigation/footer, loads fonts, initializes analytics

**Root Page (Landing):**

- Location: `src/app/page.tsx`
- Triggers: GET request to `/`
- Responsibilities: Renders landing page for unauthenticated users, redirects authenticated users to `/home` via middleware

**Authenticated Home:**

- Location: `src/app/home/page.tsx`
- Triggers: GET request to `/home` (requires authentication)
- Responsibilities: Renders personalized dashboard for authenticated users

**Middleware:**

- Location: `middleware.ts`
- Triggers: All requests except static assets and API auth routes
- Responsibilities: Session validation, role checking, route protection, redirects

**API Routes:**

- Location: `src/app/api/*/route.ts`
- Triggers: HTTP requests from client components or external services
- Responsibilities: Data CRUD operations, validation, business logic execution, webhook handling

**Database Triggers:**

- Location: `supabase/migrations/*_triggers.sql`
- Triggers: Database events (INSERT, UPDATE, DELETE)
- Responsibilities: Automatic timestamp updates, vote count synchronization, user profile creation

## Error Handling

**Strategy:** Multi-layered error boundaries with graceful degradation

**Patterns:**

- API routes: `try-catch` with `handleAPIError()` standardized response
- Client components: React Error Boundaries (`ChunkErrorBoundary`, `ErrorBoundary`)
- Server components: Error.tsx files in app directory for route-level error UI
- Database: RLS policy violations return 403, caught and formatted by API handlers
- Network: Retry logic in `useRetry` hook, offline detection in ServiceWorker
- Validation: Zod schema validation with detailed error messages
- Form submission: `useErrorRecovery` hook for draft recovery after failures

## Cross-Cutting Concerns

**Logging:**

- Console logging in development (`process.env.NODE_ENV === 'development'`)
- Structured logging in API routes with request IDs
- Performance monitoring via `lib/performance-monitor.ts`
- Error tracking prepared for integration (sentry placeholder)

**Validation:**

- Zod schemas in `lib/validation/*`
- Server-side validation in API routes before database operations
- Client-side validation in forms via hooks (`useArticleValidation`)
- Input sanitization for markdown content via `lib/markdown.ts`

**Authentication:**

- Supabase Auth with PKCE flow
- Middleware-level session validation from cookies
- Context provider for client-side auth state (`AuthContext.tsx`)
- Component-level protection via `ProtectedRoute`
- RLS policies enforce database-level access control

**Authorization:**

- Role-based access control (admin, moderator, member)
- Route-level role checking in `middleware.ts` via `getRequiredRoles()`
- API-level role verification in protected endpoints
- Database-level enforcement via RLS policies using `auth.uid()` and `auth.role()`

**Caching:**

- In-memory query cache (`query-cache.ts`) with TTL
- Tag-based invalidation on mutations
- Next.js automatic static page caching for published articles
- CDN caching via Vercel for static assets

**Performance Optimization:**

- Lazy loading of heavy components (Orb, StickyScroll, ContainerScroll)
- Code splitting via dynamic imports
- Image optimization via Next.js Image component
- Font optimization with `next/font` and subsetting
- Database query optimization with indexed columns
- Resource preloading via `ResourcePreloadProvider`

**SEO:**

- Server-side metadata generation via `generateMetadata()`
- Structured data via JSON-LD (`StructuredData` components)
- Dynamic sitemap generation (`src/app/sitemap.ts`)
- OpenGraph and Twitter Card meta tags
- Canonical URLs and schema markup

**Real-time Updates:**

- Supabase Realtime subscriptions for notifications
- Event throttling (2 events/second) for performance
- `useRealtimeDashboard` hook for admin analytics
- Real-time disabled for admin client to save resources

---

_Architecture analysis: 2026-02-16_
