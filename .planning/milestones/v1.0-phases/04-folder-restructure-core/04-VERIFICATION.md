---
phase: 04-folder-restructure-core
verified: 2026-02-18T23:30:00Z
status: human_needed
score: 7/7 must-haves verified
human_verification:
  - test: 'Run npm run build from project root'
    expected: 'Zero TypeScript errors, build succeeds with no failures'
    why_human: 'Cannot execute build process programmatically in this environment; all import paths and file structures look correct but build is the definitive validator'
  - test: 'Run npm run lint from project root'
    expected: 'Zero new lint errors or warnings introduced by restructure'
    why_human: 'Cannot execute lint process programmatically; one pre-existing TODO comment found in PendingArticlesList.tsx but no new lint issues expected'
  - test: 'Navigate to /home, /dashboard, /admin/dashboard, /articles in browser (dev or production build)'
    expected: 'All routes resolve and render correctly with no 404s or blank pages'
    why_human: 'Route group resolution requires runtime verification; file paths confirmed correct but Next.js route group behavior needs runtime confirmation'
  - test: 'Sign in and sign out via /auth/signin'
    expected: 'Auth flow completes, redirects work, middleware role checks enforce correctly'
    why_human: 'Middleware uses URL paths which were not changed, but session redirect behavior needs live testing'
---

# Phase 04: Folder Restructure - Core Verification Report

**Phase Goal:** Reorganize src folder to Next.js 14 App Router best practices with route groups and component colocation
**Verified:** 2026-02-18T23:30:00Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                    | Status   | Evidence                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | All page routes are organized into 4 audience-based route groups                         | VERIFIED | Confirmed: (marketing), (auth), (dashboard), (admin) all exist; no flat routes remain at src/app/ level                                                                           |
| 2   | All existing URL paths continue to resolve unchanged (route groups are URL-transparent)  | VERIFIED | Route groups use parentheses — invisible to Next.js router; middleware unchanged, checks pathname directly                                                                        |
| 3   | Route-specific components colocated in \_components folders next to their page.tsx files | VERIFIED | dashboard/\_components/, home/\_components/, articles/[slug]/\_components/, profile/[handle]/\_components/, preview/\_components/, admin/\_components/ all exist and are imported |
| 4   | Components used by 2+ routes remain in shared src/components/ directory                  | VERIFIED | CommunityGrowth, FinalCTA, HeroNewsletterCTA remain in src/components/home/ and imported by both (marketing)/page.tsx and (dashboard)/home; admin/ deleted from shared            |
| 5   | lib/ root files organized into domain subdirectories (seo/, affiliate/, mail/, content/) | VERIFIED | All 13 files confirmed at new paths: seo/ (5 files), affiliate/ (2 files), mail/ (2 files), content/ (4 files)                                                                    |
| 6   | All import paths updated to reference new locations — zero old paths remain              | VERIFIED | Grep for all old paths (@/lib/metadata, @/lib/markdown, @/lib/mailchimp, @/lib/structured-data, @/components/admin/) returns zero matches                                         |
| 7   | Root layout and middleware work unchanged                                                | VERIFIED | layout.tsx remains at src/app/layout.tsx and wraps children correctly; middleware.ts uses pathname unchanged                                                                      |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact                                                             | Expected                                            | Status   | Details                                                                        |
| -------------------------------------------------------------------- | --------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `src/app/(marketing)/page.tsx`                                       | Landing page at / inside marketing route group      | VERIFIED | 399 lines, substantive: full landing page with Orb, StickyScroll, CTA sections |
| `src/app/(auth)/auth/signin/page.tsx`                                | Sign-in page at /auth/signin inside auth group      | VERIFIED | File exists and is substantive                                                 |
| `src/app/(dashboard)/dashboard/page.tsx`                             | Dashboard page at /dashboard inside dashboard group | VERIFIED | 205 lines, imports from ./\_components/DashboardOverview etc., fully wired     |
| `src/app/(admin)/admin/page.tsx`                                     | Admin page at /admin inside admin group             | VERIFIED | File exists and is substantive                                                 |
| `src/app/(dashboard)/dashboard/_components/DashboardOverview.tsx`    | Dashboard overview colocated                        | VERIFIED | File exists in \_components, imported by dashboard/page.tsx                    |
| `src/app/(dashboard)/home/_components/HomeFeed.tsx`                  | Home feed colocated with home route                 | VERIFIED | File exists, imported by home/page.tsx as `'./_components/HomeFeed'`           |
| `src/app/(admin)/admin/_components/articles/PendingArticlesList.tsx` | Admin articles component colocated                  | VERIFIED | File exists, imported by articles/pending/page.tsx via @/ absolute path        |
| `src/app/(marketing)/articles/[slug]/_components/ArticleContent.tsx` | Article content colocated with article slug route   | VERIFIED | File exists in \_components/                                                   |
| `src/lib/seo/metadata.ts`                                            | SEO utilities grouped together                      | VERIFIED | File exists, imported by sitemap.ts, layout files, article pages               |
| `src/lib/content/markdown.ts`                                        | Content processing grouped together                 | VERIFIED | File exists, 12 imports across codebase via @/lib/content/                     |
| `src/lib/affiliate/affiliate.ts`                                     | Affiliate utilities grouped together                | VERIFIED | File exists at src/lib/affiliate/affiliate.ts                                  |
| `src/lib/mail/mailchimp.ts`                                          | Mail utilities grouped together                     | VERIFIED | File exists, 10 imports via @/lib/mail/ across newsletter API routes           |

### Key Link Verification

| From                                     | To                                            | Via                                      | Status | Details                                                                                                                                |
| ---------------------------------------- | --------------------------------------------- | ---------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `middleware.ts`                          | URL paths (/admin, /dashboard, /home, /write) | pathname matching (unchanged)            | WIRED  | Middleware uses `request.nextUrl.pathname` directly; unchanged from pre-restructure                                                    |
| `src/app/layout.tsx`                     | all route groups                              | root layout wraps all children           | WIRED  | RootLayout renders `{children}` inside AppProviders — wraps all route groups                                                           |
| `src/app/(dashboard)/dashboard/page.tsx` | src/app/(dashboard)/dashboard/\_components/   | relative imports `./_components/`        | WIRED  | Imports DashboardOverview, DashboardProfile, DashboardSettings, DashboardLightTool from `./_components/`                               |
| `src/app/(dashboard)/home/page.tsx`      | src/app/(dashboard)/home/\_components/        | relative import `./_components/HomeFeed` | WIRED  | `import HomeFeed from './_components/HomeFeed'` confirmed in file                                                                      |
| `src/app/(admin)/admin/**/page.tsx`      | src/app/(admin)/admin/\_components/           | @/ absolute imports                      | WIRED  | dashboard/page.tsx, pending/page.tsx, featured/articles, featured/tools, library/add all import from @/app/(admin)/admin/\_components/ |
| `src/lib/optimized-imports.ts`           | @/app/(admin)/admin/\_components/             | dynamic imports updated                  | WIRED  | All 3 dynamic imports updated: PendingArticlesList, FeaturedToolsManager, FeaturedArticlesManager                                      |
| `src/app/sitemap.ts`                     | src/lib/seo/metadata.ts                       | @/lib/seo/metadata import                | WIRED  | `import { DEFAULT_METADATA } from '@/lib/seo/metadata'`                                                                                |
| `src/app/(marketing)/page.tsx`           | src/components/home/ (3 shared files)         | lazy imports @/components/home/          | WIRED  | CommunityGrowth, FinalCTA, HeroNewsletterCTA imported via @/components/home/                                                           |

### Requirements Coverage

| Requirement | Source Plans                 | Description                                                                        | Status    | Evidence                                                                                                                                                                                                                                                  |
| ----------- | ---------------------------- | ---------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STRUCT-01   | 04-01-PLAN.md                | Reorganize src/ to follow Next.js 14 App Router best practices with route groups   | SATISFIED | 4 route groups created: (marketing), (auth), (dashboard), (admin); all flat routes moved; no remnants                                                                                                                                                     |
| STRUCT-02   | 04-02-PLAN.md                | Colocate route-specific components with their pages (private \_components folders) | SATISFIED | \_components/ folders confirmed for: dashboard, home, articles/[slug], profile/[handle], preview, admin                                                                                                                                                   |
| STRUCT-03   | 04-02-PLAN.md, 04-03-PLAN.md | Organize shared components into logical groups (ui/, layout/, features/)           | SATISFIED | src/components/ now contains only truly shared components organized into: ui/, layout/, auth/, articles/, forms/, seo/, newsletter/, notifications/, providers/, quiz/, resources/, effects/, editor/, chat/, affiliate/, errors/, home/ (3 shared files) |
| STRUCT-04   | 04-03-PLAN.md                | Structure lib/ with clear separation (services/, utils/, types/, hooks/)           | SATISFIED | 4 new domain subdirs: seo/ (5 files), affiliate/ (2 files), mail/ (2 files), content/ (4 files); existing auth/, api/, cache/, services/, types/, validation/ untouched                                                                                   |

**Notes on REQUIREMENTS.md cross-reference:**

REQUIREMENTS.md maps STRUCT-01, STRUCT-02, STRUCT-03, STRUCT-04 to Phase 4. All four are claimed across the three plans and all four are satisfied by verified codebase evidence. STRUCT-05 (standardize import paths) and STRUCT-06 (update all import references after file moves) are mapped to Phase 5 in REQUIREMENTS.md — they are NOT claimed by any Phase 4 plan and are therefore not in scope for this verification. No orphaned requirements detected.

### Anti-Patterns Found

| File                                                                 | Line | Pattern                                                        | Severity | Impact                                                                                                              |
| -------------------------------------------------------------------- | ---- | -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/app/(admin)/admin/_components/articles/PendingArticlesList.tsx` | 108  | TODO comment                                                   | Info     | Pre-existing `// TODO: Add support for these filters in the API` — not related to restructure, no functional impact |
| `src/app/(admin)/admin/articles/pending/page.tsx`                    | 336  | `console.log('Export pending articles')` inside button onClick | Warning  | Pre-existing incomplete export feature — not introduced by this phase                                               |

No stub implementations or placeholder components found. All moved components are substantive with real logic. No `return null`, `return {}`, or `return <>` stubs detected in any moved files. No old `@/components/admin/` or flat `@/lib/metadata` import paths remain anywhere in `src/`.

### Human Verification Required

#### 1. Build Verification

**Test:** Run `npm run build` from project root
**Expected:** Zero TypeScript errors, build completes successfully, all pages generate static params correctly
**Why human:** Cannot execute the build process in this environment. All file paths, import references, and TypeScript types have been verified statically but only the build compiler can confirm zero TypeScript errors end-to-end.

#### 2. Lint Verification

**Test:** Run `npm run lint` from project root
**Expected:** Zero new lint errors or warnings compared to pre-phase baseline
**Why human:** Cannot execute ESLint in this environment.

#### 3. Route Resolution

**Test:** Open browser at `/home`, `/dashboard`, `/admin/dashboard`, `/articles`, `/auth/signin`, `/profile/your-handle`
**Expected:** All routes load and render correctly with no 404 responses or blank pages
**Why human:** Route group resolution (parentheses folders) is a Next.js runtime behavior. File structure matches Next.js conventions but runtime router behavior requires live testing.

#### 4. Authentication Flow

**Test:** Sign out, visit `/dashboard`, expect redirect to `/auth/signin`. Sign in, expect redirect to `/home`. Visit `/admin` as a non-admin user, expect redirect to `/access-denied`.
**Expected:** All auth redirects and role checks work correctly
**Why human:** Middleware operates on URL paths (unchanged), but the end-to-end session cookie + redirect flow needs real browser + Supabase session to verify.

### Gaps Summary

No automated gaps found. All seven observable truths are verified, all twelve required artifacts exist and are substantive, all eight key links are wired, and all four phase requirements are satisfied with codebase evidence.

The four human verification items are standard sanity checks that require a running Next.js process. They are not expected to fail — all the underlying conditions (correct file paths, correct import strings, unchanged middleware logic, unchanged tsconfig aliases) have been confirmed programmatically.

---

## Detailed Findings

### STRUCT-01: Route Groups (Plan 04-01)

The following flat routes were confirmed ABSENT from `src/app/` (confirming successful moves):

- `src/app/admin/` — GONE (moved to `src/app/(admin)/admin/`)
- `src/app/articles/` — GONE (moved to `src/app/(marketing)/articles/`)
- `src/app/home/` — GONE (moved to `src/app/(dashboard)/home/`)
- `src/app/dashboard/` — GONE (moved to `src/app/(dashboard)/dashboard/`)
- `src/app/auth/` — GONE (moved to `src/app/(auth)/auth/`)
- `src/app/profile/` — GONE (split: [handle] to marketing, page.tsx to dashboard)

The following files correctly REMAIN at `src/app/` root (not in route groups):

- `layout.tsx`, `error.tsx`, `not-found.tsx`, `globals.css`, `sitemap.ts`, `robots.ts`, `api/` directory

Profile split confirmed: `src/app/(marketing)/profile/[handle]/` and `src/app/(dashboard)/profile/page.tsx` both exist.

### STRUCT-02: Component Colocation (Plan 04-02)

All `_components` folders verified:

- `src/app/(dashboard)/dashboard/_components/` — 4 files: DashboardLightTool, DashboardOverview, DashboardProfile, DashboardSettings
- `src/app/(dashboard)/home/_components/` — 7 files: EnhancedArticleCard, FeaturedArticleCard, FeaturedArticlesCarousel, FeaturedToolCard, FeaturedToolsCarousel, HomeFeed, LeaderboardArticleCard
- `src/app/(dashboard)/preview/_components/` — 1 file: PreviewContent
- `src/app/(marketing)/articles/[slug]/_components/` — 3 files: ArticleContent, ArticlePageContent, ClientWrapper
- `src/app/(marketing)/profile/[handle]/_components/` — 2 files: ClientWrapper, ProfilePageContent
- `src/app/(admin)/admin/_components/` — FeaturedArticlesManager, FeaturedToolsManager
- `src/app/(admin)/admin/_components/dashboard/` — ComprehensiveDashboardStats, RealtimeDashboardStats
- `src/app/(admin)/admin/_components/library/` — LibraryImageUpload, LibraryItemForm
- `src/app/(admin)/admin/_components/articles/` — ArticlePreviewModal, BulkActionsToolbar, PendingArticlesList

`src/components/admin/` confirmed ABSENT (removed after migration).

### STRUCT-03: Shared Component Organization (Plans 04-02, 04-03)

`src/components/home/` retains exactly 3 files (confirmed): CommunityGrowth.tsx, FinalCTA.tsx, HeroNewsletterCTA.tsx — all are imported by `src/app/(marketing)/page.tsx`.

Shared `src/components/` is organized into: affiliate/, articles/, auth/, chat/, editor/, effects/, errors/, forms/, home/ (3 files), layout/, newsletter/, notifications/, providers/, quiz/, resources/, seo/, ui/ — plus ProblemSolution.tsx at root. All logical groups established.

### STRUCT-04: Lib Organization (Plan 04-03)

All 13 files confirmed at new subdirectory paths. Old flat paths verified absent (0 grep matches for each):

- `@/lib/metadata` — 0 matches (now `@/lib/seo/metadata`)
- `@/lib/sitemap-utils` — 0 matches
- `@/lib/structured-data` — 0 matches
- `@/lib/opengraph` — 0 matches
- `@/lib/twitter-cards` — 0 matches
- `@/lib/affiliate` (flat) — 0 matches
- `@/lib/mailchimp` (flat) — 0 matches
- `@/lib/markdown` — 0 matches
- `@/lib/article-status` — 0 matches
- `@/components/admin/` — 0 matches

New subdirectory usage confirmed active:

- `@/lib/seo/` — 23 import occurrences across 23 files
- `@/lib/content/` — 12 import occurrences across 11 files
- `@/lib/mail/` — 10 import occurrences across 9 files
- `@/lib/affiliate/` — 1 import occurrence (affiliate-library API route)

tsconfig.json `@/*: ["./src/*"]` unchanged — correct, as all files remain under `src/` and no alias update was needed.

---

_Verified: 2026-02-18T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
