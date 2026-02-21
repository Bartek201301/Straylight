---
phase: 07-performance-optimization-components
plan: 03
subsystem: ui
tags: [next-dynamic, code-splitting, font-optimization, lazy-loading]

# Dependency graph
requires:
  - phase: 07-01
    provides: Baseline build metrics and ESLint guard
provides:
  - Dynamic import of TipTap editor on write page (ssr: false)
  - Dynamic import of 4 dashboard tab components
  - Dynamic import of CobeGlobe on about page (ssr: false)
  - Optimized Sora font weights (6 reduced to 4)
affects: [07-04, 09-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [next/dynamic for heavy client components, ssr false for browser-only libs]

key-files:
  created: []
  modified:
    - src/app/(dashboard)/write/page.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - src/app/layout.tsx
    - src/app/(marketing)/about/page.tsx

key-decisions:
  - 'Sora font weights reduced from 6 to 4 -- weight 300 (light) unused, weight 800 (extrabold) only used by Inter on auth pages'
  - 'CobeGlobe converted to dynamic import on about page (was statically imported, 15KB cobe dependency)'
  - 'Dashboard tab components use ssr: true (default) since no SSR issues; write page editor uses ssr: false due to TipTap browser APIs'

patterns-established:
  - 'Heavy editor components: always use next/dynamic with ssr: false'
  - 'Conditional tab content: use next/dynamic to load only active tab code'

requirements-completed: [PERF-02, PERF-04]

# Metrics
duration: 9min
completed: 2026-02-19
---

# Phase 7 Plan 3: Dynamic Imports and Font Optimization Summary

**TipTap editor and dashboard tabs converted to next/dynamic lazy loading, Sora font reduced from 6 to 4 weights**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-19T17:39:03Z
- **Completed:** 2026-02-19T17:48:05Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- TipTap editor (~2400 LOC, heavy @tiptap/\* deps) dynamically imported with ssr: false on write page
- All 4 dashboard tab components (722 LOC total) dynamically imported so only active tab code loads
- CobeGlobe (cobe, 15KB) converted from static to dynamic import on about page
- Sora font weights reduced from 6 (300-800) to 4 (400, 500, 600, 700), eliminating unused light and extrabold weights

## Task Commits

Each task was committed atomically:

1. **Task 1: Dynamic import TipTap editor on write page** - `82186b0` (feat)
2. **Task 2: Optimize Sora font weight configuration** - `9d4c17a` (feat)
3. **Task 3: Dynamic import dashboard tab components** - `b071f6e` (feat)

## Files Created/Modified

- `src/app/(dashboard)/write/page.tsx` - Static ArticleEditor import replaced with next/dynamic (ssr: false) and loading spinner fallback
- `src/app/(dashboard)/dashboard/page.tsx` - 4 static tab imports replaced with next/dynamic
- `src/app/layout.tsx` - Sora font weight array reduced from ['300','400','500','600','700','800'] to ['400','500','600','700']
- `src/app/(marketing)/about/page.tsx` - Static CobeGlobe import replaced with next/dynamic (ssr: false)

## Decisions Made

- Sora weight 300 (light) confirmed unused across entire codebase via grep audit -- safe to remove
- Sora weight 800 (extrabold) only used on auth pages (forgot-password, reset-password) which use Inter font, not Sora -- safe to remove from Sora config
- CobeGlobe on about page was statically imported despite being a heavy 3D globe component -- converted to dynamic as part of Task 1 scope (deviation Rule 2: missing optimization for heavy component)
- Orb component on marketing page already uses React.lazy -- no action needed, verified in place
- ArticleEditor uses forwardRef/useImperativeHandle but write page passes callbacks (onEditorReady) not refs -- dynamic import safe without special handling

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] CobeGlobe static import on about page**

- **Found during:** Task 1 (Dynamic import TipTap editor)
- **Issue:** Plan asked to check CobeGlobe import status. Found it statically imported on about page despite being a heavy 3D component (cobe, 15KB)
- **Fix:** Converted to next/dynamic with ssr: false
- **Files modified:** src/app/(marketing)/about/page.tsx
- **Verification:** npm run build passes
- **Committed in:** 82186b0 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical optimization)
**Impact on plan:** Plan explicitly requested checking CobeGlobe and converting if needed. Conversion was within expected scope.

## Issues Encountered

- Stale .next build cache caused ENOENT errors on multiple builds -- resolved by clearing .next directory before each build (known issue from STATE.md: "Stale .next cache must be cleared before builds after major restructuring")

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dynamic imports in place for all heavy client components
- Font payload optimized
- Ready for 07-04 (final optimization plan)

---

_Phase: 07-performance-optimization-components_
_Completed: 2026-02-19_

## Self-Check: PASSED

All 4 modified files verified on disk. All 3 task commits verified in git log.
