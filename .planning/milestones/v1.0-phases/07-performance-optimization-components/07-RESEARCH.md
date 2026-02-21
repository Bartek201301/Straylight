# Phase 7: Performance Optimization - Components - Research

**Researched:** 2026-02-19
**Domain:** Next.js 14 server/client component boundaries, bundle optimization, image/font performance
**Confidence:** HIGH

## Summary

The StrayLight codebase has **157 files with `'use client'` directives**, including **31 out of 38 page files**. This represents massive client directive pollution. Many pages (privacy, terms, cookies, about, suggest-resource) have `'use client'` despite using zero client-side hooks or interactivity -- they are pure static content or thin wrappers around client children. Additionally, several pages (library, suggest-resource) have commented-out metadata exports because `'use client'` prevents server-side metadata generation.

The public directory contains **60MB of static assets** with several egregiously oversized files: a 6.1MB JPEG, 4.5MB SVG, 3.9MB JPEG, and 2.0MB PNG logo. The `aboutpage/` subdirectory alone contains 11MB of SVGs (700KB-1MB each). These represent immediate optimization wins.

The project already uses `next/font/google` correctly with three fonts (Sora, Inter, JetBrains Mono) and has `@next/bundle-analyzer` installed with `npm run analyze` configured. The root layout is already a server component. TipTap editor components total 2,400 lines across 3 files and are only used on the write page.

**Primary recommendation:** Convert static/legal pages to server components (restoring metadata exports), push `'use client'` to leaf components on remaining pages, dynamically import TipTap and heavy effect components, add ESLint `no-restricted-syntax` guard rule, and audit/compress oversized public assets.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Add ESLint guard rule to prevent future `"use client"` pollution (e.g., warn when large files have `"use client"` at top level)
- This is a locked decision -- guard rule must be implemented

### Claude's Discretion

**Client directive splitting:**

- How aggressively to split `"use client"` components (maximum vs. pragmatic) -- Claude evaluates each case based on bundle impact
- Whether to convert fully client-side pages to server components with client islands -- Claude assesses difficulty vs. payoff per page
- Layout files priority -- Claude determines whether to prioritize layouts over pages based on cascade impact analysis

**Code-splitting targets:**

- Whether TipTap editor should be dynamically imported -- Claude determines based on bundle impact analysis
- Admin component handling -- Claude evaluates whether additional splitting beyond Next.js route-level splitting is needed
- SSR skip decisions (`ssr: false`) -- Claude determines per-component based on SEO needs vs. performance tradeoff

**Image & font optimization:**

- Scope of `<img>` to `next/image` migration -- Claude determines based on how many non-optimized images exist
- Font loading strategy -- Claude audits codebase to determine font usage and optimize accordingly
- Static asset audit -- Claude audits `public/` folder and flags oversized files
- User-uploaded image flow -- Claude checks upload/serving flow and optimizes accordingly

**Bundle tracking:**

- Granularity of before/after metrics tracking -- Claude determines appropriate level

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                               | Research Support                                                                                                                                                                                            |
| ------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PERF-01 | Optimize server/client component boundaries -- push "use client" directives down the tree | 31/38 pages have `'use client'`; at least 5 pages (privacy, terms, cookies, about, suggest-resource) can become server components immediately; remaining pages need client islands pattern                  |
| PERF-02 | Implement proper code splitting for heavy components (TipTap editor, admin dashboard)     | TipTap is 2,400 LOC across 3 files, only used on write page; admin dashboard already lazy-loads stats components; framer-motion used in 19 files; cobe, ogl, lottie-react each used in 1 file               |
| PERF-03 | Audit and optimize bundle size -- target 20%+ reduction                                   | Heavy deps: framer-motion, @tiptap/\*, cobe, ogl, lottie-react, ioredis (server-only but in deps); `optimizePackageImports` already covers lucide-react/framer-motion; oversized public assets (60MB total) |
| PERF-04 | Review and optimize image/font usage (next/image, next/font)                              | Only 10 files use `next/image`; 1 file uses raw `<img>` tag (MarkdownPreview); fonts correctly configured with `next/font/google`; public/ has multiple multi-MB images needing compression                 |

</phase_requirements>

## Standard Stack

### Core (Already Installed)

| Library               | Version | Purpose                                                           | Status                                  |
| --------------------- | ------- | ----------------------------------------------------------------- | --------------------------------------- |
| next                  | ^14.0.0 | Framework with App Router, dynamic imports, next/image, next/font | In use                                  |
| @next/bundle-analyzer | ^16.1.6 | Bundle analysis visualization                                     | Installed, `npm run analyze` configured |
| sharp                 | ^0.33.0 | Image optimization backing for next/image                         | Installed                               |
| cross-env             | ^10.1.0 | Windows-compatible env vars for analyze script                    | Installed                               |

### Supporting (No New Dependencies Needed)

This phase requires no new npm dependencies. All optimization work uses built-in Next.js features and existing ESLint configuration.

| Tool                          | Purpose                          | When to Use                            |
| ----------------------------- | -------------------------------- | -------------------------------------- |
| `next/dynamic`                | Dynamic imports with SSR control | TipTap editor, heavy effect components |
| `next/image`                  | Optimized image component        | Replace any raw `<img>` usage          |
| `next/font/google`            | Optimized font loading           | Already configured correctly           |
| ESLint `no-restricted-syntax` | Guard rule for `'use client'`    | Prevent future pollution               |

### Alternatives Considered

| Instead of             | Could Use    | Tradeoff                                                                                                                                   |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| React.lazy()           | next/dynamic | next/dynamic is preferred in Next.js -- supports SSR control, loading states, and works with server components importing client components |
| Custom image component | next/image   | next/image already handles responsive, lazy loading, format conversion                                                                     |

## Architecture Patterns

### Pattern 1: Server Page with Client Islands

**What:** Page files remain server components, delegate interactivity to imported client components.
**When to use:** Any page that can export metadata and doesn't itself need hooks.
**Confidence:** HIGH (verified from Next.js docs via Context7)

```typescript
// src/app/(marketing)/privacy/page.tsx - AFTER
import { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/metadata';
import { PageStructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = createMetadata({
  title: 'Privacy Policy | StrayLight',
  description: '...',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <>
      <PageStructuredData pageType="legal" title="..." description="..." path="/privacy" />
      <div className="min-h-screen bg-black text-white">
        {/* Static content -- no 'use client' needed */}
      </div>
    </>
  );
}
```

### Pattern 2: Dynamic Import for Heavy Components

**What:** Use `next/dynamic` to lazy-load components that are large and not needed on initial render.
**When to use:** TipTap editor, CobeGlobe, Orb, lottie-react consumers, framer-motion heavy components.
**Confidence:** HIGH (verified from Context7 Next.js docs)

```typescript
// Source: Next.js docs via Context7 /llmstxt/nextjs_llms_txt
import dynamic from 'next/dynamic';

// For components that need browser APIs
const ArticleEditor = dynamic(
  () => import('@/components/editor/ArticleEditor'),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

// For components that can SSR but are heavy
const CobeGlobe = dynamic(
  () => import('@/components/effects/CobeGlobe'),
  { ssr: false }
);
```

### Pattern 3: ESLint Guard Rule for `'use client'` Pollution

**What:** ESLint `no-restricted-syntax` rule warns when `'use client'` appears in files.
**When to use:** Applied globally with per-file overrides where genuinely needed.
**Confidence:** HIGH (verified from ESLint docs via Context7)

Note: ESLint 8 (used in this project) does not have a built-in way to restrict `'use client'` based on file size. The most practical approach is to use `no-restricted-syntax` targeting the `ExpressionStatement` with value `'use client'` as a **warn** level rule, then use `// eslint-disable-next-line` in files that legitimately need it. An alternative is a custom ESLint plugin, but that adds unnecessary complexity.

Recommended approach for `.eslintrc.json`:

```json
{
  "rules": {
    "no-restricted-syntax": [
      "warn",
      {
        "selector": "ExpressionStatement[expression.value='use client']",
        "message": "Avoid 'use client' at page/layout level. Push client directives to leaf components. Disable this rule only for files that genuinely require client-side interactivity."
      }
    ]
  },
  "overrides": [
    {
      "files": [
        "src/contexts/**",
        "src/hooks/**",
        "src/components/providers/**"
      ],
      "rules": {
        "no-restricted-syntax": "off"
      }
    }
  ]
}
```

### Pattern 4: Wrapper Pattern for Mixed Pages

**What:** Pages that need both metadata (server) and interactivity (client) use a server page that imports a client content component.
**When to use:** Pages like library, suggest-resource, quiz that currently have `'use client'` but could benefit from metadata exports.

```typescript
// src/app/(marketing)/library/page.tsx - Server component
import { Metadata } from 'next';
import LibraryPageContent from './_components/LibraryPageContent';

export const metadata: Metadata = { /* restored metadata */ };

export default function LibraryPage() {
  return <LibraryPageContent />;
}

// src/app/(marketing)/library/_components/LibraryPageContent.tsx - Client component
'use client';
// ... existing page content moved here
```

### Anti-Patterns to Avoid

- **`'use client'` on pages with no interactivity:** Pages like privacy, terms, cookies are pure HTML -- they gain nothing from client rendering and lose SSR/metadata benefits.
- **`'use client'` on pages just because they import client components:** A server component can import and render client components. The `'use client'` boundary is at the imported component, not the parent.
- **React.lazy() instead of next/dynamic:** In Next.js App Router, use `next/dynamic` which handles SSR/SSG correctly. React.lazy() is only appropriate within already-client components (the marketing page already uses this pattern and should migrate to `next/dynamic`).
- **`sideEffects: false` on webpack config:** Already set in `next.config.js` (`config.optimization.sideEffects = false`). This is correct for tree-shaking but must be paired with the `"sideEffects"` field in `package.json` (already present, listing CSS files).

## Don't Hand-Roll

| Problem            | Don't Build                                | Use Instead                            | Why                                                                             |
| ------------------ | ------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------- |
| Image optimization | Custom compression pipeline for runtime    | `next/image` component                 | Handles responsive sizing, format conversion (avif/webp), lazy loading, caching |
| Code splitting     | Manual webpack chunk configuration changes | `next/dynamic`                         | Next.js handles chunk naming, loading states, SSR integration                   |
| Font optimization  | Custom font loading scripts                | `next/font/google` (already used)      | Automatic self-hosting, `font-display: swap`, zero CLS                          |
| Bundle analysis    | Custom size tracking scripts               | `npm run analyze` (already configured) | Visual treemap, accurate per-chunk breakdown                                    |

**Key insight:** Next.js 14 already provides all the optimization primitives needed. The work is about _using them correctly_, not adding new tools.

## Common Pitfalls

### Pitfall 1: Breaking Server Components by Importing Client Libraries

**What goes wrong:** Importing a client library (e.g., framer-motion) in a server component causes build errors.
**Why it happens:** Server components cannot use browser APIs or React hooks.
**How to avoid:** Keep the import in the client component. The server page imports the client component, not the library directly.
**Warning signs:** Build errors mentioning "useState is not defined" or "window is not defined."

### Pitfall 2: Losing Metadata Exports When Converting Pages

**What goes wrong:** Converting a page from server to client component (or vice versa) and forgetting to restore/move metadata exports.
**Why it happens:** `export const metadata` and `export async function generateMetadata()` only work in server components.
**How to avoid:** When removing `'use client'` from a page, check if there are commented-out metadata exports (found in library, suggest-resource pages) that should be restored.
**Warning signs:** Commented-out metadata exports in page files.

### Pitfall 3: Dynamic Import Breaking Ref Forwarding

**What goes wrong:** Components that use `forwardRef` may lose ref forwarding when wrapped in `dynamic()`.
**Why it happens:** `next/dynamic` creates a wrapper component that doesn't forward refs by default.
**How to avoid:** Test ref behavior after wrapping components with `dynamic()`. The ArticleEditor uses `forwardRef` and `useImperativeHandle` -- test thoroughly.
**Warning signs:** `ref` props returning `null` after dynamic import conversion.

### Pitfall 4: Aggressive `sideEffects: false` Breaking CSS

**What goes wrong:** CSS imports get tree-shaken away.
**Why it happens:** `sideEffects: false` in webpack config tells the bundler to remove imports that aren't explicitly used.
**How to avoid:** The `package.json` already has `"sideEffects": ["*.css", "*.scss", "./src/app/globals.css"]` which protects CSS. Verify this remains intact.
**Warning signs:** Missing styles after build, especially global CSS.

### Pitfall 5: Dynamic Import Loading States Causing Layout Shift

**What goes wrong:** Components loading with `dynamic()` show fallback content that has different dimensions than the loaded component.
**Why it happens:** Loading skeletons/placeholders don't match the final component's dimensions.
**How to avoid:** Use appropriately sized loading skeletons. For components below the fold, `loading: () => null` is acceptable.
**Warning signs:** CLS (Cumulative Layout Shift) score degradation in Lighthouse.

## Code Examples

### Converting a Static Page to Server Component

```typescript
// BEFORE: src/app/(marketing)/terms/page.tsx
'use client';

import { PageStructuredData } from '@/components/seo/StructuredData';

export default function TermsPage() {
  return (
    <>
      <PageStructuredData pageType="legal" title="..." description="..." path="/terms" />
      <div className="min-h-screen bg-black text-white">
        {/* Static content */}
      </div>
    </>
  );
}

// AFTER: src/app/(marketing)/terms/page.tsx
import { Metadata } from 'next';
import { createMetadata } from '@/lib/seo/metadata';
import { PageStructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = createMetadata({
  title: 'Terms of Service | StrayLight',
  description: '...',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <>
      <PageStructuredData pageType="legal" title="..." description="..." path="/terms" />
      <div className="min-h-screen bg-black text-white">
        {/* Static content -- identical, now SSR'd */}
      </div>
    </>
  );
}
```

### Dynamic Import of TipTap Editor

```typescript
// src/app/(dashboard)/write/page.tsx
'use client';

import dynamic from 'next/dynamic';
import EditorSkeleton from '@/components/ui/skeletons/EditorSkeleton';

const ArticleEditor = dynamic(
  () => import('@/components/editor/ArticleEditor'),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);
```

### ESLint Guard Rule Configuration

```json
{
  "rules": {
    "no-restricted-syntax": [
      "warn",
      {
        "selector": "ExpressionStatement[expression.value='use client']",
        "message": "Avoid 'use client' at page/layout level. Push to leaf components. Disable per-line if genuinely needed."
      }
    ]
  },
  "overrides": [
    {
      "files": [
        "src/contexts/**",
        "src/hooks/**",
        "src/components/providers/**",
        "src/components/effects/**",
        "src/components/editor/**",
        "src/components/forms/**",
        "src/components/auth/**"
      ],
      "rules": {
        "no-restricted-syntax": "off"
      }
    }
  ]
}
```

Note: The existing `no-restricted-imports` rule in `.eslintrc.json` already uses the `"warn"` pattern array format. The `no-restricted-syntax` rule must be **merged** with any existing entries (currently none exist for `no-restricted-syntax`).

## Codebase Audit Findings

### Client Directive Audit

**Total files with `'use client'`:** 157

**Pages with `'use client'` (31/38):**

| Category                            | Pages                        | Can Remove `'use client'`? | Rationale                                                                                            |
| ----------------------------------- | ---------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| Legal/static (no hooks)             | privacy, terms, cookies      | YES -- immediate           | Zero interactivity, pure HTML, `PageStructuredData` is already server component                      |
| Marketing (no hooks in page)        | about, suggest-resource      | YES -- wrap pattern        | Page itself has no hooks; imports client children                                                    |
| Marketing (with commented metadata) | library                      | YES -- wrap pattern        | Move content to `_components/`, restore metadata                                                     |
| Marketing homepage                  | page.tsx                     | PARTIAL -- complex         | 398 LOC, uses useAuth/useRouter but most content is lazy-loaded effects. Could split but high effort |
| Auth pages                          | signin, signup, etc.         | NO                         | Genuinely need client interactivity (forms, state)                                                   |
| Dashboard pages                     | home, dashboard, write, etc. | NO                         | Require auth state, forms, real-time features                                                        |
| Admin pages                         | dashboard, articles, etc.    | NO                         | Require auth, admin state, forms                                                                     |

**Layouts (0/11 have `'use client'`):** All layouts are already server components. No action needed.

### Heavy Dependencies Audit

| Dependency              | Bundle Impact         | Used In                    | Recommendation                                                                   |
| ----------------------- | --------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| framer-motion           | ~120KB gzipped (full) | 19 files                   | Already in `optimizePackageImports`; ensure tree-shaking works via named imports |
| @tiptap/\* (3 packages) | ~80-100KB estimated   | 3 files (editor only)      | Dynamic import with `ssr: false` on write page                                   |
| cobe                    | ~15KB                 | 1 file (CobeGlobe)         | Dynamic import with `ssr: false`                                                 |
| ogl                     | ~50KB                 | 1 file (Orb)               | Already lazy-loaded in marketing page                                            |
| lottie-react            | ~40KB                 | 1 file (FloatingChat)      | Already lazy-loaded in root layout                                               |
| ioredis                 | server-only           | 0 files directly importing | In `dependencies` but unused in client code; verify tree-shaking excludes it     |

### Static Asset Audit

**Oversized files in `public/` (60MB total):**

| File                           | Size                   | Action                                          |
| ------------------------------ | ---------------------- | ----------------------------------------------- |
| sztucznainteligencja.jpg       | 6.1MB                  | Compress to ~200KB with quality 80              |
| placehold1.svg                 | 4.5MB                  | Convert to optimized PNG/WebP or simplify SVG   |
| quantiumcomputing.jpg          | 3.9MB                  | Compress to ~200KB                              |
| logo transparent.png           | 2.0MB                  | Convert to WebP, compress aggressively          |
| etycznedylematyaizmedycyna.png | 1.5MB                  | Compress to ~150KB                              |
| avatar-chatbota.png            | 1.4MB                  | Compress to ~100KB                              |
| medycynaai.png                 | 1.2MB                  | Compress to ~150KB                              |
| aboutpage/\*.svg               | 11MB total (5 files)   | Convert to WebP/PNG or simplify SVGs            |
| gallery/features/\*.png        | 7.2MB total (10 files) | Compress, use next/image for responsive serving |

**Note:** The `scripts/optimize-images-simple.js` and `scripts/optimize-images.js` exist but may not have been run recently given these file sizes.

### Font Configuration (Already Optimized)

- `Sora`: Primary font, preloaded, 6 weights (300-800)
- `Inter`: Secondary, NOT preloaded, 3 weights
- `JetBrains Mono`: Code font, NOT preloaded, 2 weights
- All use `display: 'swap'` and proper fallbacks

**Recommendation:** Consider reducing Sora weights. 6 weights (300, 400, 500, 600, 700, 800) is aggressive. Audit actual usage -- likely only 400, 600, 700 are needed, which would reduce font payload by ~50%.

### Image Component Usage

- **10 files** use `next/image` (already optimized)
- **1 file** uses raw `<img>` tag: `MarkdownPreview.tsx` (line 89) -- this is in user-generated content rendering and is acceptable since the content is dynamic HTML
- **0 files** use `<img>` for static content -- good

## Metrics Strategy

### Baseline Capture (Before)

Run before any changes:

```bash
npm run analyze                    # Bundle analyzer visual (opens browser)
npm run build 2>&1 | tee build-before.log  # Capture build output with route sizes
npm run metrics -- --output-prefix pre-p07  # Existing metrics script
```

Key metrics to extract from build output:

- First Load JS per route (shown in Next.js build output)
- Total JS shared across routes
- Number of chunks

### After Capture

Run identical commands with `post-p07` prefix after all optimizations.

### Success Metric

Compare first-load JS for key routes:

- `/` (marketing homepage)
- `/articles` (articles listing)
- `/articles/[slug]` (individual article)
- `/home` (dashboard)
- `/write` (editor)
- `/admin/dashboard` (admin)

Target: 20% reduction in average first-load JS across these routes (best-effort, not a hard gate).

## State of the Art

| Old Approach                          | Current Approach                     | When Changed       | Impact                                          |
| ------------------------------------- | ------------------------------------ | ------------------ | ----------------------------------------------- |
| `React.lazy()` for code splitting     | `next/dynamic` in App Router         | Next.js 13+ (2023) | SSR-aware lazy loading, better chunk management |
| `getInitialProps` for data fetching   | Server Components + async components | Next.js 13+ (2023) | Zero client JS for data-fetching pages          |
| Manual font loading with `@font-face` | `next/font/google`                   | Next.js 13+ (2023) | Auto self-hosting, zero CLS, optimal loading    |
| Custom image optimization             | `next/image` with AVIF/WebP          | Next.js 10+ (2020) | Automatic format selection, responsive, lazy    |

**Deprecated/outdated:**

- `React.lazy()` in App Router pages: Use `next/dynamic` instead (React.lazy is fine within client components but not for page-level splitting)
- `swcMinify: true` in `next.config.js`: This has been the default since Next.js 13 and the option is ignored in newer versions. Harmless but unnecessary.

## Open Questions

1. **Actual bundle sizes per route**
   - What we know: The project has `npm run analyze` configured but no saved output
   - What's unclear: Exact per-route first-load JS sizes
   - Recommendation: Run `npm run build` before starting work to capture baseline numbers from build output. The planner should make this the first task.

2. **ioredis in production dependencies**
   - What we know: `ioredis` is in `dependencies` (not `devDependencies`), `@types/ioredis` is also in `dependencies`
   - What's unclear: Whether ioredis is actually used server-side (no direct imports found in `src/`). It may be used in API routes or edge functions.
   - Recommendation: Check if it's actually used. If not, removing it would clean up the dependency tree. If used only server-side, it should still be fine as Next.js tree-shakes server-only imports from client bundles.

3. **Marketing homepage conversion difficulty**
   - What we know: 398 LOC, uses `useAuth` and `useRouter`, heavy lazy-loaded components
   - What's unclear: Whether the auth redirect logic can be moved to middleware or a small client wrapper
   - Recommendation: Evaluate during implementation. If the auth check is the only client need, wrap it in a small client component. If deeply intertwined, leave as client and focus on other wins.

## Sources

### Primary (HIGH confidence)

- Context7 `/llmstxt/nextjs_llms_txt` -- next/dynamic, lazy loading, server/client components, SSR control
- Context7 `/websites/eslint` -- no-restricted-syntax rule configuration, AST selectors
- Codebase analysis -- direct file reading and grep of 157 `'use client'` files, 38 page files, asset sizes

### Secondary (MEDIUM confidence)

- framer-motion bundle size estimate (~120KB gzipped) -- based on general knowledge of the library at v12.x; actual size depends on tree-shaking effectiveness with `optimizePackageImports`
- TipTap bundle size estimate (~80-100KB) -- based on typical TipTap starter-kit + extensions; actual size needs bundle analyzer verification

### Tertiary (LOW confidence)

- None -- all findings are from direct codebase analysis or verified documentation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- No new dependencies needed, all tools already installed and configured
- Architecture: HIGH -- Patterns are well-documented Next.js patterns verified via Context7
- Pitfalls: HIGH -- Based on direct codebase analysis showing exact files and patterns
- Asset optimization: HIGH -- Direct file size measurements from the filesystem
- Bundle size estimates: MEDIUM -- Dependency sizes are estimates; actual impact requires bundle analyzer

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable -- Next.js 14 patterns are mature)
