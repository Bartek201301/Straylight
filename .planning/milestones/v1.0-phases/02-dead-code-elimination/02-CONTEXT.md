# Phase 2: Dead Code Elimination - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove 30-40% of unused code to reduce migration surface area before folder restructuring. This includes unused files, unused exports from active files, unused npm dependencies, and commented-out dead code blocks. No new code is added, no behavior changes, no dependency upgrades (except safe audit fixes).

</domain>

<decisions>
## Implementation Decisions

### Deletion confidence threshold

- **Verify each file individually** before deleting — do not bulk-delete based on Knip output alone
- For each Knip-flagged file, **grep the entire codebase for the filename** to catch dynamic imports, string-based references, and config file usage
- **Same rigor for unused exports** — grep for each export name across the codebase before removing
- **Batch deletions by category** (components, utils, services, types, etc.) — remove one category at a time with build checks between batches

### Dependency removal strategy

- **DevDependencies first, then runtime** — remove devDeps, build-check, then tackle runtime dependencies
- **Cross-check all config files** before removing any package — check next.config.js, tailwind.config.js, postcss.config.js, tsconfig.json, and any other config files for references
- After removal, **run npm audit** to flag vulnerabilities in remaining deps
- **Fix safe audit findings** (non-breaking, no major version bumps) in this phase; document the rest for later

### Commented-out code handling

- **Review each commented block individually** — no blanket removal
- **No specific files** called out for special treatment — apply same rules everywhere
- TODO/FIXME comment handling: Claude's discretion based on volume and relevance

### Claude's Discretion

- Distinguishing dead code comments from useful explanatory comments (use judgment per case)
- Whether to collect TODO/FIXME comments into a summary doc or leave in place
- Revert strategy when deletions break the build (single file vs entire batch, based on failure nature)
- Git commit granularity (per category vs per plan, based on batch size and risk)

</decisions>

<specifics>
## Specific Ideas

- Phase 1 Knip diagnostic found 105 unused files and 8 duplicate exports — this is the starting input
- Phase 1 baseline: 403 files, 107K LOC, 387 lint warnings
- 51 route-specific component files (28%) were flagged as Phase 4 colocation candidates — these are NOT dead code, they move in Phase 4

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

### Verification checkpoints

- After each category batch: **build passes** (npm run build), **lint clean** (npm run lint), **TypeScript clean** (tsc --noEmit)
- End-of-phase verification: build + lint pass (skip full metrics comparison until later phases)
- Metrics comparison script NOT required per batch — just build/lint/TS checks

---

_Phase: 02-dead-code-elimination_
_Context gathered: 2026-02-17_
