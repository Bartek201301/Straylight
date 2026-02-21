# Phase 6: Database & Migration Cleanup - Research

**Researched:** 2026-02-19
**Domain:** Supabase migration file management and SQL script cleanup
**Confidence:** HIGH

## Summary

The local `supabase/migrations/` directory contains 42 SQL migration files using two incompatible naming conventions (sequential `001_*` through `035_*` and timestamp-based `20241203_*` / `20250906_*`). These local files are **completely disconnected from production**: the production `supabase_migrations.schema_migrations` table tracks 48 migrations, all with timestamp-based versions (20250906 and 20250909 series), and **none** match the local filenames by version number. This means the local migration files are historical artifacts -- they were likely applied manually via the Supabase SQL Editor (as documented in the README) and later superseded by dashboard-applied migrations. The entire local set of 42 files can be treated as documentation of schema evolution rather than executable migration history.

Additionally, the `supabase/` root contains 5 utility SQL files (`check_migrations_status.sql`, `schema_verification.sql`, `test_articles_table.sql`, `test_library_items_table.sql`, `test_votes_table.sql`, `test_affiliate_library_table.sql`) that are one-time verification/test scripts, not operational code. The production database also contains leftover artifacts from RLS monitoring/testing migrations (`rls_performance_metrics`, `rls_query_analysis`, `temp_view_backup_security_definer` tables, and 17 `rls_*`/`test_*` functions) -- but cleaning those up would require schema changes, which is out of scope.

**Primary recommendation:** Delete all 42 local migration files and 5 root-level SQL test/verification scripts. Replace with a single consolidated reference document of the current production schema state. The `supabase/README.md` also needs updating since it references the old manual-apply workflow.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Zero schema changes** -- absolute constraint, no exceptions
2. **Flag ambiguous root SQL files** -- checkpoint for user review before deletion
3. **Git history preserves everything** -- deletions are recoverable, so lean toward removing clutter
4. **No production DB modifications** -- file-level cleanup only

### Claude's Discretion

- Migration audit criteria: identifying redundant/superseded migrations, whether to keep granular history or simplify
- Root SQL file handling: evaluate each file, move useful ones to `supabase/scripts/` or delete
- Documentation depth: determine appropriate level and location for migration docs
- Safety boundaries: determine verification method, assess risk per file

### Deferred Ideas (OUT OF SCOPE)

None deferred.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID    | Description                                                                       | Research Support                                                                                                                                                                |
| ----- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB-01 | Audit supabase/migrations/ for redundant or obsolete migration files              | COMPLETE: All 42 local files audited. None match production migration history. Duplicate numbers found (025, 026 each have two files). Two naming conventions mixed.            |
| DB-02 | Remove root-level SQL files that are duplicated in migrations or no longer needed | COMPLETE: 5 root SQL files identified. All are one-time test/verification scripts. `check_migrations_status.sql` checks for tables that already exist. All are safe to remove.  |
| DB-03 | Verify all migrations still apply cleanly after cleanup                           | N/A in traditional sense. Local files are disconnected from production. Verification = `npm run build` succeeds + production schema unchanged (compare before/after snapshots). |

</phase_requirements>

## Standard Stack

Not applicable -- this phase involves no library installations. It is purely file deletion, documentation creation, and build verification.

### Tools Used

| Tool            | Purpose                                       | Why                                          |
| --------------- | --------------------------------------------- | -------------------------------------------- |
| Supabase MCP    | Query production migration table, list tables | Verify which migrations are actually applied |
| `npm run build` | Verify no code references deleted files       | Build-time verification                      |
| `npm run lint`  | Confirm no lint issues post-cleanup           | Quality gate                                 |
| git             | Track deletions, enable recovery if needed    | Safety net                                   |

## Architecture Patterns

### Current Local Migration File Layout

```
supabase/
  migrations/
    001_create_users_table.sql          # Sequential naming (001-035)
    002_users_rls_policies.sql
    ...
    025_create_images_table.sql         # DUPLICATE NUMBER with next file
    025_migrate_to_like_system.sql      # DUPLICATE NUMBER with previous file
    026_complete_like_migration.sql     # DUPLICATE NUMBER with next file
    026_create_uploads_storage_bucket.sql # DUPLICATE NUMBER with previous file
    ...
    035_fix_function_search_paths.sql
    20241203_performance_functions.sql  # Timestamp naming (different convention)
    20241203_performance_indexes.sql
    20250906020200_migrate_extensions_to_schema.sql
    20250906020300_analyze_security_definer_views.sql
    20250906020400_fix_security_definer_views_phase1.sql
    20250906020500_fix_security_definer_views_phase2.sql
    20250906020600_fix_security_definer_views_phase3.sql
  check_migrations_status.sql           # Root utility SQL
  schema_verification.sql               # Root utility SQL
  test_affiliate_library_table.sql      # Root test SQL
  test_articles_table.sql               # Root test SQL
  test_library_items_table.sql          # Root test SQL
  test_votes_table.sql                  # Root test SQL
  README.md                             # Outdated manual-apply docs
  functions/                            # Edge functions (keep as-is)
  .temp/                                # CLI temp (keep as-is)
```

### Production Migration History (from `supabase_migrations.schema_migrations`)

48 migrations tracked, ALL timestamp-based:

- `20250906020150` through `20250906033534` (14 migrations, Sep 6)
- `20250909093327` through `20250909100905` (34 migrations, Sep 9)

**Key observation:** The 42 local files and 48 production records have ZERO overlap by version number. The local files were the "source" that was manually applied, then the production tracked them under different version numbers via the Supabase CLI or dashboard.

### Recommended Post-Cleanup Layout

```
supabase/
  migrations/          # Empty directory (or with .gitkeep)
  functions/           # Unchanged
  README.md            # Updated to reflect current state
  .temp/               # Unchanged
```

### Pattern: Safe File Deletion Approach

1. Take a schema snapshot of production (using `list_tables` MCP tool)
2. Delete local files (git tracks everything)
3. Run `npm run build` to verify no code imports these SQL files
4. Take another schema snapshot and diff (should be identical -- we changed no schema)
5. Update `supabase/README.md` to reflect current architecture

## Don't Hand-Roll

| Problem                    | Don't Build               | Use Instead                                  | Why                                     |
| -------------------------- | ------------------------- | -------------------------------------------- | --------------------------------------- |
| Schema snapshot comparison | Manual SQL queries        | `mcp__supabase__list_tables` + `execute_sql` | Consistent, repeatable, comprehensive   |
| Migration history check    | Manual file-by-file audit | Query `schema_migrations` table              | Single source of truth is the DB        |
| Build verification         | Manual file grep          | `npm run build`                              | TypeScript compiler catches all imports |

## Common Pitfalls

### Pitfall 1: Assuming Local Files Match Production

**What goes wrong:** Treating local migration files as the canonical migration history and trying to "fix" ordering or naming to match production.
**Why it happens:** The natural assumption is that `supabase/migrations/` drives the production schema. In this project, it does not -- migrations were applied manually via SQL Editor.
**How to avoid:** The production `schema_migrations` table is the single source of truth. Local files are historical documentation only.
**Warning signs:** Any attempt to "re-order" or "renumber" local files to match production is wasted effort.

### Pitfall 2: Accidentally Modifying Production Schema

**What goes wrong:** Running `supabase db push` or `apply_migration` during cleanup, which would alter the live database.
**Why it happens:** Testing whether migrations "apply cleanly" by actually running them.
**How to avoid:** This phase uses ZERO DDL operations. Verification is `npm run build` + schema snapshot comparison only.
**Warning signs:** Any SQL command that starts with CREATE, ALTER, DROP against the production DB.

### Pitfall 3: Deleting Edge Functions Alongside Migrations

**What goes wrong:** The `supabase/functions/` directory gets caught up in the "clean everything" mindset.
**Why it happens:** It sits next to the migrations directory and might look like cleanup target.
**How to avoid:** Edge functions are actively deployed and operational. They are completely out of scope.
**Warning signs:** Any modification to `supabase/functions/` contents.

### Pitfall 4: Outdated README Causing Confusion

**What goes wrong:** After deleting all migration files, the README still says "run migrations in order: 001-003 (users)..." which confuses future developers.
**Why it happens:** Forgetting to update documentation after file deletions.
**How to avoid:** Update `supabase/README.md` as part of the cleanup to reflect that migrations are managed via Supabase dashboard/CLI, not local files.

### Pitfall 5: Root SQL Files User Might Need

**What goes wrong:** Deleting a test SQL file the user actively uses for local development.
**Why it happens:** All root SQL files look like one-time scripts, but some might be regularly used.
**How to avoid:** Per user constraint, flag ambiguous files for review before deletion. Present a clear list with descriptions.

## Code Examples

Not applicable -- this phase involves no code changes, only file deletions and documentation updates.

### Verification Commands

```bash
# Pre-cleanup: capture schema state
# (Use Supabase MCP list_tables and execute_sql)

# Execute cleanup: delete files
git rm supabase/migrations/*.sql
git rm supabase/check_migrations_status.sql
git rm supabase/schema_verification.sql
git rm supabase/test_*.sql

# Post-cleanup: verify build
npm run build
npm run lint

# Post-cleanup: verify schema unchanged
# (Use same Supabase MCP queries, diff results)
```

## State of the Art

| Old Approach                            | Current Approach                     | When Changed | Impact                                                   |
| --------------------------------------- | ------------------------------------ | ------------ | -------------------------------------------------------- |
| Manual SQL files applied via SQL Editor | Supabase CLI with `supabase db push` | 2024+        | Local files became disconnected from production tracking |
| Sequential numbering (001*, 002*)       | Timestamp-based (YYYYMMDDHHMMSS\_)   | Standard     | Avoids conflicts in team environments                    |
| Root-level test SQL scripts             | Supabase MCP tools for verification  | 2025+        | No need for manual verification scripts                  |

## Detailed Findings

### Migration File Audit (42 files)

#### Sequential Migrations (001-035): All Superseded

All 35 files use sequential naming. They represent the original schema build-up:

| Range   | Purpose                             | Status                                                         |
| ------- | ----------------------------------- | -------------------------------------------------------------- |
| 001-003 | Users table, RLS, triggers          | Superseded by production migrations                            |
| 004-006 | Articles table, RLS, triggers       | Superseded                                                     |
| 007-009 | Library items table, RLS, triggers  | Superseded                                                     |
| 010-012 | Votes table, RLS, triggers          | Superseded                                                     |
| 013-014 | Affiliate library table, RLS        | Superseded                                                     |
| 015-018 | Notifications tables, RLS, triggers | Superseded                                                     |
| 019     | Search indexes                      | Superseded                                                     |
| 020     | Add rejected status to articles     | Superseded (enum value added)                                  |
| 021     | Add cover image to articles         | Superseded                                                     |
| 022     | Extend users for profiles           | Superseded                                                     |
| 023     | Fix get_user_total_likes function   | Superseded                                                     |
| 024     | Add featured content                | Superseded                                                     |
| 025a    | Create images table                 | DUPLICATE NUMBER -- superseded                                 |
| 025b    | Migrate to like system (enum add)   | DUPLICATE NUMBER -- superseded                                 |
| 026a    | Complete like migration             | DUPLICATE NUMBER -- superseded                                 |
| 026b    | Create uploads storage bucket       | DUPLICATE NUMBER -- superseded                                 |
| 027     | Expand affiliate item types         | Superseded                                                     |
| 028     | Add popular tags function           | Superseded                                                     |
| 029     | Add body_md to RPC functions        | Superseded                                                     |
| 030     | Optimize RLS policies               | Superseded by production `optimize_rls_policies_part1/part2`   |
| 031     | RLS performance indexes             | Superseded by production `rls_performance_indexes_corrected`   |
| 032     | RLS security functions              | Superseded by production `rls_security_functions` parts 1-4    |
| 033     | RLS monitoring system               | Superseded by production `rls_monitoring_system` parts 1-5     |
| 034     | RLS optimization testing            | Superseded by production `rls_testing_suite` parts 1-4         |
| 035     | Fix function search paths           | Superseded by production `fix_function_search_paths` parts 1-6 |

#### Timestamp Migrations (7 files): Partially Match Production

| File                                                   | Production Match?                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `20241203_performance_functions.sql`                   | NO direct match. Content applied as `performance_functions_dec2024` parts 1-5               |
| `20241203_performance_indexes.sql`                     | NO direct match. Content applied as `performance_indexes_dec2024` parts 1-4                 |
| `20250906020200_migrate_extensions_to_schema.sql`      | CLOSE: Production has `20250906025607_migrate_extensions_to_schema` (different timestamp)   |
| `20250906020300_analyze_security_definer_views.sql`    | CLOSE: Production has `20250906030306_analyze_security_definer_views` (different timestamp) |
| `20250906020400_fix_security_definer_views_phase1.sql` | CLOSE: Production has `20250906030504_fix_security_definer_views_phase1_corrected`          |
| `20250906020500_fix_security_definer_views_phase2.sql` | CLOSE: Production has `20250906030614_fix_security_definer_views_phase2`                    |
| `20250906020600_fix_security_definer_views_phase3.sql` | CLOSE: Production has `20250906030742_fix_security_definer_views_phase3`                    |

The timestamp-based files are earlier drafts of what was eventually applied to production with different timestamps and sometimes different names (e.g., "phase1" vs "phase1_corrected").

### Root SQL Files Audit (5 + README)

| File                               | Size   | Purpose                                            | Recommendation                                        |
| ---------------------------------- | ------ | -------------------------------------------------- | ----------------------------------------------------- |
| `check_migrations_status.sql`      | 3.8KB  | Checks if core tables exist (run in SQL Editor)    | DELETE -- tables exist, one-time script               |
| `schema_verification.sql`          | 10.1KB | Comprehensive schema verification with test data   | DELETE -- one-time verification, covered by MCP tools |
| `test_affiliate_library_table.sql` | 4.9KB  | Tests affiliate_library table structure and ops    | DELETE -- one-time test script                        |
| `test_articles_table.sql`          | 4.2KB  | Tests articles table structure and operations      | DELETE -- one-time test script                        |
| `test_library_items_table.sql`     | 7.6KB  | Tests library_items table structure and operations | DELETE -- one-time test script                        |
| `test_votes_table.sql`             | 9.3KB  | Tests votes table structure and operations         | DELETE -- one-time test script                        |
| `README.md`                        | 11.5KB | Documents old manual-apply workflow                | UPDATE -- rewrite to reflect current state            |

**CHECKPOINT for user:** All 5 root SQL files appear to be one-time verification/test scripts run in the Supabase SQL Editor. None appear to be used in automated workflows or local dev. However, per user constraint, these should be flagged for review before deletion. The user noted they "might use some SQL files for local dev" but was unsure which.

### Production DB Artifacts (OUT OF SCOPE but documented)

The production database contains cleanup-worthy artifacts from the RLS monitoring migrations:

- **Tables:** `rls_performance_metrics` (0 rows), `rls_query_analysis` (0 rows), `temp_view_backup_security_definer` (8 rows, marked "Can be dropped after verification")
- **Functions:** 17 RLS test/monitoring functions (e.g., `setup_rls_test_data`, `test_article_rls_security`, `rls_health_check`)

These are **out of scope** for this phase (zero schema changes constraint). They could be addressed in a future phase if desired.

### Other Supabase Directory Contents (Keep As-Is)

| Path                  | Contents                              | Action |
| --------------------- | ------------------------------------- | ------ |
| `supabase/functions/` | Edge functions (2 functions + shared) | KEEP   |
| `supabase/.temp/`     | CLI temp file                         | KEEP   |

## Open Questions

1. **Root SQL files user review**
   - What we know: All 5 files are verification/test scripts designed to run in SQL Editor
   - What's unclear: Whether the user actively uses any of them for local development
   - Recommendation: Present the list (above) as a checkpoint. Lean toward deletion since git preserves history, but get explicit confirmation per user constraint.

2. **Empty migrations directory vs removal**
   - What we know: After deleting all 42 files, the directory will be empty
   - What's unclear: Whether to keep an empty `supabase/migrations/` directory with `.gitkeep` for future use, or remove it entirely
   - Recommendation: Keep the directory with `.gitkeep`. Supabase CLI expects this directory to exist if the user ever wants to use `supabase db push` in the future.

3. **Production migration tracking table cleanup**
   - What we know: The 48 production migration records are valid but include many granular "part1", "part2" etc. entries from splitting large migrations
   - What's unclear: Whether this granularity causes any issues
   - Recommendation: Leave production migration tracking table as-is (out of scope per zero-schema-changes constraint). It works and causes no harm.

## Sources

### Primary (HIGH confidence)

- Supabase MCP `list_migrations` -- retrieved all 48 production migration records
- Supabase MCP `list_tables` -- retrieved complete production table schema
- Supabase MCP `execute_sql` -- queried `schema_migrations` table directly, queried views and RLS functions
- Direct file reads of all 42 migration files and 5 root SQL files in the repository

### Secondary (MEDIUM confidence)

- `supabase/README.md` -- documents the original manual-apply workflow, confirming migrations were applied via SQL Editor

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- no libraries involved, pure file operations
- Architecture: HIGH -- complete audit of all files with production comparison
- Pitfalls: HIGH -- based on direct evidence of local/production mismatch

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (stable -- file inventory won't change without commits)
