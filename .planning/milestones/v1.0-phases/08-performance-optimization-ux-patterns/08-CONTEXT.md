# Phase 8: Performance Optimization - UX Patterns - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Standardize loading and error states across all route segments for consistent UX. Add proper loading.tsx and error.tsx files, place Suspense boundaries for streaming. No data fetching changes — UI wrappers only.

</domain>

<decisions>
## Implementation Decisions

### Loading state design

- Skeleton screens (not spinners or shimmer effects)
- Route-specific vs generic skeleton design: Claude's discretion based on route complexity
- Reuse existing skeleton components or create fresh: Claude's discretion based on current codebase quality
- Loading visibility timing: Claude's discretion — choose whichever approach (only on slow loads vs always brief) works best for the project

### Error state behavior

- Error message style: Claude's discretion based on existing error components
- Error boundary placement granularity: Claude's discretion based on route risk assessment
- 404 page: Claude's discretion — evaluate current not-found.tsx, improve only if needed
- Error states use standard dark mode colors (neutral-\*, card-base) — same pattern as rest of site, no special warning accents

### Coverage scope

- Which routes get loading.tsx/error.tsx: Claude's discretion based on which routes benefit most
- Handling existing loading/error files: Claude's discretion — evaluate existing files, keep good ones, replace inconsistent ones
- Admin section polish level: Claude's discretion based on admin route complexity

### Suspense boundaries

- Page-level vs section-level Suspense: Claude's discretion per-route based on data fetch patterns
- Retrofitting Suspense to existing components: Claude's discretion based on impact vs effort
- **LOCKED: UI wrappers only** — do NOT modify data fetching logic. Add loading.tsx, error.tsx, and Suspense wrappers only. Zero functional regression is the core value.

### Claude's Discretion

Most implementation decisions are at Claude's discretion for this phase. The user trusts the builder to make the right calls based on codebase analysis. Key constraints:

- Skeleton screens (not spinners) for loading states
- Standard dark mode colors for error states (no warning accents)
- UI wrappers only — no data fetching changes
- Zero functional regression

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants Claude to evaluate the existing codebase and make the best implementation choices for consistency and quality.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 08-performance-optimization-ux-patterns_
_Context gathered: 2026-02-19_
