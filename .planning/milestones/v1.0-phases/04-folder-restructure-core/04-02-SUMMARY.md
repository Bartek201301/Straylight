---
phase: 04-folder-restructure-core
plan: 02
subsystem: infra
tags:
  [
    next-app-router,
    component-colocation,
    _components-convention,
    folder-structure,
  ]

# Dependency graph
requires:
  - phase: 04-folder-restructure-core
    plan: 01
    provides: Audience-based route groups for colocation targets
provides:
  - Route-specific components colocated in _components folders next to their page.tsx files
  - Admin components colocated with admin routes (no longer in shared src/components/admin/)
  - Home-only components colocated with home route (7 of 10 moved)
  - Shared components directory contains only truly multi-route components
affects: [05-component-colocation, 07-client-server-boundary]

# Tech tracking
tech-stack:
  added: []
  patterns: [_components-colocation-convention, route-scoped-components]

key-files:
  created:
    - src/app/(dashboard)/dashboard/_components/DashboardOverview.tsx
    - src/app/(dashboard)/home/_components/HomeFeed.tsx
    - src/app/(admin)/admin/_components/articles/PendingArticlesList.tsx
    - src/app/(marketing)/articles/[slug]/_components/ArticleContent.tsx
  modified:
    - src/app/(dashboard)/dashboard/page.tsx
    - src/app/(dashboard)/home/page.tsx
    - src/app/(dashboard)/preview/page.tsx
    - src/app/(marketing)/articles/[slug]/page.tsx
    - src/app/(marketing)/profile/[handle]/page.tsx
    - src/app/(admin)/admin/dashboard/page.tsx
    - src/app/(admin)/admin/featured/articles/page.tsx
    - src/app/(admin)/admin/featured/tools/page.tsx
    - src/app/(admin)/admin/library/add/page.tsx
    - src/app/(admin)/admin/articles/pending/page.tsx
    - src/lib/optimized-imports.ts

key-decisions:
  - 'Home components split: 7 route-only moved to _components, 3 shared (CommunityGrowth, FinalCTA, HeroNewsletterCTA) kept in src/components/home/'
  - 'Admin imports use @/ absolute paths (not relative) since admin sub-pages are nested at varying depths'
  - 'ChunkErrorBoundary left in src/components/errors/ (no error-handling dir exists, single file not worth new dir)'

patterns-established:
  - '_components convention: route-specific components go in _components/ subfolder next to page.tsx'
  - 'Cross-group component imports use @/ absolute paths pointing into _components/ folders'

requirements-completed: [STRUCT-02, STRUCT-03]

# Metrics
duration: 9min
completed: 2026-02-18
---

# Phase 04 Plan 02: Component Colocation Summary

**Route-specific components colocated into \_components folders across dashboard, articles, profile, preview, home, and admin routes with shared components preserved**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-18T22:09:29Z
- **Completed:** 2026-02-18T22:18:11Z
- **Tasks:** 2
- **Files modified:** 37 (14 in Task 1, 23 in Task 2)

## Accomplishments

- Colocated 10 already-in-app route components into proper \_components folders (dashboard, articles/[slug], profile/[handle], preview)
- Moved 7 home-only components from src/components/home/ to home/\_components/ while preserving 3 shared components
- Moved all 9 admin components from src/components/admin/ to admin/\_components/ (with dashboard, library, articles subdirectories)
- Updated src/lib/optimized-imports.ts dynamic imports to reference new admin component locations
- Build passes with zero errors after all moves

## Task Commits

Each task was committed atomically:

1. **Task 1: Colocate already-in-app route-specific components into \_components folders** - `4f9d13a` (feat)
2. **Task 2: Move home and admin components from shared components/ to colocated \_components/** - `f98523b` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

**Task 1 - Route component colocation:**

- `src/app/(dashboard)/dashboard/_components/` - DashboardOverview, DashboardProfile, DashboardSettings, DashboardLightTool
- `src/app/(marketing)/articles/[slug]/_components/` - ArticleContent, ArticlePageContent, ClientWrapper
- `src/app/(marketing)/profile/[handle]/_components/` - ClientWrapper, ProfilePageContent
- `src/app/(dashboard)/preview/_components/` - PreviewContent
- Updated page.tsx imports in dashboard, articles/[slug], profile/[handle], preview routes
- Updated cross-group imports in DashboardProfile.tsx and PreviewContent.tsx

**Task 2 - Shared to colocated migration:**

- `src/app/(dashboard)/home/_components/` - HomeFeed, FeaturedArticleCard, FeaturedArticlesCarousel, FeaturedToolCard, FeaturedToolsCarousel, EnhancedArticleCard, LeaderboardArticleCard
- `src/app/(admin)/admin/_components/` - FeaturedArticlesManager, FeaturedToolsManager
- `src/app/(admin)/admin/_components/dashboard/` - ComprehensiveDashboardStats, RealtimeDashboardStats
- `src/app/(admin)/admin/_components/library/` - LibraryImageUpload, LibraryItemForm
- `src/app/(admin)/admin/_components/articles/` - ArticlePreviewModal, BulkActionsToolbar, PendingArticlesList
- `src/lib/optimized-imports.ts` - Updated 3 dynamic imports to new admin paths
- Removed empty `src/components/admin/` directory tree

## Decisions Made

- **Home component split:** 7 components used only by /home route moved to colocation. 3 components (CommunityGrowth, FinalCTA, HeroNewsletterCTA) also imported by the landing page remain in src/components/home/ as shared.
- **Admin import style:** Used @/ absolute imports for admin components since admin sub-pages are at varying depths (dashboard/page.tsx, articles/pending/page.tsx, etc.), making relative paths inconsistent.
- **ChunkErrorBoundary:** Left in src/components/errors/ since no error-handling directory exists and creating one for a single file would not improve organization.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated cross-group import in DashboardProfile.tsx**

- **Found during:** Task 1
- **Issue:** DashboardProfile imported ProfilePageContent from `@/app/(marketing)/profile/[handle]/ProfilePageContent` which broke when file moved to \_components/
- **Fix:** Updated to `@/app/(marketing)/profile/[handle]/_components/ProfilePageContent`
- **Files modified:** src/app/(dashboard)/dashboard/\_components/DashboardProfile.tsx
- **Committed in:** 4f9d13a

**2. [Rule 1 - Bug] Updated cross-group import in PreviewContent.tsx**

- **Found during:** Task 1
- **Issue:** PreviewContent imported ArticleContent from `@/app/(marketing)/articles/[slug]/ArticleContent` which broke when file moved to \_components/
- **Fix:** Updated to `@/app/(marketing)/articles/[slug]/_components/ArticleContent`
- **Files modified:** src/app/(dashboard)/preview/\_components/PreviewContent.tsx
- **Committed in:** 4f9d13a

---

**Total deviations:** 2 auto-fixed (2 bugs from component moves)
**Impact on plan:** Both fixes necessary for build to pass. Cross-group imports had to be updated alongside the component moves. No scope creep.

## Issues Encountered

- Windows PowerShell required `-LiteralPath` for paths with parentheses and brackets. Resolved by using PowerShell scripts with explicit LiteralPath parameters.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All route-specific components now colocated with their routes
- src/components/ now contains only truly shared components: articles, auth, chat, editor, effects, errors, forms, home (3 shared), layout, newsletter, notifications, providers, quiz, resources, seo, ui, ProblemSolution.tsx
- Ready for Phase 5 (if applicable) or remaining Phase 4 plans
- STRUCT-02 (route-specific colocation) and STRUCT-03 (shared component organization) requirements satisfied

---

## Self-Check: PASSED

- FOUND: src/app/(dashboard)/dashboard/\_components/DashboardOverview.tsx
- FOUND: src/app/(dashboard)/home/\_components/HomeFeed.tsx
- FOUND: src/app/(admin)/admin/\_components/articles/PendingArticlesList.tsx
- FOUND: .planning/phases/04-folder-restructure-core/04-02-SUMMARY.md
- FOUND: commit 4f9d13a
- FOUND: commit f98523b

_Phase: 04-folder-restructure-core_
_Completed: 2026-02-18_
