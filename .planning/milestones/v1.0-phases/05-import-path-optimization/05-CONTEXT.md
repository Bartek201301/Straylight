# Phase 5: Import Path Optimization - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Standardize all import paths to use `@/` aliases consistently and fix any broken imports from Phase 4 folder restructure. No new capabilities, no code changes beyond import path updates. Build must pass at end of phase.

</domain>

<decisions>
## Implementation Decisions

### Relative import threshold

- Claude's discretion on sibling imports (./Component) vs always @/ — pick best convention based on codebase patterns
- Claude's discretion on \_components folder imports — pick based on Next.js conventions
- Claude's discretion on ESLint rule enforcement — decide based on project complexity
- Claude's discretion on additional tsconfig path aliases beyond @/ — decide based on codebase size

### Barrel export handling

- Claude's discretion on which barrel files to remove vs keep — assess each for tree-shaking impact
- Claude's discretion on direct file imports vs barrel imports — pick based on actual usage patterns
- Claude's discretion on auditing external package barrel dependencies — check during research

### Broken import strategy

- Manual updates only for import fixes — no batch scripts, fix each import by hand
- Build verification required in Phase 5 — `npm run build` must pass, don't carry broken imports forward
- Claude's discretion on case-sensitivity checking — handle as part of import fixing process
- Claude's discretion on detection approach (build-first vs systematic scan)

### Dynamic import paths

- Claude's discretion on auditing next/dynamic and React.lazy calls — scan during research, include if found
- Claude's discretion on string-based path references — identify during research
- Claude's discretion on CSS/Tailwind content paths — check and include if needed

### Claude's Discretion

- Relative import convention (sibling ./imports vs always @/)
- \_components import style (relative from page vs @/ aliases)
- Whether to add ESLint rule for import convention enforcement
- Additional tsconfig path aliases beyond @/
- Barrel file removal strategy (all vs selective)
- Detection approach for broken imports
- Case-sensitivity verification approach
- Dynamic import and string-based path auditing
- CSS/Tailwind config path updates

</decisions>

<specifics>
## Specific Ideas

- Manual import updates only — no batch scripts for high-frequency changes
- Build must pass at end of Phase 5 (not deferred to Phase 9)
- STATE.md already notes case-sensitivity risk between Windows dev and Linux production — worth addressing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 05-import-path-optimization_
_Context gathered: 2026-02-19_
