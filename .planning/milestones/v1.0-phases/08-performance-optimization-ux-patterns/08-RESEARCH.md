# Phase 8: Performance Optimization - UX Patterns - Research

**Researched:** 2026-02-19
**Domain:** Next.js App Router loading/error conventions, Suspense boundaries
**Confidence:** HIGH

## Summary

Phase 8 is a UI-wrapper-only phase that standardizes loading and error states across all route segments in a Next.js 14 App Router project. The codebase has 4 route groups -- `(marketing)`, `(auth)`, `(dashboard)`, `(admin)` -- spanning 38 page routes. Currently, only 1 `loading.tsx` exists (articles listing), only 1 `error.tsx` exists (root), no `global-error.tsx` exists, and 2 `not-found.tsx` files exist (root + article slug). Most pages manage their own loading states inline via spinners and AuthLoadingSpinner, which creates inconsistency. The majority of pages (25 of 38) are client components with `'use client'`.

The existing skeleton component library is strong: `BaseSkeleton` with multiple animation variants (pulse, shimmer, wave, glow), `DashboardSkeleton`, `ArticleCardSkeleton`, `ChatSkeleton`, `OrbSkeleton`, and `ScrollAnimationSkeleton`. The base primitives (`BaseSkeleton`, `TextLineSkeleton`, `CircleSkeleton`) are well-designed and should be reused. The `Skeleton.tsx` in `src/components/ui/` is a separate, simpler implementation using `gray-*` colors (violates design system) -- it should be avoided or replaced.

Key insight: since most pages are client components that do their own data fetching, `loading.tsx` files will primarily serve as instant loading states during route transitions (shown between navigation click and page hydration), not as Suspense fallbacks for server-side streaming. The two async server component pages (`articles/[slug]` and `profile/[handle]`) are the main candidates for Suspense-based streaming benefits. The constraint "UI wrappers only -- no data fetching changes" means we add the files and boundaries without modifying any existing page logic.

**Primary recommendation:** Add `loading.tsx` and `error.tsx` at each route-group level `(marketing)`, `(auth)`, `(dashboard)`, `(admin)` for blanket coverage, then add route-specific `loading.tsx` files for high-traffic routes that benefit from tailored skeleton screens. Add a `global-error.tsx` at the app root. Reuse existing skeleton components from `src/components/ui/skeletons/` as the skeleton foundation.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Skeleton screens (not spinners or shimmer effects) for loading states
- Error states use standard dark mode colors (neutral-\*, card-base) -- same pattern as rest of site, no special warning accents
- **UI wrappers only** -- do NOT modify data fetching logic. Add loading.tsx, error.tsx, and Suspense wrappers only. Zero functional regression is the core value.

### Claude's Discretion

- Route-specific vs generic skeleton design: based on route complexity
- Reuse existing skeleton components or create fresh: based on current codebase quality
- Loading visibility timing: whichever approach works best
- Error message style: based on existing error components
- Error boundary placement granularity: based on route risk assessment
- 404 page: evaluate current not-found.tsx, improve only if needed
- Which routes get loading.tsx/error.tsx: based on which routes benefit most
- Handling existing loading/error files: evaluate existing files, keep good ones, replace inconsistent ones
- Admin section polish level: based on admin route complexity
- Page-level vs section-level Suspense: per-route based on data fetch patterns
- Retrofitting Suspense to existing components: based on impact vs effort

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                   | Research Support                                                                                                                                    |
| ------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| PERF-05 | Add proper loading.tsx and error.tsx files for route segments | Full route inventory completed (38 pages across 4 groups). Existing skeleton components catalogued. Next.js file conventions verified via Context7. |

</phase_requirements>

## Standard Stack

### Core

No new libraries needed. This phase uses built-in Next.js App Router file conventions and existing project components.

| Library/Feature        | Version | Purpose                                    | Why Standard                                                          |
| ---------------------- | ------- | ------------------------------------------ | --------------------------------------------------------------------- |
| Next.js `loading.tsx`  | 14.x    | Instant loading states for route segments  | Built-in App Router convention; auto-wraps page in Suspense boundary  |
| Next.js `error.tsx`    | 14.x    | Error boundaries for route segments        | Built-in App Router convention; catches uncaught errors in child tree |
| Next.js `global-error` | 14.x    | Root-level error boundary (catches layout) | Catches errors in root layout that `error.tsx` cannot                 |
| React `Suspense`       | 18.x    | Streaming boundaries for async components  | Standard React pattern for concurrent rendering                       |
| Existing skeletons     | N/A     | `BaseSkeleton`, `DashboardSkeleton`, etc.  | Already built, well-designed, follows design system                   |

### Supporting

| Component             | Location                                       | Purpose                           | When to Use                           |
| --------------------- | ---------------------------------------------- | --------------------------------- | ------------------------------------- |
| `BaseSkeleton`        | `src/components/ui/skeletons/BaseSkeleton.tsx` | Primitive skeleton building block | Building new route-specific skeletons |
| `TextLineSkeleton`    | Same file (named export)                       | Text placeholder lines            | Content-heavy loading states          |
| `CircleSkeleton`      | Same file (named export)                       | Avatar/icon placeholders          | Profile, author sections              |
| `DashboardSkeleton`   | `src/components/ui/skeletons/`                 | Full dashboard loading state      | Admin/dashboard route loading         |
| `ArticleCardSkeleton` | `src/components/articles/`                     | Article card placeholder          | Article listing loading states        |
| `Container`           | `src/components/layout/Container.tsx`          | Layout wrapper                    | Wrapping loading/error states         |

### Alternatives Considered

| Instead of         | Could Use             | Tradeoff                                                                   |
| ------------------ | --------------------- | -------------------------------------------------------------------------- |
| `BaseSkeleton`     | `Skeleton` (ui/)      | `Skeleton.tsx` uses `gray-*` colors violating design system; avoid it      |
| Route-group error  | Per-page error.tsx    | More granular but more files; route-group level is sufficient for most     |
| `global-error.tsx` | Root `error.tsx` only | Root error.tsx cannot catch root layout errors; global-error.tsx is needed |

**Installation:**

```bash
# No installation needed -- all built-in features and existing components
```

## Architecture Patterns

### Recommended File Structure

```
src/app/
├── error.tsx                              # EXISTS - root error boundary (KEEP)
├── not-found.tsx                          # EXISTS - root 404 (KEEP)
├── global-error.tsx                       # NEW - catches root layout errors
├── (marketing)/
│   ├── loading.tsx                        # NEW - generic marketing skeleton
│   ├── error.tsx                          # NEW - marketing error boundary
│   ├── articles/
│   │   ├── loading.tsx                    # EXISTS (KEEP - good quality)
│   │   └── [slug]/
│   │       ├── loading.tsx               # NEW - article detail skeleton
│   │       └── not-found.tsx             # EXISTS (KEEP)
│   ├── library/
│   │   └── loading.tsx                   # NEW - library grid skeleton
│   ├── profile/[handle]/
│   │   └── loading.tsx                   # NEW - profile skeleton
│   └── quiz/
│       └── loading.tsx                   # NEW - quiz skeleton
├── (auth)/
│   ├── loading.tsx                        # NEW - auth form skeleton
│   └── error.tsx                          # NEW - auth error boundary
├── (dashboard)/
│   ├── loading.tsx                        # NEW - dashboard skeleton
│   ├── error.tsx                          # NEW - dashboard error boundary
│   ├── write/
│   │   └── loading.tsx                   # NEW - editor skeleton
│   └── home/
│       └── loading.tsx                   # NEW - home feed skeleton
├── (admin)/
│   ├── admin/
│   │   ├── loading.tsx                   # NEW - admin skeleton
│   │   └── error.tsx                     # NEW - admin error boundary
```

### Pattern 1: Route-Group Level Loading (Generic Skeleton)

**What:** A generic skeleton at the route-group level serves as a fallback for any sub-route that does not have its own loading.tsx.
**When to use:** At `(marketing)/`, `(auth)/`, `(dashboard)/`, `(admin)/admin/` levels.
**Example:**

```typescript
// Source: Next.js App Router conventions (Context7 /vercel/next.js)
// src/app/(marketing)/loading.tsx
import Container from '@/components/layout/Container';
import BaseSkeleton, { TextLineSkeleton } from '@/components/ui/skeletons/BaseSkeleton';

export default function MarketingLoading() {
  return (
    <Container>
      <div className="py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <BaseSkeleton className="h-10 w-64" variant="pulse" rounded="lg" />
          <TextLineSkeleton lines={3} variant="pulse" />
          <BaseSkeleton className="h-64 w-full" variant="pulse" rounded="lg" />
        </div>
      </div>
    </Container>
  );
}
```

### Pattern 2: Route-Specific Loading (Tailored Skeleton)

**What:** A skeleton that matches the actual page layout for a seamless loading-to-content transition.
**When to use:** High-traffic routes where the layout is predictable (articles list, article detail, library, dashboard).
**Example:**

```typescript
// src/app/(marketing)/articles/[slug]/loading.tsx
import Container from '@/components/layout/Container';
import BaseSkeleton, { TextLineSkeleton, CircleSkeleton } from '@/components/ui/skeletons/BaseSkeleton';

export default function ArticleLoading() {
  return (
    <Container>
      <div className="py-12 max-w-4xl mx-auto">
        {/* Title */}
        <BaseSkeleton className="h-12 w-3/4 mb-4" variant="pulse" rounded="lg" />
        {/* Author + date */}
        <div className="flex items-center space-x-3 mb-8">
          <CircleSkeleton size="md" variant="pulse" />
          <div className="space-y-2">
            <BaseSkeleton className="h-4 w-32" variant="pulse" />
            <BaseSkeleton className="h-3 w-24" variant="pulse" />
          </div>
        </div>
        {/* Content lines */}
        <div className="space-y-4">
          <TextLineSkeleton lines={4} variant="pulse" />
          <BaseSkeleton className="h-48 w-full" variant="pulse" rounded="lg" />
          <TextLineSkeleton lines={6} variant="pulse" />
        </div>
      </div>
    </Container>
  );
}
```

### Pattern 3: Consistent Error Boundary

**What:** An error.tsx that matches the existing root error.tsx design (card-base, neutral colors, try-again + go-home buttons).
**When to use:** At every route-group level. Reuse the same visual pattern as the existing root `error.tsx`.
**Example:**

```typescript
// src/app/(marketing)/error.tsx
'use client';

import { useEffect } from 'react';
import Container from '@/components/layout/Container';

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Marketing section error:', error);
  }, [error]);

  return (
    <Container>
      <div className="min-h-[60vh] flex items-center justify-center py-12">
        <div className="max-w-lg w-full">
          <div className="card-base p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-neutral-400 mb-6">
              We encountered an unexpected error. Please try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-lg transition-colors"
              >
                Go to homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
```

### Pattern 4: global-error.tsx

**What:** Catches errors in root layout that regular error.tsx cannot catch. Must include its own `<html>` and `<body>` tags.
**When to use:** Single file at `src/app/global-error.tsx`.
**Example:**

```typescript
// Source: Context7 /vercel/next.js - global error handler
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center space-y-6">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-neutral-400">
              A critical error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### Pattern 5: Suspense Boundaries for Server Components

**What:** Wrap async server components in Suspense with skeleton fallbacks for streaming.
**When to use:** Only for async server component pages: `articles/[slug]` and `profile/[handle]`.
**Note:** These pages already have `loading.tsx` coverage from the route, but in-page Suspense can provide more granular streaming. However, since the constraint is "UI wrappers only," the `loading.tsx` approach is the primary mechanism. Suspense within page components would require modifying page files, which is borderline -- the safest approach is to rely on `loading.tsx` for these routes.

### Anti-Patterns to Avoid

- **Using spinners in loading.tsx:** The user explicitly requires skeleton screens, not spinners. The existing `AuthLoadingSpinner` and `FullScreenLoader` use spinners -- these should NOT be used in loading.tsx files. Leave them untouched in their current inline usage.
- **Modifying data fetching logic:** Zero changes to how pages fetch data. Only add wrapper files.
- **Using `gray-*` colors:** The `Skeleton.tsx` in `src/components/ui/` uses `gray-200`/`gray-700` -- avoid importing from this file. Use `BaseSkeleton` from `src/components/ui/skeletons/BaseSkeleton.tsx` which uses `white/10` patterns consistent with the dark theme.
- **Over-granular error boundaries:** Placing error.tsx at every leaf route adds maintenance burden for minimal benefit. Route-group level is the sweet spot.
- **Modifying existing loading/error patterns inline:** Pages that already handle loading internally (e.g., `HomePage` with `AuthLoadingSpinner`) should be left alone. The new `loading.tsx` files handle the route transition; the inline handling covers post-hydration loading.

## Don't Hand-Roll

| Problem                | Don't Build             | Use Instead                    | Why                                            |
| ---------------------- | ----------------------- | ------------------------------ | ---------------------------------------------- |
| Skeleton primitives    | New skeleton components | `BaseSkeleton` + named exports | Already built with variants and accessibility  |
| Dashboard loading      | Custom dashboard loader | `DashboardSkeleton`            | Already exists with compact/detailed variants  |
| Article card skeletons | New card skeletons      | `ArticleCardSkeleton`          | Already matches article card layout            |
| Error boundary UI      | New error design        | Clone root `error.tsx` pattern | Already approved design with card-base styling |
| Layout wrapper         | Custom div wrappers     | `Container` component          | Consistent padding/max-width                   |

**Key insight:** The existing skeleton and error component library is already well-built. The main work is creating the loading.tsx/error.tsx files that compose these existing components, not building new ones.

## Common Pitfalls

### Pitfall 1: Loading.tsx Shown During Client-Side State Changes

**What goes wrong:** `loading.tsx` is shown during route transitions, but client components that manage their own loading state (via `useState`) will show loading.tsx AND then their internal spinner, causing a double-loading flash.
**Why it happens:** `loading.tsx` wraps the page in a Suspense boundary. For client components, the initial render happens quickly (no server-side data fetching), so loading.tsx typically flashes very briefly or not at all.
**How to avoid:** Keep loading.tsx files lightweight. For client-component-heavy routes, a brief generic skeleton is fine -- it will only show during the route transition, not during the component's own data fetching.
**Warning signs:** Users seeing two different loading states in sequence.

### Pitfall 2: Error.tsx Not Being 'use client'

**What goes wrong:** Error boundaries must be client components. Forgetting `'use client'` causes a build error.
**Why it happens:** Easy to forget since loading.tsx does NOT need 'use client'.
**How to avoid:** Always start error.tsx with `'use client'`.
**Warning signs:** Build errors mentioning error boundary.

### Pitfall 3: Error.tsx Cannot Catch Layout Errors

**What goes wrong:** An `error.tsx` in a route segment catches errors in its page and child segments, but NOT in its sibling `layout.tsx`. Root layout errors need `global-error.tsx`.
**Why it happens:** Error boundaries in Next.js wrap the page content, not the layout at the same level.
**How to avoid:** Add `global-error.tsx` at the app root to catch root layout errors. Route-group level error.tsx files catch errors in their children.
**Warning signs:** White screen on root layout error despite having error.tsx.

### Pitfall 4: Skeleton Colors Inconsistent with Design System

**What goes wrong:** Using `gray-*` or light-mode colors in skeletons looks wrong in the dark-mode-only app.
**Why it happens:** Two skeleton systems exist: `Skeleton.tsx` (uses gray-_) and `BaseSkeleton.tsx` (uses white/_ dark theme). Importing the wrong one.
**How to avoid:** Always import from `src/components/ui/skeletons/BaseSkeleton.tsx`. Never from `src/components/ui/Skeleton.tsx`.
**Warning signs:** Light gray flash in dark UI during loading.

### Pitfall 5: Loading.tsx Blocking Metadata

**What goes wrong:** If loading.tsx is placed incorrectly, it could interfere with `generateMetadata` running on server.
**Why it happens:** Misunderstanding of how loading.tsx and metadata interact.
**How to avoid:** `loading.tsx` does not block metadata generation. They work independently -- metadata is resolved server-side while loading.tsx shows client-side during streaming.
**Warning signs:** None expected if following standard conventions.

## Code Examples

### Existing Root Error Pattern (to clone for route groups)

```typescript
// Source: src/app/error.tsx (existing file)
// Key elements to replicate:
// - 'use client' directive
// - Container wrapper
// - card-base styling
// - neutral-400 text for descriptions
// - Try again button + Go to homepage button
// - Development-only error details
// - useEffect for error logging
```

### Existing Articles Loading Pattern (good example to follow)

```typescript
// Source: src/app/(marketing)/articles/loading.tsx (existing file)
// Key elements:
// - No 'use client' needed (server component)
// - Container wrapper
// - Static header text matching actual page
// - ArticleCardSkeleton grid matching actual layout
// - Proper grid responsive classes matching actual page
```

### Auth Route Loading (recommended new pattern)

```typescript
// src/app/(auth)/loading.tsx
import BaseSkeleton from '@/components/ui/skeletons/BaseSkeleton';

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <BaseSkeleton className="h-8 w-48 mx-auto mb-2" variant="pulse" rounded="lg" />
          <BaseSkeleton className="h-4 w-64 mx-auto" variant="pulse" rounded="md" />
        </div>
        <div className="card-base p-6 space-y-4">
          <BaseSkeleton className="h-10 w-full" variant="pulse" rounded="md" />
          <BaseSkeleton className="h-10 w-full" variant="pulse" rounded="md" />
          <BaseSkeleton className="h-12 w-full" variant="pulse" rounded="lg" />
        </div>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach                    | Current Approach              | When Changed | Impact                                                  |
| ------------------------------- | ----------------------------- | ------------ | ------------------------------------------------------- |
| Custom error boundaries (class) | `error.tsx` file convention   | Next.js 13   | Automatic error boundary per route segment              |
| Manual loading state management | `loading.tsx` file convention | Next.js 13   | Automatic Suspense wrapping with instant loading states |
| Client-side loading spinners    | Skeleton screens              | ~2022+       | Better perceived performance, less layout shift         |
| Page-level Suspense only        | Nested Suspense boundaries    | React 18     | Granular streaming of independent content sections      |

**Deprecated/outdated:**

- Manual `<Suspense>` wrapping of entire page: Now handled automatically by `loading.tsx`
- `_error.tsx` (Pages Router): Replaced by `error.tsx` in App Router
- `_loading.tsx` (Pages Router): Replaced by `loading.tsx` in App Router

## Inventory: Current State vs Target

### Route Group: (marketing) -- 10 page routes

| Route                      | Has loading.tsx | Has error.tsx | Recommendation                        |
| -------------------------- | --------------- | ------------- | ------------------------------------- |
| (marketing)/               | NO              | NO            | Add group-level loading + error       |
| articles/                  | YES (good)      | NO            | Keep existing, covered by group error |
| articles/[slug]/           | NO              | NO            | Add route-specific skeleton           |
| library/                   | NO              | NO            | Add route-specific skeleton           |
| profile/[handle]/          | NO              | NO            | Add route-specific skeleton           |
| quiz/                      | NO              | NO            | Covered by group-level                |
| quiz/questions/            | NO              | NO            | Covered by group-level                |
| quiz/results/              | NO              | NO            | Covered by group-level                |
| about/                     | NO              | NO            | Covered by group-level                |
| suggest-resource/          | NO              | NO            | Covered by group-level                |
| privacy/, terms/, cookies/ | NO              | NO            | Covered by group-level (static pages) |

### Route Group: (auth) -- 7 page routes

| Route                | Has loading.tsx | Has error.tsx | Recommendation                  |
| -------------------- | --------------- | ------------- | ------------------------------- |
| (auth)/              | NO              | NO            | Add group-level loading + error |
| auth/signin          | NO              | NO            | Covered by group-level          |
| auth/signup          | NO              | NO            | Covered by group-level          |
| auth/forgot-password | NO              | NO            | Covered by group-level          |
| auth/reset-password  | NO              | NO            | Covered by group-level          |
| auth/verify-email    | NO              | NO            | Covered by group-level          |
| auth/confirmation    | NO              | NO            | Covered by group-level          |
| access-denied        | NO              | NO            | Covered by group-level          |

### Route Group: (dashboard) -- 6 page routes

| Route              | Has loading.tsx | Has error.tsx | Recommendation                        |
| ------------------ | --------------- | ------------- | ------------------------------------- |
| (dashboard)/       | NO              | NO            | Add group-level loading + error       |
| dashboard/         | NO              | NO            | Add route-specific (tabbed dashboard) |
| dashboard/articles | NO              | NO            | Covered by dashboard loading          |
| home/              | NO              | NO            | Add route-specific (feed skeleton)    |
| preview/           | NO              | NO            | Covered by group-level                |
| profile/           | NO              | NO            | Covered by group-level                |
| write/             | NO              | NO            | Add route-specific (editor skeleton)  |

### Route Group: (admin) -- 11 page routes

| Route                   | Has loading.tsx | Has error.tsx | Recommendation                              |
| ----------------------- | --------------- | ------------- | ------------------------------------------- |
| admin/                  | NO              | NO            | Add group-level loading + error             |
| admin/dashboard         | NO              | NO            | Add route-specific (uses DashboardSkeleton) |
| admin/articles          | NO              | NO            | Covered by group-level                      |
| admin/articles/pending  | NO              | NO            | Covered by group-level                      |
| admin/notifications     | NO              | NO            | Covered by group-level                      |
| admin/library/add       | NO              | NO            | Covered by group-level                      |
| admin/featured/articles | NO              | NO            | Covered by group-level                      |
| admin/featured/tools    | NO              | NO            | Covered by group-level                      |
| admin/seo-tools/\*      | NO              | NO            | Covered by group-level                      |

### App Root

| File             | Exists | Recommendation                               |
| ---------------- | ------ | -------------------------------------------- |
| error.tsx        | YES    | KEEP -- well-designed, matches design system |
| not-found.tsx    | YES    | KEEP -- comprehensive with helpful links     |
| global-error.tsx | NO     | ADD -- needed for root layout error coverage |

## Open Questions

1. **Skeleton variant consistency**
   - What we know: `BaseSkeleton` supports pulse, shimmer, wave, glow variants. The user said "skeleton screens (not spinners or shimmer effects)."
   - What's unclear: Does "shimmer" in the user's constraint refer to the shimmer animation variant? The `BaseSkeleton` default is `shimmer`. The `pulse` variant is `animate-pulse bg-white/10` which is the most standard skeleton look.
   - Recommendation: Use `variant="pulse"` for all loading.tsx skeletons to align with "skeleton screens" constraint. The pulse animation is the standard skeleton pattern. Reserve shimmer/wave/glow for in-component use where they already exist.

2. **Interaction between loading.tsx and ProtectedRoute**
   - What we know: Many dashboard/admin pages wrap content in `<ProtectedRoute>`. The `loading.tsx` shows during route transition BEFORE the page component mounts.
   - What's unclear: Whether the loading.tsx skeleton flashes briefly before ProtectedRoute redirects unauthenticated users.
   - Recommendation: Keep loading.tsx generic enough that a brief flash is acceptable. The ProtectedRoute redirect happens at the component level after hydration, so the loading.tsx flash would be very brief.

## Sources

### Primary (HIGH confidence)

- Context7 `/vercel/next.js` -- loading.tsx, error.tsx, global-error.tsx file conventions, Suspense streaming patterns
- Codebase analysis -- full inventory of 38 page routes, 5 existing skeleton components, 1 error boundary, 1 loading file, 2 not-found files

### Secondary (MEDIUM confidence)

- Next.js App Router documentation (via Context7) -- error boundary nesting behavior, metadata interaction with loading states

### Tertiary (LOW confidence)

- None -- all findings verified via codebase inspection and official Next.js documentation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- Using only built-in Next.js conventions and existing project components
- Architecture: HIGH -- File placement follows Next.js App Router conventions exactly; route inventory is complete from codebase analysis
- Pitfalls: HIGH -- All pitfalls verified against Next.js documentation and codebase inspection

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable -- Next.js file conventions are well-established)
