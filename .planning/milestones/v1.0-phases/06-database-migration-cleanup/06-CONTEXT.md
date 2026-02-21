# Phase 6: Database & Migration Cleanup - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean up Supabase migration files and remove redundant root-level SQL scripts. Audit migration history, remove obsolete files, document what remains. Zero schema changes — no ALTER TABLE, no new columns, no RLS policy changes. The live database is untouched; this is file-level cleanup only.

</domain>

<decisions>
## Implementation Decisions

### Migration audit criteria

- Claude's discretion on identifying and removing clearly redundant/superseded migrations
- Claude's discretion on whether to keep granular history or squash where safe
- Unknown which migrations were applied to production vs test-only — Claude should investigate
- Claude's discretion on whether remote DB comparison adds value for this cleanup

### Root SQL file handling

- Claude evaluates each root-level .sql file and removes what's clearly obsolete
- Claude decides whether to preserve useful one-off SQL (e.g., move to supabase/scripts/) or delete
- User might use some SQL files for local dev (e.g., add_test_items.sql) — unclear which
- **Ambiguous SQL files must be flagged for user review as a checkpoint** — don't auto-delete files the user might actively use

### Documentation depth

- Claude determines appropriate documentation depth based on migration complexity
- Claude picks the most natural location for migration docs based on project conventions
- Claude decides whether supabase config files (config.toml, etc.) warrant cleanup

### Safety boundaries

- Claude determines appropriate verification method (build-only vs schema snapshot diff)
- Claude decides whether migration tracking table cleanup is safe and beneficial
- Local Supabase availability unknown — Claude should check if configured
- Claude assesses risk per problematic migration and handles accordingly (fix if safe, flag if risky)

### Claude's Discretion

User gave broad discretion across all four areas. Key constraints that ARE locked:

1. **Zero schema changes** — absolute constraint, no exceptions
2. **Flag ambiguous root SQL files** — checkpoint for user review before deletion
3. **Git history preserves everything** — deletions are recoverable, so lean toward removing clutter
4. **No production DB modifications** — file-level cleanup only

</decisions>

<specifics>
## Specific Ideas

No specific requirements — user trusts Claude's judgment on implementation approach. The guiding principle from earlier phases: "Trust judgment on deletion" (from Phase 3 decision) applies here too.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 06-database-migration-cleanup_
_Context gathered: 2026-02-19_
