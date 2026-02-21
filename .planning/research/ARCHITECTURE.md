# Architecture Patterns - Next.js 14 App Router Refactoring

**Domain:** Next.js 14 App Router + Supabase brownfield refactor
**Researched:** 2026-02-16
**Confidence:** HIGH

## Recommended Architecture

### Next.js 14 App Router Structure (2026 Standard)

```
src/
├── app/                          # Next.js App Router (routes)
│   ├── (marketing)/             # Route group - marketing pages
│   │   ├── layout.tsx          # Marketing layout
│   │   ├── page.tsx            # Homepage
│   │   └── about/
│   │       └── page.tsx
│   ├── (dashboard)/            # Route group - authenticated area
│   │   ├── layout.tsx          # Dashboard layout
│   │   └── admin/
│   │       └── page.tsx
│   ├── api/                    # API routes
│   │   └── route.ts
│   ├── layout.tsx              # Root layout
│   ├── error.tsx               # Error boundary
│   ├── loading.tsx             # Loading state
│   └── not-found.tsx           # 404 page
├── components/                  # Shared components
│   ├── ui/                     # Base UI components
│   ├── features/               # Feature-specific components
│   └── layouts/                # Layout components
├── lib/                        # Business logic
│   ├── supabase/              # Supabase client & utilities
│   ├── auth/                  # Authentication logic
│   └── utils/                 # Shared utilities
├── hooks/                      # Custom React hooks
├── contexts/                   # React contexts
├── types/                      # TypeScript type definitions
└── styles/                     # Global styles
```

### Component Boundaries

| Component Layer                                 | Responsibility                     | Communicates With                       | Server/Client                         |
| ----------------------------------------------- | ---------------------------------- | --------------------------------------- | ------------------------------------- |
| **Page Components** (`app/*/page.tsx`)          | Route entry points, data fetching  | Fetch data, render layouts and features | Server by default                     |
| **Layout Components** (`app/*/layout.tsx`)      | Shared UI wrappers, metadata       | Wrap child pages, define structure      | Server by default                     |
| **Feature Components** (`components/features/`) | Domain-specific UI logic           | Use hooks, contexts, call lib functions | Client (usually)                      |
| **UI Components** (`components/ui/`)            | Reusable presentational components | Receive props, emit events              | Server-first, client when interactive |
| **Business Logic** (`lib/`)                     | Data access, API calls, utilities  | Called by components, pure functions    | Server-side only (admin client)       |
| **Contexts** (`contexts/`)                      | Global state management            | Wrap component tree, provide values     | Client only                           |
| **Hooks** (`hooks/`)                            | Reusable stateful logic            | Use contexts, call lib functions        | Client only                           |

### Data Flow

```
User Request
    ↓
App Router (Server Components by default)
    ↓
Page Component (fetch data server-side)
    ↓
Layout Component (wrap with common UI)
    ↓
Feature Components (client-side interactivity if needed)
    ↓
UI Components (presentational)
    ↓
Supabase Client (database queries)
    ↓
PostgreSQL Database (data storage)
```

**Key principles:**

- Server Components by default (no "use client" unless needed)
- Data fetching happens in Server Components (pages, layouts)
- Client Components only for interactivity (forms, modals, interactive UI)
- Business logic in `lib/`, not in components
- Supabase RLS enforces security at database level

## Patterns to Follow

### Pattern 1: Server-First Components

**What:** Default to Server Components, add "use client" only when needed.

**When:** All pages, layouts, and presentational components should be Server Components unless they require:

- useState, useEffect, or other React hooks
- Browser APIs (localStorage, window, etc.)
- Event handlers (onClick, onChange, etc.)
- Third-party libraries that require client-side execution

**Example:**

```typescript
// app/articles/page.tsx - Server Component (no "use client")
import { createServerClient } from '@/lib/supabase/server'

export default async function ArticlesPage() {
  const supabase = createServerClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')

  return <ArticleList articles={articles} />
}

// components/features/ArticleList.tsx - Server Component
export function ArticleList({ articles }: { articles: Article[] }) {
  return (
    <div>
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}

// components/features/ArticleCard.tsx - Client Component (has interactivity)
'use client'

export function ArticleCard({ article }: { article: Article }) {
  const [liked, setLiked] = useState(false)

  return (
    <div>
      <h2>{article.title}</h2>
      <button onClick={() => setLiked(!liked)}>
        {liked ? 'Unlike' : 'Like'}
      </button>
    </div>
  )
}
```

### Pattern 2: Route Groups for Organization

**What:** Use parentheses `(groupName)` to organize routes without affecting URLs.

**When:**

- Separating marketing vs authenticated areas
- Grouping admin vs user dashboards
- Organizing by feature domain

**Example:**

```
app/
├── (marketing)/
│   ├── layout.tsx              # Marketing layout (hero, CTA)
│   ├── page.tsx                # URL: /
│   ├── about/page.tsx          # URL: /about
│   └── pricing/page.tsx        # URL: /pricing
├── (dashboard)/
│   ├── layout.tsx              # Dashboard layout (sidebar, nav)
│   ├── profile/page.tsx        # URL: /profile
│   └── settings/page.tsx       # URL: /settings
└── (admin)/
    ├── layout.tsx              # Admin layout (admin nav)
    └── users/page.tsx          # URL: /users
```

**Benefits:**

- Different layouts without URL nesting
- Logical code organization
- Easier to enforce authentication per group

### Pattern 3: Colocation with Private Folders

**What:** Use underscore prefix `_folder` for components that shouldn't be routes.

**When:**

- Components used only within a specific route
- Route-specific utilities or helpers
- Test files for specific routes

**Example:**

```
app/
└── articles/
    ├── _components/           # Not a route
    │   ├── ArticleCard.tsx   # Only used in articles section
    │   └── ArticleFilter.tsx
    ├── _utils/               # Not a route
    │   └── formatDate.ts
    ├── page.tsx              # Route: /articles
    └── [slug]/
        └── page.tsx          # Route: /articles/[slug]
```

### Pattern 4: Import Path Aliasing

**What:** Use `@/` alias for absolute imports instead of relative `../../` paths.

**When:** Always. Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Example:**

```typescript
// ❌ Bad - Relative imports
import { Button } from '../../../components/ui/Button';
import { createClient } from '../../lib/supabase/client';

// ✅ Good - Absolute imports with @/ alias
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
```

### Pattern 5: Separation of Supabase Clients

**What:** Different Supabase clients for different contexts.

**When:**

- Server Components → `createServerClient()` (from `@supabase/ssr`)
- Client Components → `createBrowserClient()`
- Server Actions/API Routes → `createServerClient()`
- Admin operations (bypassing RLS) → `getSupabaseAdmin()`

**Example:**

```typescript
// lib/supabase/server.ts
import { createServerClient as createClient } from '@supabase/ssr';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
}

// lib/supabase/client.ts
('use client');
import { createBrowserClient } from '@supabase/ssr';

export function createBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/admin.ts (server-side only!)
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bypasses RLS
    { auth: { persistSession: false } }
  );
}
```

### Pattern 6: Context Boundaries

**What:** Contexts always require "use client" and should be at component tree boundaries.

**When:**

- Global state (auth, theme, toast notifications)
- Shared across many components
- Need client-side reactivity

**Example:**

```typescript
// contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// app/layout.tsx (Server Component)
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: "use client" at Top Level

**What:** Adding "use client" to page components or high in the component tree.

**Why bad:**

- Loses Server Component benefits (zero JavaScript sent to client)
- Increases bundle size unnecessarily
- Prevents server-side data fetching optimizations

**Instead:**

```typescript
// ❌ Bad - Entire page is client component
'use client'

export default function ArticlePage() {
  const [articles, setArticles] = useState([])

  useEffect(() => {
    fetch('/api/articles').then(r => r.json()).then(setArticles)
  }, [])

  return <ArticleList articles={articles} />
}

// ✅ Good - Server Component fetches, client component only for interactivity
export default async function ArticlePage() {
  const supabase = createServerClient()
  const { data: articles } = await supabase.from('articles').select('*')

  return <ArticleList articles={articles} /> // Server Component
}

// components/ArticleList.tsx - Add "use client" only where needed
export function ArticleList({ articles }) {
  return (
    <div>
      {articles.map(article => (
        <InteractiveCard key={article.id} article={article} />
      ))}
    </div>
  )
}

// components/InteractiveCard.tsx - Client Component
'use client'
export function InteractiveCard({ article }) {
  const [liked, setLiked] = useState(false)
  return <button onClick={() => setLiked(!liked)}>...</button>
}
```

### Anti-Pattern 2: Mixing Server/Client Imports

**What:** Importing server-only code in client components or vice versa.

**Why bad:**

- Breaks build (server code doesn't run in browser)
- Exposes secrets (server environment variables leaked to client)
- Type errors and runtime crashes

**Instead:**

Use `server-only` and `client-only` packages:

```typescript
// lib/supabase/admin.ts
import 'server-only'; // Throws error if imported in client component

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Secret key - server only!
  );
}

// components/ClientComponent.tsx
('use client');

// ❌ This will error at build time due to 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// ✅ Use client-safe function instead
import { createBrowserClient } from '@/lib/supabase/client';
```

### Anti-Pattern 3: Barrel Exports Without Tree-Shaking

**What:** Creating index.ts files that re-export everything.

**Why bad:**

- Prevents tree-shaking (unused exports included in bundle)
- Circular dependency risk
- Slower bundler performance

**Instead:**

```typescript
// ❌ Bad - Barrel export
// components/index.ts
export * from './Button';
export * from './Input';
export * from './Modal';
// ... 50 more exports

// Usage pulls in ALL components
import { Button } from '@/components';

// ✅ Good - Direct imports
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ✅ Acceptable - Selective barrel export (small, curated list)
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
// Only 5-10 core UI components
```

### Anti-Pattern 4: Parallel Route Misuse

**What:** Using parallel routes (@slot) for simple conditionals.

**Why bad:**

- Over-engineering simple layouts
- Harder to understand code flow
- More files than necessary

**Instead:**

```typescript
// ❌ Bad - Parallel routes for simple conditional
app/
├── @loggedIn/
│   └── page.tsx
├── @loggedOut/
│   └── page.tsx
└── layout.tsx

// ✅ Good - Simple conditional in layout
export default function Layout({ children }) {
  const user = await getUser()

  return (
    <div>
      {user ? <LoggedInNav /> : <LoggedOutNav />}
      {children}
    </div>
  )
}
```

**When to use parallel routes:** True parallel rendering (analytics dashboard with multiple independent panels, A/B testing different layouts).

### Anti-Pattern 5: Client-Side Data Fetching in App Router

**What:** Using useEffect + fetch in client components.

**Why bad:**

- Loses SSR benefits (content not in initial HTML)
- Slower perceived performance (loading spinner → content)
- SEO issues (crawlers may not see content)

**Instead:**

```typescript
// ❌ Bad - Client-side fetching
'use client'

export default function ArticlePage() {
  const [article, setArticle] = useState(null)

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then(r => r.json())
      .then(setArticle)
  }, [id])

  if (!article) return <Loading />
  return <Article data={article} />
}

// ✅ Good - Server-side fetching
export default async function ArticlePage({ params }) {
  const supabase = createServerClient()
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('id', params.id)
    .single()

  return <Article data={article} />
}
```

## Scalability Considerations

| Concern               | At 100 users                          | At 10K users                             | At 1M users                                                |
| --------------------- | ------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| **Authentication**    | Supabase Auth + RLS sufficient        | Add rate limiting, session management    | Consider dedicated auth service, Redis session store       |
| **Database queries**  | Direct Supabase queries in components | Add database indexes, query optimization | Connection pooling, read replicas, caching layer (Redis)   |
| **Bundle size**       | Basic code splitting by route         | Aggressive tree-shaking, dynamic imports | Micro-frontends, route-level lazy loading                  |
| **Static generation** | ISR for most pages (revalidate: 60)   | CDN caching, aggressive ISR              | Edge rendering, per-user caching strategies                |
| **API rate limiting** | Supabase free tier limits             | Implement API route rate limiting        | Dedicated API gateway, Redis rate limiter                  |
| **File uploads**      | Direct Supabase Storage uploads       | Presigned URLs, client-side compression  | CDN for assets, separate storage service (S3 + CloudFront) |

## Migration Strategy for Existing Codebase

### Phase 1: Folder Structure Alignment

**Goal:** Match Next.js 14 App Router conventions.

**Actions:**

1. Move `app/` contents to follow route group pattern
2. Create `_components/` folders for route-specific components
3. Move shared components to `components/ui/` and `components/features/`
4. Consolidate utilities into `lib/`

**Risk:** High (touches many files). Mitigate with incremental approach.

### Phase 2: Import Path Standardization

**Goal:** Replace relative imports with `@/` aliases.

**Actions:**

1. Verify `tsconfig.json` has `"@/*": ["./src/*"]` path mapping
2. Use find/replace to convert `../../` to `@/`
3. Run TypeScript compiler to catch errors
4. Test build

**Risk:** Low. Automated with regex. TypeScript catches errors.

### Phase 3: Server/Client Component Optimization

**Goal:** Move "use client" boundaries down the tree.

**Actions:**

1. Start from pages (remove "use client" if possible)
2. Push "use client" to leaf components (buttons, forms)
3. Verify data fetching moved to Server Components
4. Test interactivity still works

**Risk:** Medium. Requires understanding of component behavior.

### Phase 4: Supabase Client Separation

**Goal:** Use correct Supabase client for each context.

**Actions:**

1. Audit all Supabase client usage
2. Replace with `createServerClient()` in Server Components
3. Replace with `createBrowserClient()` in Client Components
4. Verify RLS policies work correctly

**Risk:** Medium. Test authentication flow thoroughly.

## Sources

**HIGH Confidence (Official Next.js documentation):**

- [Next.js App Router Documentation](https://nextjs.org/docs/app) - Official App Router patterns
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) - Folder conventions
- [Next.js Rendering Fundamentals](https://nextjs.org/docs/app/building-your-application/rendering) - Server vs Client Components
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching) - Server Component data fetching
- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) - Route group patterns

**HIGH Confidence (Official Supabase documentation):**

- [Supabase with Next.js App Router](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) - Official integration guide
- [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side-rendering) - SSR patterns

**MEDIUM Confidence (Community best practices):**

- [Next.js 16 App Router Project Structure Guide](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure) - Comprehensive structure guide
- [Inside the App Router: Best Practices](https://medium.com/better-dev-nextjs-react/inside-the-app-router-best-practices-for-next-js-file-and-directory-structure-2025-edition-ed6bc14a8da3) - 2025 patterns
- [Next.js App Router Best Practices](https://thiraphat-ps-dev.medium.com/mastering-next-js-app-router-best-practices-for-structuring-your-application-3f8cf0c76580) - Structure patterns
- [Server Components Refactoring](https://weberdominik.com/blog/server-components-refactoring) - Migration patterns

---

_Architecture research for: Next.js 14 App Router + Supabase Refactoring_
_Researched: 2026-02-16_
_Confidence: HIGH for Next.js patterns, MEDIUM for Supabase-specific optimizations_
