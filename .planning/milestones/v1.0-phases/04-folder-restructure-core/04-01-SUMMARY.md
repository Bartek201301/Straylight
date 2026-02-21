---
phase: 04-folder-restructure-core
plan: 01
subsystem: infra
tags: [next-app-router, route-groups, folder-structure]

# Dependency graph
requires:
  - phase: 03-scratchpad-cleanup
    provides: clean repository root with no scratchpad files
provides:
  - Audience-based route groups: (marketing), (auth), (dashboard), (admin)
  - Profile route split: public [handle] in (marketing), own-profile redirect in (dashboard)
  - All URL paths unchanged after restructure
affects: [04-02, 04-03, 05-component-colocation, 07-client-server-boundary]

# Tech tracking
tech-stack:
  added: []
  patterns: [audience-based-route-groups, profile-split-pattern]

key-files:
  created:
    - src/app/(marketing)/page.tsx
    - src/app/(auth)/auth/signin/page.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - src/app/(admin)/admin/page.tsx
  modified:
    - src/app/(dashboard)/dashboard/DashboardProfile.tsx
    - src/app/(dashboard)/preview/PreviewContent.tsx
    - src/app/(dashboard)/dashboard/articles/page.tsx
    - src/app/(dashboard)/write/page.tsx

key-decisions:
  - 'Profile split: public profile/[handle] in (marketing), own-profile redirect in (dashboard)'
  - 'Fixed pre-existing broken imports for @/lib/article-status and @/lib/markdown as blocking issues (Rule 3)'

patterns-established:
  - 'Route group convention: (marketing) for public, (auth) for auth flows, (dashboard) for authenticated users, (admin) for admin-only'
  - 'Cross-group imports use @/ absolute paths, never relative paths across route group boundaries'

requirements-completed: [STRUCT-01]

# Metrics
duration: 15min
completed: 2026-02-18
---

# Phase 04 Plan 01: Route Group Creation Summary

**All page routes organized into 4 audience-based Next.js route groups with profile split between (marketing) and (dashboard)**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-18T22:51:05Z
- **Completed:** 2026-02-18T23:06:07Z
- **Tasks:** 1
- **Files modified:** 42 new files staged (moves from flat structure into route groups)

## Accomplishments

- Created 4 route groups: (marketing), (auth), (dashboard), (admin) organizing all page routes by audience
- Split profile routes: public `profile/[handle]` in (marketing), own-profile redirect in (dashboard)
- Fixed broken cross-group imports caused by the directory restructure
- Build passes with all URL paths unchanged and middleware unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Create route groups and move all routes** - `cac503a` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/app/(marketing)/` - Public pages: articles, library, cookies, privacy, terms, quiz, suggest-resource, about, profile/[handle], landing page
- `src/app/(auth)/` - Auth flow pages: signin, signup, forgot-password, reset-password, verify-email, callback, confirmation-complete, access-denied
- `src/app/(dashboard)/` - Authenticated user pages: home, dashboard (with sub-components), profile, write, preview
- `src/app/(admin)/` - Admin pages: admin dashboard, articles, pending, featured, library, notifications, seo-tools
- `src/app/(dashboard)/dashboard/DashboardProfile.tsx` - Updated import from relative path to @/app/(marketing)/profile/[handle]/ProfilePageContent
- `src/app/(dashboard)/preview/PreviewContent.tsx` - Updated import from @/app/articles/[slug]/ArticleContent to @/app/(marketing)/...

## Decisions Made

- **Profile split pattern:** Public profile/[handle] goes to (marketing) since it's publicly viewable. Own-profile page (which just redirects to dashboard) goes to (dashboard) since it requires auth. No cross-imports between the two.
- **Cross-group import convention:** When a component in one route group needs to import from another (e.g., DashboardProfile importing ProfilePageContent from marketing), use `@/` absolute path rather than `../` relative path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed broken relative import in DashboardProfile.tsx**

- **Found during:** Task 1 (after profile split)
- **Issue:** DashboardProfile.tsx imported ProfilePageContent via `../profile/[handle]/ProfilePageContent` which broke when profile/[handle] moved to (marketing)
- **Fix:** Changed to absolute import `@/app/(marketing)/profile/[handle]/ProfilePageContent`
- **Files modified:** src/app/(dashboard)/dashboard/DashboardProfile.tsx
- **Verification:** Build passes
- **Committed in:** cac503a

**2. [Rule 1 - Bug] Fixed broken absolute import in PreviewContent.tsx**

- **Found during:** Task 1 (after articles moved to marketing)
- **Issue:** PreviewContent.tsx imported ArticleContent via `@/app/articles/[slug]/ArticleContent` which broke when articles moved to (marketing)
- **Fix:** Changed to `@/app/(marketing)/articles/[slug]/ArticleContent`
- **Files modified:** src/app/(dashboard)/preview/PreviewContent.tsx
- **Verification:** Build passes
- **Committed in:** cac503a

**3. [Rule 3 - Blocking] Fixed pre-existing broken imports for moved lib modules**

- **Found during:** Task 1 (build verification)
- **Issue:** `@/lib/article-status`, `@/lib/markdown`, `@/lib/html-to-markdown` were moved to `@/lib/content/` in plan 04-03, but some consuming files still referenced old paths
- **Fix:** Updated imports in dashboard/articles/page.tsx, write/page.tsx, and preview/PreviewContent.tsx to use `@/lib/content/` paths
- **Files modified:** src/app/(dashboard)/dashboard/articles/page.tsx, src/app/(dashboard)/write/page.tsx, src/app/(dashboard)/preview/PreviewContent.tsx
- **Verification:** Build passes
- **Committed in:** cac503a (linter auto-fixed the already-tracked copies; staged copies included correct paths)

---

**Total deviations:** 3 auto-fixed (2 bugs from route moves, 1 blocking pre-existing import issue)
**Impact on plan:** All auto-fixes necessary for build to pass. No scope creep.

## Issues Encountered

- Plan 04-03 was already executed before 04-01 (out of order), which meant some files were already at their route-group locations in git. This caused no functional issues but meant some files appeared as "already tracked" rather than new.
- `about` directory was tracked in git (unlike other src/app dirs which were untracked), requiring `git mv` instead of a regular move.
- PowerShell `Move-Item` had issues with `[handle]` bracket characters; resolved by using `-LiteralPath` flag.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Route group structure established, ready for plans 04-02 (layout colocation) and 04-03 (lib reorganization, already done)
- All 4 route groups in place for future component colocation in Phase 5
- No leftover directories outside route groups (except root layout, error, not-found, globals, robots, sitemap, and api/)

---

## Self-Check: PASSED

- FOUND: src/app/(marketing)/page.tsx
- FOUND: src/app/(auth)/auth/signin/page.tsx
- FOUND: src/app/(dashboard)/dashboard/page.tsx
- FOUND: src/app/(admin)/admin/page.tsx
- FOUND: commit cac503a
- FOUND: .planning/phases/04-folder-restructure-core/04-01-SUMMARY.md

_Phase: 04-folder-restructure-core_
_Completed: 2026-02-18_
