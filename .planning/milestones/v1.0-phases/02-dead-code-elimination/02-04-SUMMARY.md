---
phase: 02-dead-code-elimination
plan: 04
subsystem: infra
tags: [npm, dependencies, dead-code, commented-code, audit]

# Dependency graph
requires:
  - phase: 02-03
    provides: Unused exports eliminated, 7 unused dependencies removed from package.json
provides:
  - Extraneous packages pruned from node_modules
  - npm audit safe fixes applied (17 to 14 vulnerabilities)
  - All commented-out dead imports removed from 4 source files
  - Phase 2 dead code elimination fully complete
affects: [03-scratchpad-cleanup, 07-bundle-optimization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'npm prune after dependency removal to clean node_modules'
    - 'npm audit fix for safe (non-breaking) vulnerability patches only'

key-files:
  created: []
  modified:
    - package-lock.json
    - src/app/about/page.tsx
    - src/app/write/page.tsx
    - src/components/admin/articles/PendingArticlesList.tsx
    - src/components/articles/ArticlesPageContent.tsx

key-decisions:
  - 'All 6 target dependencies already removed by 02-03 -- Task 1 focused on pruning node_modules and npm audit'
  - 'npm audit fix applied safe patches (markdown-it, mdast-util-to-hast, next minor, qs) reducing vulns from 17 to 14'
  - 'Remaining 14 audit vulns require breaking changes (eslint 4.x, next 16.x, supabase/ssr 0.8.0) -- documented for future action'
  - 'Removed commented-out Aurora JSX block from about/page.tsx since Aurora component was deleted in prior plans'

patterns-established:
  - 'Remaining npm audit vulnerabilities are all in transitive dependencies requiring major version bumps -- track for Phase 7 or dedicated maintenance'

requirements-completed: [DEAD-04, DEAD-05]

# Metrics
duration: 5min
completed: 2026-02-18
---

# Phase 2 Plan 4: Dependency Pruning and Commented-Out Code Cleanup Summary

**Pruned extraneous node_modules, applied safe npm audit fixes (17 to 14 vulns), and removed 7 commented-out dead imports from 4 source files**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-18T15:17:36Z
- **Completed:** 2026-02-18T15:22:12Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Pruned 9 extraneous packages from node_modules (removed from package.json in 02-03 but not cleaned from disk)
- Applied npm audit fix: patched markdown-it, mdast-util-to-hast, next, qs -- reduced vulnerabilities from 17 to 14
- Removed 7 commented-out dead import lines from 4 source files (about/page.tsx, write/page.tsx, PendingArticlesList.tsx, ArticlesPageContent.tsx)
- Removed commented-out Aurora JSX block from about/page.tsx (component was deleted in Plan 02-01)
- Verified all 6 TODO/FIXME comments preserved across codebase
- Build, lint, and TypeScript compilation all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Prune extraneous packages and apply npm audit fixes** - `b902be7` (chore)
2. **Task 2: Remove commented-out dead code from 4 source files** - `092e6d7` (feat)

## Files Created/Modified

- `package-lock.json` - Updated by npm prune and npm audit fix
- `src/app/about/page.tsx` - Removed commented-out Link/Aurora imports and Aurora JSX block
- `src/app/write/page.tsx` - Removed commented-out MobileEditorToolbar and ArticleStatusNotification imports
- `src/components/admin/articles/PendingArticlesList.tsx` - Removed commented-out getSupabaseAdmin import
- `src/components/articles/ArticlesPageContent.tsx` - Removed commented-out Aurora import

## Decisions Made

- All 6 target dependencies (class-variance-authority, motion, remark, @tailwindcss/aspect-ratio, @tailwindcss/forms, is-ci) were already removed from package.json by Plan 02-03. Task 1 adapted to focus on pruning node_modules and running npm audit.
- Applied only safe npm audit fixes (non-breaking). Remaining 14 vulnerabilities require breaking major version bumps and are documented for future action.
- Removed the commented-out Aurora JSX block (lines 63-66 in about/page.tsx) beyond the 6 known imports, since Aurora was a deleted component -- this is dead code, not an explanatory comment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted Task 1 for already-removed dependencies**

- **Found during:** Task 1 (dependency removal)
- **Issue:** All 6 dependencies listed for removal were already removed from package.json by Plan 02-03's knip --fix
- **Fix:** Skipped npm uninstall (no-op). Ran npm prune to clean extraneous packages from node_modules, then npm audit fix for safe patches.
- **Files modified:** package-lock.json
- **Verification:** `npm ls` confirms all 6 packages show empty (not found). Build passes.
- **Committed in:** b902be7

---

**Total deviations:** 1 auto-fixed (1 blocking adaptation)
**Impact on plan:** Necessary adaptation since 02-03 already handled dependency removal. All plan objectives still achieved.

## Issues Encountered

- npm audit fix exit code 1 is normal when remaining vulnerabilities exist that require `--force` (breaking changes). The safe fixes were still applied successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 (Dead Code Elimination) is now fully complete
- All 4 plans executed: component deletion, file deletion, export elimination, dependency/code cleanup
- Ready to proceed to Phase 3 (Scratchpad Cleanup)
- Remaining npm audit vulnerabilities (14) tracked for future maintenance

## Self-Check: PASSED

- FOUND: package-lock.json
- FOUND: src/app/about/page.tsx
- FOUND: src/app/write/page.tsx
- FOUND: src/components/admin/articles/PendingArticlesList.tsx
- FOUND: src/components/articles/ArticlesPageContent.tsx
- FOUND: .planning/phases/02-dead-code-elimination/02-04-SUMMARY.md
- FOUND: commit b902be7
- FOUND: commit 092e6d7

---

_Phase: 02-dead-code-elimination_
_Completed: 2026-02-18_
