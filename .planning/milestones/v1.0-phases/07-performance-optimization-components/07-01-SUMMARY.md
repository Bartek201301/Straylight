---
phase: 07-performance-optimization-components
plan: 01
subsystem: infra
tags: [eslint, bundle-size, baseline-metrics, use-client, next-build]

# Dependency graph
requires:
  - phase: 05-import-cleanup
    provides: ESLint config with no-restricted-imports rule
provides:
  - Baseline build metrics (per-route first-load JS sizes)
  - ESLint no-restricted-syntax guard rule preventing use-client pollution
  - 118 identified use-client optimization candidates
affects: [07-02, 07-03, 07-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [eslint-no-restricted-syntax-guard, baseline-before-optimize]

key-files:
  created:
    - .planning/phases/07-performance-optimization-components/build-before.log
  modified:
    - .eslintrc.json

key-decisions:
  - 'ESLint no-restricted-syntax at warn level (not error) to allow incremental cleanup'
  - '118 files identified with use-client outside exempt directories -- optimization targets for plans 02-04'
  - 'Stale .next cache caused false build failures -- cleared before baseline capture'

patterns-established:
  - 'ESLint guard rule: no-restricted-syntax warns on use-client in non-exempt dirs'
  - 'Exempt directories: contexts, hooks, providers, effects, editor, forms, auth'

requirements-completed: [PERF-01, PERF-03]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 07 Plan 01: Baseline Metrics and ESLint Guard Summary

**Baseline build captured (851kB shared JS, 118 use-client files flagged) with ESLint no-restricted-syntax guard rule preventing future client directive pollution**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T18:33:04Z
- **Completed:** 2026-02-19T18:36:43Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Captured full baseline build log with per-route first-load JS sizes for before/after comparison
- Added ESLint no-restricted-syntax guard rule that warns on `'use client'` outside exempt directories
- Identified 118 files as use-client optimization candidates for subsequent plans

### Key Baseline Metrics

| Route                  | First Load JS |
| ---------------------- | ------------- |
| `/` (marketing)        | 910 kB        |
| `/articles`            | 908 kB        |
| `/articles/[slug]`     | 909 kB        |
| `/home` (dashboard)    | 914 kB        |
| `/dashboard`           | 921 kB        |
| `/write` (editor)      | 918 kB        |
| `/admin/dashboard`     | 910 kB        |
| Shared JS (all routes) | 851 kB        |

## Task Commits

Each task was committed atomically:

1. **Task 1: Capture baseline build metrics and add ESLint use-client guard rule** - `a138be3` (feat)

## Files Created/Modified

- `.eslintrc.json` - Added no-restricted-syntax rule with overrides for exempt directories
- `.planning/phases/07-performance-optimization-components/build-before.log` - Full build output with per-route JS sizes

## Decisions Made

- ESLint rule set to warn (not error) to allow incremental optimization without blocking builds
- Seven directories exempted from use-client warning: contexts, hooks, providers, effects, editor, forms, auth
- Stale `.next` cache had to be cleared before build would pass (pre-existing issue, not caused by this plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleared stale .next cache causing build failure**

- **Found during:** Task 1 (Baseline build capture)
- **Issue:** Initial build failed with PageNotFoundError for 13 API routes that exist on disk -- stale `.next` cache
- **Fix:** Deleted `.next` directory and re-ran build
- **Files modified:** None (cache directory only)
- **Verification:** Build passed with exit code 0
- **Committed in:** a138be3 (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to complete baseline capture. No scope creep.

## Issues Encountered

None beyond the stale cache issue documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Baseline metrics captured for before/after comparison across all optimization work
- ESLint guard rule active and verified (118 warnings = optimization target list)
- Ready for plan 02 (component-level use-client extraction)

---

_Phase: 07-performance-optimization-components_
_Completed: 2026-02-19_

## Self-Check: PASSED

- [x] `.eslintrc.json` exists with no-restricted-syntax rule
- [x] `build-before.log` exists with route sizes
- [x] `07-01-SUMMARY.md` exists
- [x] Commit `a138be3` exists in git history
