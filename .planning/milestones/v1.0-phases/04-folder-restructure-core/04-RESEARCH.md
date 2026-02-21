# Phase 4: Folder Restructure - Core - Research

**Researched:** 2026-02-18
**Domain:** Next.js 14 App Router folder structure, route groups, component colocation
**Confidence:** HIGH

## Summary

This phase reorganizes the `src/` directory to follow Next.js 14 App Router best practices: route groups by audience, component colocation with `_components` folders, and structured `lib/` organization. The codebase currently has 128 files in `src/app/`, 183 components in `src/components/`, 71 files in `src/lib/`, 8 hooks in `src/hooks/`, and 4 contexts in `src/contexts/`.

The existing structure is functional but flat -- no route groups exist, 51 route-specific components (28%) live in the shared `components/` directory instead of near their routes, and `lib/` has 25 files at its root with no grouping. The existing `@/*` path alias (`./src/*`) means all import paths will continue working as long as files stay within `src/` -- which is a major advantage, since route groups (`(marketing)`, `(dashboard)`, `(admin)`) don't affect import paths for `@/` aliased modules.

**Primary recommendation:** Execute incrementally by route group -- first create route groups and move routes, then colocate route-specific components, then reorganize lib/. Each step should pass `npm run build` before proceeding to the next.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Organize by audience: (marketing) for public pages, (dashboard) for logged-in users, (admin) for admin-only
- Auth routes placement: Claude's discretion based on Next.js conventions
- Group layouts: Claude determines which groups benefit from dedicated layout.tsx (don't add empty layouts)
- Mixed-audience routes (articles, library, home): Claude decides placement based on actual auth patterns in the codebase
- Route-specific components go into `_components` folders (underscore prefix = private to Next.js)
- Colocation aggressiveness: Claude analyzes import graphs and moves what makes sense (single-route components are strong candidates)
- Shared components organized by type: ui/, layout/, forms/, auth/, articles/, admin/ etc.
- Feature subfolders (components/articles/, components/admin/): Claude analyzes usage patterns -- route-specific ones colocate, truly shared ones stay
- Organization approach: Claude's discretion based on analyzing current structure
- Hooks directory location: Claude decides (src/hooks vs src/lib/hooks)
- Contexts directory location: Claude decides based on Next.js conventions
- Fonts directory location: Claude decides based on next/font configuration
- File casing: Claude decides based on minimizing risk across Windows dev / Linux prod environments
- loading.tsx and error.tsx: Deferred to Phase 8 (explicit user decision -- keep Phase 4 focused on folder moves)
- Move strategy: Claude decides safest approach (incremental by group vs one batch)
- tsconfig path aliases: Claude reviews and picks best approach

### Claude's Discretion

- Auth route group placement (own group vs marketing)
- Which routes go in which groups for mixed-audience pages
- Group layout.tsx creation (only where actually needed)
- How aggressively to colocate components (based on import graph analysis)
- Feature subfolder reorganization approach
- Lib folder internal organization (by responsibility vs domain)
- Hooks, contexts, and fonts directory placement
- File casing standardization approach
- Incremental vs batch move strategy
- Path alias standardization

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                         | Research Support                                                                      |
| --------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| STRUCT-01 | Reorganize src/ to follow Next.js 14 App Router best practices with route groups    | Route group design section: (marketing), (dashboard), (admin) with full route mapping |
| STRUCT-02 | Colocate route-specific components with their pages (private `_components` folders) | Component colocation analysis: 51 candidates identified with import graph analysis    |
| STRUCT-03 | Organize shared components into logical groups (ui/, layout/, features/)            | Shared component inventory: articles/, auth/, seo/, newsletter/ stay shared           |
| STRUCT-04 | Structure lib/ with clear separation (services/, utils/, types/, hooks/)            | Lib reorganization plan: group flat root files, consolidate hooks, keep contexts      |

</phase_requirements>

## Standard Stack

No new libraries needed. This phase is purely structural -- file moves and import path updates.

### Core

| Tool        | Version | Purpose                  | Why Standard                            |
| ----------- | ------- | ------------------------ | --------------------------------------- |
| Next.js     | 14.x    | App Router, route groups | Already in use; route groups are native |
| TypeScript  | strict  | Path alias resolution    | tsconfig.json already configured        |
| `@/*` alias | N/A     | `./src/*` path mapping   | Already configured in tsconfig.json     |

### Supporting

| Tool            | Purpose                  | When to Use                   |
| --------------- | ------------------------ | ----------------------------- |
| `npm run build` | Verify no broken imports | After every structural change |
| `npm run lint`  | Verify code quality      | After all moves complete      |
| `git mv`        | Track file moves in git  | For all file/folder moves     |

**Installation:** None required -- no new packages.

## Architecture Patterns

### Recommended Project Structure (Target State)

```
src/
  app/
    (marketing)/              # Public pages -- no auth required
      page.tsx                # Landing page (/)
      about/page.tsx
      articles/
        page.tsx
        [slug]/
          page.tsx
          _components/        # ArticleContent, ArticlePageContent, ClientWrapper
      library/page.tsx
      cookies/page.tsx
      privacy/page.tsx
      terms/page.tsx
      quiz/
        page.tsx
        layout.tsx            # Keep existing (has metadata)
        questions/
          page.tsx
          layout.tsx          # Keep existing
        results/page.tsx
      suggest-resource/
        page.tsx
        layout.tsx            # Keep existing (has metadata)
      preview/
        page.tsx
        _components/          # PreviewContent
    (auth)/                   # Auth flow -- separate group
      auth/
        callback/route.ts
        signin/
          page.tsx
          layout.tsx          # Keep (has metadata)
        signup/
          page.tsx
          layout.tsx
        forgot-password/
          page.tsx
          layout.tsx
        reset-password/
          page.tsx
          layout.tsx
        verify-email/
          page.tsx
          layout.tsx
        confirmation-complete/page.tsx
      access-denied/page.tsx
    (dashboard)/              # Authenticated user pages
      home/page.tsx
      dashboard/
        page.tsx
        layout.tsx            # Keep existing
        articles/page.tsx
        _components/          # DashboardLightTool, DashboardOverview, DashboardProfile, DashboardSettings
      profile/
        page.tsx
        [handle]/
          page.tsx
          _components/        # ClientWrapper, ProfilePageContent
      write/page.tsx
    (admin)/                  # Admin-only pages
      admin/
        page.tsx
        layout.tsx            # Keep existing
        articles/
          page.tsx
          pending/page.tsx
        dashboard/page.tsx
        featured/
          articles/page.tsx
          tools/page.tsx
        library/add/page.tsx
        notifications/page.tsx
        seo-tools/
          page.tsx
          opengraph/page.tsx
          schema/page.tsx
          sitemap/page.tsx
    api/                      # API routes -- unchanged
      (all existing API routes stay as-is)
    globals.css
    layout.tsx                # Root layout -- unchanged
    error.tsx
    not-found.tsx
    robots.ts
    sitemap.ts
  components/                 # Shared components only
    ui/                       # Keep existing structure (38 files, well-organized)
    layout/                   # Keep existing (Navigation, Container, Footer)
    auth/                     # Keep (ConditionalNavigation, ProtectedRoute, etc.)
    articles/                 # Keep (shared across articles, home, dashboard, profile, preview)
    forms/                    # Keep (shared form components)
    seo/                      # Keep (StructuredData used across many pages)
    newsletter/               # Keep (MiniNewsletterSignup used on 4+ pages)
    chat/                     # Keep (global floating chat)
    effects/                  # Keep (used by about, suggest-resource, library)
    notifications/            # Keep (ToastContainer in root layout)
    providers/                # Keep (AppProviders in root layout)
    errors/                   # Keep or merge with error-handling/
    error-handling/           # Keep (app-wide error infrastructure)
  contexts/                   # Keep as-is (4 app-wide contexts)
    AuthContext.tsx
    NotificationContext.tsx
    ThemeContext.tsx
    ToastContext.tsx
  hooks/                      # Keep as-is (all hooks are used from multiple locations)
    useDebounce.ts
    useImageUpload.ts
    ... (all existing)
  lib/
    auth/                     # Keep (middleware-utils, role-verification, api-middleware)
    api/                      # Keep (cache, error-handling, rate-limiting, etc.)
    cache/                    # Keep
    constants/                # Keep
    errors/                   # Keep
    middleware/                # Keep
    quiz/                     # Keep here (used by quiz routes AND dashboard)
    services/                 # Keep (8 core business services)
    types/                    # Keep
    validation/               # Keep
    analytics/                # Keep
    seo/                      # NEW: group sitemap-utils, structured-data, opengraph, twitter-cards, metadata
    affiliate/                # NEW: group affiliate.ts + affiliate-integration.ts
    mail/                     # NEW: group mailchimp.ts + mailchimp-errors.ts
    content/                  # NEW: group markdown.ts, html-to-markdown.ts, reading-time.ts, article-status.ts
    supabase.ts               # Keep at root (foundational)
    utils.ts                  # Keep at root (general utilities)
    session-manager.ts        # Keep at root (foundational)
    font-performance.ts       # Keep at root (used by provider)
    optimized-imports.ts      # Keep at root
    performance-monitor.ts    # Keep at root
    resourcePreloader.ts      # Keep at root
  fonts/                      # Keep (just README, no actual files; fonts are from next/font/google)
```

### Pattern 1: Route Groups Don't Affect URL Paths

**What:** Parenthesized folders like `(marketing)` are invisible to routing. `src/app/(marketing)/about/page.tsx` serves `/about`.
**When to use:** Always -- this is the fundamental Next.js route group behavior.
**Confidence:** HIGH -- verified via Context7 (Next.js v14.3.0)

```
Source: Context7 /vercel/next.js/v14.3.0-canary.87
Route groups organize files and folders without affecting the URL path.
Convention: (folder)
```

### Pattern 2: Private Folders with Underscore Prefix

**What:** Folders prefixed with `_` (e.g., `_components`) are excluded from Next.js routing. They can contain any files without risk of being treated as route segments.
**When to use:** For colocating route-specific components next to their page.tsx files.
**Confidence:** HIGH -- verified via Context7

```
Source: Context7 /vercel/next.js/v14.3.0-canary.87
Defines a private folder using an underscore prefix.
Private folders and their contents are opted out of routing.
Convention: _folder
```

### Pattern 3: Metadata-Only Layouts Remain Per-Route

**What:** All existing layouts in this codebase are metadata-only (they export `metadata` and return `children`). They cannot be consolidated into route group layouts because each route needs unique metadata.
**When to use:** Understanding this prevents the mistake of trying to consolidate auth layouts.
**Confidence:** HIGH -- verified by reading all 11 layout.tsx files in the codebase.

### Pattern 4: Middleware Uses Path Strings, Not File Paths

**What:** The middleware (`middleware.ts`) uses URL pathname matching (e.g., `/admin`, `/dashboard`). Route groups don't change URL paths, so middleware needs zero changes.
**When to use:** Route groups are invisible to middleware -- this is safe.
**Confidence:** HIGH -- verified by reading middleware.ts and middleware-utils.ts.

### Anti-Patterns to Avoid

- **Moving API routes into route groups:** API routes under `src/app/api/` should stay flat. They don't benefit from route groups and moving them complicates the API URL structure.
- **Creating empty group layouts:** Don't add `(marketing)/layout.tsx` unless it actually wraps children with shared UI. Metadata-only layouts must stay per-route.
- **Breaking `@/` imports:** The `@/*` alias maps to `./src/*`. Files moved within `src/` keep working. But if component paths change (e.g., `@/components/admin/` to `@/app/(admin)/admin/_components/`), all import statements must be updated.
- **Colocating shared components:** Components used by 2+ routes (like `articles/`, `newsletter/`) must stay in `src/components/`, not be colocated with any single route.

## Don't Hand-Roll

| Problem                    | Don't Build             | Use Instead                       | Why                                              |
| -------------------------- | ----------------------- | --------------------------------- | ------------------------------------------------ |
| Import path updates        | Manual find-and-replace | IDE refactoring + `npm run build` | Build will catch every broken import             |
| File move tracking         | `cp` + `rm`             | `git mv`                          | Preserves file history in git                    |
| Verifying no broken routes | Manual browser testing  | `npm run build`                   | TypeScript compilation catches all import errors |

**Key insight:** `npm run build` is the definitive verification tool for this phase. Every structural change must pass build before proceeding. TypeScript strict mode with the `@/*` alias means broken imports are compile-time errors, not runtime surprises.

## Common Pitfalls

### Pitfall 1: Route Group Layout Conflicts

**What goes wrong:** Creating a `layout.tsx` inside a route group that conflicts with existing per-route layouts (double-wrapping).
**Why it happens:** Developer assumes route groups need their own layout.
**How to avoid:** Only create group-level layouts if they provide genuinely shared UI (sidebar, header). In this codebase, all existing layouts are metadata-only -- they stay per-route.
**Warning signs:** Pages render with unexpected wrapper elements or duplicate metadata.

### Pitfall 2: Breaking the Landing Page Redirect

**What goes wrong:** The root `page.tsx` (landing page at `/`) has special middleware logic that redirects authenticated users to `/home`. Moving `page.tsx` into a route group could break this if the file path changes.
**Why it happens:** Root `page.tsx` must remain at `src/app/page.tsx` (or `src/app/(marketing)/page.tsx`). The URL path `/` doesn't change with route groups, but the file must be the group's root page.
**How to avoid:** Place landing page `page.tsx` inside `(marketing)/` as the root page. Verify middleware still redirects `/` correctly.
**Warning signs:** Authenticated users see the landing page instead of `/home`.

### Pitfall 3: Windows/Linux Path Case Sensitivity

**What goes wrong:** File moves on Windows (case-insensitive) may not be detected by git or may cause issues on Linux CI/deployment (case-sensitive).
**Why it happens:** `git mv` on Windows may silently handle case changes differently.
**How to avoid:** Keep existing casing conventions. This codebase uses PascalCase for components and kebab-case for directories -- maintain this consistently. Use two-step rename if changing case: `git mv File.tsx file-temp.tsx && git mv file-temp.tsx file.tsx`.
**Warning signs:** Build passes locally on Windows but fails on Vercel (Linux).

### Pitfall 4: Colocating Components That Are Actually Shared

**What goes wrong:** Moving a component into a route's `_components/` folder when it's imported by other routes, breaking those imports.
**Why it happens:** Import graph not fully analyzed before moving.
**How to avoid:** For every component targeted for colocation, grep for all imports first. Only colocate if imported from a single route tree.
**Warning signs:** Build errors after moving a component to `_components/`.

### Pitfall 5: Quiz Components Cross-Route Dependency

**What goes wrong:** Moving all quiz components to `(marketing)/quiz/_components/` without realizing `EnhancedRecommendationCard` is also imported by `dashboard/DashboardLightTool.tsx`.
**Why it happens:** Quiz looks route-specific but has one cross-route dependency.
**How to avoid:** Either keep `EnhancedRecommendationCard` in shared `components/`, or move it to the quiz `_components/` and update the dashboard import (since dashboard already imports from `@/components/quiz/`). Best approach: keep quiz components in shared `components/quiz/` since they're used by both quiz and dashboard.
**Warning signs:** Dashboard page fails to render after quiz component move.

### Pitfall 6: Editor Components Cross-Route Dependency

**What goes wrong:** Moving all editor components to `write/_components/` without realizing `MarkdownPreview` is imported by the admin `ArticlePreviewModal`.
**Why it happens:** Editor looks route-specific to `/write` but admin uses MarkdownPreview.
**How to avoid:** Keep `components/editor/` as shared -- it's used by both `/write` and `/admin` routes.
**Warning signs:** Admin article preview breaks after editor component move.

## Code Examples

### Moving a Route into a Route Group

```bash
# Create route group directory
mkdir -p src/app/(marketing)

# Move route into group (preserves git history)
git mv src/app/about src/app/(marketing)/about

# URL /about still works -- (marketing) is invisible to routing
npm run build  # Verify
```

### Creating a \_components Folder for Colocation

```bash
# Dashboard already has colocated components at root level
# Move them into a proper _components folder
mkdir -p src/app/(dashboard)/dashboard/_components
git mv src/app/dashboard/DashboardLightTool.tsx src/app/(dashboard)/dashboard/_components/
git mv src/app/dashboard/DashboardOverview.tsx src/app/(dashboard)/dashboard/_components/
git mv src/app/dashboard/DashboardProfile.tsx src/app/(dashboard)/dashboard/_components/
git mv src/app/dashboard/DashboardSettings.tsx src/app/(dashboard)/dashboard/_components/

# Update imports in dashboard/page.tsx:
# Old: import DashboardOverview from './DashboardOverview'
# New: import DashboardOverview from './_components/DashboardOverview'
```

### Grouping Flat lib/ Files

```typescript
// Before: src/lib/sitemap-utils.ts, src/lib/structured-data.ts, src/lib/opengraph.ts, src/lib/twitter-cards.ts, src/lib/metadata.ts
// After: src/lib/seo/sitemap-utils.ts, src/lib/seo/structured-data.ts, etc.

// Create barrel export for convenience:
// src/lib/seo/index.ts
export { createMetadata, createProtectedPageMetadata } from './metadata';
export { generateSitemap } from './sitemap-utils';
// ... etc
```

## Discretion Recommendations

### Auth Route Group Placement

**Recommendation: Separate `(auth)` group.**

Rationale: Auth routes (`/auth/signin`, `/auth/signup`, etc.) are neither marketing nor dashboard. They serve a transitional purpose (unauthenticated -> authenticated). A dedicated `(auth)` group keeps them isolated. Place `access-denied` here too since it's part of the auth flow.

### Mixed-Audience Route Placement

Based on actual auth patterns in middleware-utils.ts:

| Route               | Auth Required? | Recommendation | Rationale                                       |
| ------------------- | -------------- | -------------- | ----------------------------------------------- |
| `/` (landing)       | No             | (marketing)    | Public landing page, redirects auth users       |
| `/about`            | No             | (marketing)    | Public informational page                       |
| `/articles`         | No             | (marketing)    | Public listing; no auth required                |
| `/articles/[slug]`  | No             | (marketing)    | Public article view; no auth required           |
| `/library`          | No             | (marketing)    | Public library listing; not in authRequired     |
| `/quiz/*`           | No             | (marketing)    | In publicRoutes; not in authRequired            |
| `/home`             | Yes            | (dashboard)    | In authRequired; user's personalized feed       |
| `/dashboard/*`      | Yes            | (dashboard)    | In authRequired; user dashboard                 |
| `/profile`          | Yes (implicit) | (dashboard)    | Own profile page requires auth                  |
| `/profile/[handle]` | No             | (marketing)    | Public profile view; not in authRequired        |
| `/write`            | Yes            | (dashboard)    | In authRequired; article creation               |
| `/suggest-resource` | No             | (marketing)    | Public form; not in authRequired                |
| `/cookies`          | No             | (marketing)    | Public legal page                               |
| `/privacy`          | No             | (marketing)    | Public legal page                               |
| `/terms`            | No             | (marketing)    | Public legal page                               |
| `/preview`          | No (implicit)  | (dashboard)    | Article preview; logically part of writing flow |
| `/admin/*`          | Yes + role     | (admin)        | In roleRequired; admin only                     |

### Component Colocation Analysis

Based on import graph analysis:

**Strong colocation candidates (single-route imports):**

| Component Group         | Current Location        | Imported By                      | Recommendation                                     |
| ----------------------- | ----------------------- | -------------------------------- | -------------------------------------------------- |
| `home/*` (10 files)     | `components/home/`      | Only `app/home/page.tsx`         | Colocate to `(dashboard)/home/_components/`        |
| `resources/*` (2)       | `components/resources/` | `suggest-resource` + `library`   | Keep shared (used by 2 routes in different groups) |
| Dashboard colocated (4) | `app/dashboard/*.tsx`   | Only `dashboard/page.tsx`        | Move to `_components/` subfolder                   |
| Article colocated (3)   | `app/articles/[slug]/`  | Only `articles/[slug]/page.tsx`  | Move to `_components/` subfolder                   |
| Profile colocated (2)   | `app/profile/[handle]/` | Only `profile/[handle]/page.tsx` | Move to `_components/` subfolder                   |
| Preview colocated (1)   | `app/preview/`          | Only `preview/page.tsx`          | Move to `_components/` subfolder                   |

**Keep shared (multi-route imports):**

| Component Group    | Imported By                                               | Decision                                |
| ------------------ | --------------------------------------------------------- | --------------------------------------- |
| `articles/*` (14)  | articles, home, dashboard, profile, preview, write, admin | Stay shared                             |
| `editor/*` (13)    | write page + admin ArticlePreviewModal                    | Stay shared                             |
| `quiz/*` (11)      | quiz routes + dashboard DashboardLightTool                | Stay shared                             |
| `affiliate/*` (5)  | library page + quiz components                            | Stay shared                             |
| `admin/*` (10)     | Only admin routes                                         | Colocate to (admin)/admin/\_components/ |
| `seo/*` (5)        | layout, about, cookies, privacy, terms, articles, admin   | Stay shared                             |
| `newsletter/*` (4) | about, articles, library, suggest-resource                | Stay shared                             |
| `effects/*` (13)   | about, suggest-resource, library                          | Stay shared                             |
| `auth/*` (6)       | layout, various pages                                     | Stay shared                             |

**Revised colocation count:** ~27 files (admin 10 + home 10 + existing colocated 10 that need \_components subfolder + preview 1) -- down from the original 51 estimate because editor, quiz, and affiliate are cross-route.

### Hooks Location

**Recommendation: Keep `src/hooks/` at current location.**

Rationale: `src/hooks/` is already well-established with 8 hooks imported from multiple locations. The `src/lib/hooks/` directory is empty (cleaned in Phase 3). No consolidation needed -- just keep `src/hooks/`.

### Contexts Location

**Recommendation: Keep `src/contexts/` at current location.**

Rationale: All 4 contexts (Auth, Notification, Theme, Toast) are app-wide. The current flat structure with 4 files is clean and needs no reorganization. This is a standard Next.js pattern.

### Fonts Location

**Recommendation: Keep `src/fonts/` (or remove it).**

Rationale: The directory only contains a README.md. All fonts are loaded via `next/font/google` in `src/app/layout.tsx`. The directory is vestigial. Could be removed but that's a Phase 3-level cleanup, not Phase 4 scope.

### File Casing

**Recommendation: Maintain existing conventions. No changes.**

Current conventions are consistent:

- Components: PascalCase (`ArticleCard.tsx`)
- Directories: kebab-case (`affiliate-library/`, `seo-tools/`)
- Hooks: camelCase with `use` prefix (`useDebounce.ts`)
- Lib files: kebab-case (`middleware-utils.ts`)

Changing casing is high-risk on Windows and low-value. Leave as-is.

### Move Strategy

**Recommendation: Incremental, by route group, with build verification at each step.**

Order:

1. Create route groups (`(marketing)`, `(auth)`, `(dashboard)`, `(admin)`)
2. Move routes into groups (one group at a time, build after each)
3. Create `_components/` folders and move colocated components
4. Move admin-specific components from `src/components/admin/` to `(admin)/admin/_components/`
5. Move home-specific components from `src/components/home/` to `(dashboard)/home/_components/`
6. Reorganize `lib/` flat files into subdirectories
7. Final build + lint verification

### Path Alias

**Recommendation: Keep `@/*` mapping `./src/*` -- no changes needed.**

The existing alias is the standard Next.js convention. No additional aliases are warranted. All imports use `@/` consistently.

### Lib Folder Organization

**Recommendation: Group related flat files; keep existing subdirectories.**

Proposed new groupings for the 25 root files:

| New Directory    | Files to Move                                                                                                                                    | Rationale                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `lib/seo/`       | metadata.ts, sitemap-utils.ts, structured-data.ts, opengraph.ts, twitter-cards.ts                                                                | All SEO-related               |
| `lib/affiliate/` | affiliate.ts, affiliate-integration.ts                                                                                                           | Related pair                  |
| `lib/mail/`      | mailchimp.ts, mailchimp-errors.ts                                                                                                                | Related pair                  |
| `lib/content/`   | markdown.ts, html-to-markdown.ts, reading-time.ts, article-status.ts                                                                             | Content processing pipeline   |
| Keep at root     | supabase.ts, utils.ts, session-manager.ts, font-performance.ts, optimized-imports.ts, performance-monitor.ts, resourcePreloader.ts, analytics.ts | Foundational/standalone files |

## State of the Art

| Old Approach                    | Current Approach              | When Changed | Impact                              |
| ------------------------------- | ----------------------------- | ------------ | ----------------------------------- |
| Flat `app/` with no grouping    | Route groups by audience      | Next.js 13+  | Better organization, shared layouts |
| All components in `components/` | Colocation with `_components` | Next.js 13+  | Components near their usage         |
| Pages Router `pages/`           | App Router `app/`             | Next.js 13   | Already migrated in this codebase   |

**Deprecated/outdated:**

- `components/` folder at root level for route-specific components -- should be colocated
- No route groups -- modern Next.js apps use them for organization

## Open Questions

1. **`components/errors/` vs `components/error-handling/`**
   - What we know: `errors/` has 1 file (ChunkErrorBoundary), `error-handling/` has 17 files
   - What's unclear: Whether ChunkErrorBoundary should be merged into error-handling/ or kept separate
   - Recommendation: Merge into error-handling/ during this phase as a minor cleanup. Low risk.

2. **`/preview` route placement**
   - What we know: Used during article writing to preview content. Not in authRequired but logically part of the writing flow.
   - What's unclear: Whether it's used by unauthenticated users
   - Recommendation: Place in `(dashboard)` since it's part of the write flow. If this breaks for unauthenticated preview links, it can be moved.

3. **`/profile/[handle]` vs `/profile`**
   - What we know: `/profile` (own profile) likely requires auth. `/profile/[handle]` (public profile) does not.
   - What's unclear: Whether these should be in the same route group
   - Recommendation: Keep both in `(marketing)` since public profile must be accessible. The own-profile `/profile` page handles auth client-side via `useAuth()`.

## Sources

### Primary (HIGH confidence)

- Context7 `/vercel/next.js/v14.3.0-canary.87` - route groups, private folders, project structure conventions
- Codebase analysis - all 11 layout.tsx files, all page.tsx files, middleware.ts, middleware-utils.ts, tsconfig.json
- Phase 1 audit `.planning/phases/01-pre-flight-audit-setup/01-folder-structure.md` - complete file inventory

### Secondary (MEDIUM confidence)

- Import graph analysis via grep -- all `from '@/components/*'` patterns verified for cross-route usage

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - no new libraries, pure structural changes
- Architecture: HIGH - route groups and colocation are well-documented Next.js patterns, verified via Context7
- Pitfalls: HIGH - all pitfalls identified from actual codebase analysis (cross-route dependencies found via import grep)

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable -- Next.js 14 conventions are mature)
