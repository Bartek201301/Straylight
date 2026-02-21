# Phase 9: Final Validation - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify zero functional regression through comprehensive testing of all critical paths after the entire refactor (Phases 1-8). No new features, no code changes — pure validation and reporting.

</domain>

<decisions>
## Implementation Decisions

### Testing scope & method

- Both automated and manual validation: automated checks first, then manual spot-check of key interactions
- Claude decides route coverage strategy (full crawl vs critical paths) based on what changed
- One-time validation script (not kept in repo) for automated checks
- Test against local production build (npm run build + npm start), not Vercel preview

### Auth & security validation

- Claude decides which user roles to test based on what middleware protects
- Test accounts already exist for all roles — no setup needed
- Claude decides RLS verification method (browser-based vs direct SQL)
- Skip CVE-2025-29927 middleware bypass test — middleware logic wasn't changed

### Regression acceptance criteria

- Claude judges visual differences — flag significant visual regressions, ignore minor spacing tweaks
- Claude decides fix strategy based on severity — critical fixes inline, minor issues batched
- Lint warnings must be ZERO (not baseline 387 — clean slate required)
- TypeScript errors must be same or fewer than baseline (baseline was 0, so effectively zero)

### Metrics comparison

- Primary success indicator: file/LOC reduction (the main win of this refactor)
- Re-run the exact Phase 1 baseline metrics script for apples-to-apples comparison
- Claude judges bundle size trade-offs — small increase acceptable if codebase dramatically cleaner
- Create a before/after summary report documenting all improvements

### Claude's Discretion

- Route coverage strategy (full crawl vs critical paths)
- Which user roles to test and RLS verification approach
- Visual regression severity threshold
- Regression fix strategy (inline vs batched)
- Bundle size tolerance threshold

</decisions>

<specifics>
## Specific Ideas

- User wants zero lint warnings as a final cleanup milestone — not just "no new warnings"
- The file/LOC reduction is the headline metric — the summary report should highlight this prominently
- Metrics script from Phase 1 (scripts/) should be reused for consistency

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 09-final-validation_
_Context gathered: 2026-02-19_
