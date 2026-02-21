---
phase: 04-folder-restructure-core
plan: 03
subsystem: infra
tags: [file-organization, lib-restructure, imports, domain-boundaries]

# Dependency graph
requires: []
provides:
  - 'src/lib/seo/ subdirectory with 5 SEO utility files'
  - 'src/lib/affiliate/ subdirectory with 2 affiliate utility files'
  - 'src/lib/mail/ subdirectory with 2 mailchimp utility files'
  - 'src/lib/content/ subdirectory with 4 content processing files'
  - 'All imports across 37 files updated to new subdirectory paths'
affects: [05-colocate-route-components, 06-naming-conventions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    ['Domain-grouped lib/ subdirectories: seo/, affiliate/, mail/, content/']

key-files:
  created:
    - src/lib/seo/metadata.ts
    - src/lib/seo/sitemap-utils.ts
    - src/lib/seo/structured-data.ts
    - src/lib/seo/opengraph.ts
    - src/lib/seo/twitter-cards.ts
    - src/lib/affiliate/affiliate.ts
    - src/lib/affiliate/affiliate-integration.ts
    - src/lib/mail/mailchimp.ts
    - src/lib/mail/mailchimp-errors.ts
    - src/lib/content/markdown.ts
    - src/lib/content/html-to-markdown.ts
    - src/lib/content/reading-time.ts
    - src/lib/content/article-status.ts
  modified:
    - src/app/sitemap.ts
    - src/app/robots.ts
    - src/app/(admin)/admin/layout.tsx
    - src/app/(admin)/admin/seo-tools/page.tsx
    - src/app/(admin)/admin/seo-tools/opengraph/page.tsx
    - src/app/(admin)/admin/seo-tools/schema/page.tsx
    - src/app/(admin)/admin/seo-tools/sitemap/page.tsx
    - src/app/(auth)/auth/forgot-password/layout.tsx
    - src/app/(auth)/auth/reset-password/layout.tsx
    - src/app/(auth)/auth/signin/layout.tsx
    - src/app/(auth)/auth/signup/layout.tsx
    - src/app/(auth)/auth/verify-email/layout.tsx
    - src/app/(dashboard)/dashboard/layout.tsx
    - src/app/(dashboard)/dashboard/articles/page.tsx
    - src/app/(dashboard)/write/page.tsx
    - src/app/(dashboard)/preview/PreviewContent.tsx
    - src/app/(marketing)/articles/page.tsx
    - src/app/(marketing)/articles/[slug]/page.tsx
    - src/app/(marketing)/articles/[slug]/ClientWrapper.tsx
    - src/app/(marketing)/suggest-resource/layout.tsx
    - src/app/api/og/route.ts
    - src/app/api/twitter-card/route.ts
    - src/app/api/affiliate-library/route.ts
    - src/app/api/newsletter/subscribe/route.ts
    - src/app/api/newsletter/webhook/route.ts
    - src/app/api/newsletter/tags/route.ts
    - src/app/api/newsletter/test/route.ts
    - src/app/api/newsletter/tags/categories/route.ts
    - src/app/api/newsletter/resend-confirmation/route.ts
    - src/app/api/newsletter/subscribe-double-optin/route.ts
    - src/app/api/newsletter/config/route.ts
    - src/app/api/newsletter/confirm/route.ts
    - src/components/seo/SitemapValidator.tsx
    - src/components/seo/StructuredData.tsx
    - src/components/seo/StructuredDataValidator.tsx
    - src/components/seo/OpenGraphPreview.tsx
    - src/components/seo/TwitterCardPreview.tsx
    - src/components/editor/ArticleEditor.tsx
    - src/components/home/EnhancedArticleCard.tsx
    - src/components/home/FeaturedArticleCard.tsx
    - src/components/admin/articles/ArticlePreviewModal.tsx
    - src/components/articles/ArticleCard.tsx

key-decisions:
  - 'Foundational files (supabase.ts, utils.ts, session-manager.ts, etc.) stay at lib/ root'
  - 'Hooks at src/hooks/ and contexts at src/contexts/ remain untouched per research recommendation'
  - 'Existing lib subdirectories (auth, api, cache, etc.) left untouched'

patterns-established:
  - 'Domain grouping: related lib utilities organized by domain (seo, affiliate, mail, content)'
  - 'Import convention: @/lib/{domain}/{file} for domain-grouped utilities'

requirements-completed: [STRUCT-04, STRUCT-03]

# Metrics
duration: 12min
completed: 2026-02-18
---

# Phase 04 Plan 03: Lib Folder Reorganization Summary

**13 flat lib/ files organized into 4 domain subdirectories (seo, affiliate, mail, content) with 46 import updates across 37 files**

## Performance

- **Duration:** 12 min
- **Tasks:** 1
- **Files created:** 13 (in new subdirectories)
- **Files modified:** 41 (import path updates)

## Accomplishments

- Created 4 logical subdirectories under src/lib/: seo/ (5 files), affiliate/ (2 files), mail/ (2 files), content/ (4 files)
- Updated 46 import references across 37 files to point to new subdirectory paths
- Fixed relative import in affiliate-integration.ts (types/ path adjusted for new depth)
- Build and lint pass with zero new errors or warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Group lib/ flat files into seo/, affiliate/, mail/, content/ subdirectories** - `8bf7c8f` (feat)

## Files Created/Modified

**New subdirectories:**

- `src/lib/seo/` - SEO metadata, sitemap, structured data, OpenGraph, Twitter Cards utilities
- `src/lib/affiliate/` - Affiliate link injection and integration utilities
- `src/lib/mail/` - Mailchimp newsletter management and error handling
- `src/lib/content/` - Markdown processing, HTML conversion, reading time, article status

**Files remaining at lib/ root (unchanged):**

- `supabase.ts`, `utils.ts`, `session-manager.ts`, `font-performance.ts`, `optimized-imports.ts`, `performance-monitor.ts`, `resourcePreloader.ts`, `analytics.ts`

## Decisions Made

- Foundational files kept at lib/ root for direct access pattern consistency
- Hooks (src/hooks/) and contexts (src/contexts/) left in place per research recommendation
- All existing lib subdirectories (auth/, api/, cache/, constants/, errors/, services/, types/, validation/, analytics/) left untouched

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed relative import path in affiliate-integration.ts**

- **Found during:** Task 1 (affiliate group file move)
- **Issue:** affiliate-integration.ts imported from `'./types/affiliate-library'` which becomes invalid at new depth
- **Fix:** Changed to `'../types/affiliate-library'` to account for one level deeper nesting
- **Files modified:** src/lib/affiliate/affiliate-integration.ts
- **Verification:** Build passes, import resolves correctly
- **Committed in:** 8bf7c8f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for correct import resolution. No scope creep.

## Issues Encountered

None - plan executed smoothly after adjusting for route group path patterns in the actual filesystem.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Lib folder now has clear domain boundaries with 4 new subdirectories
- Import convention established: `@/lib/{domain}/{file}`
- Ready for subsequent phases that may reference these new paths

---

## Self-Check: PASSED

- All 13 created files verified present in new subdirectories (seo/5, affiliate/2, mail/2, content/4)
- Commit 8bf7c8f verified in git log
- No old import paths remain (grep verified)
- Build passes with zero TS errors

---

_Phase: 04-folder-restructure-core_
_Completed: 2026-02-18_
