# Phase 3: Scratchpad & File Cleanup - Research

**Researched:** 2026-02-18
**Domain:** Repository hygiene / file deletion
**Confidence:** HIGH

## Summary

This phase involves deleting temporary documentation, completed task lists, and obsolete artifacts from the repository root and specific directories. The work is purely file deletion -- no functional code changes. The repository currently contains approximately 15 root-level files and 3 directories that are candidates for removal. Git history serves as the safety net for all deletions.

Key finding during research: `chatbot.json` is actively imported by `src/components/chat/FloatingChat.tsx` as a Lottie animation -- it MUST NOT be deleted despite looking like a scratchpad artifact. `components.json` is a live shadcn/ui configuration file and must be preserved. The `aplikacja/` directory is already absent from the working tree (only shows as deleted in git status). The `scripts/` directory is referenced in `package.json` and is out of scope.

**Primary recommendation:** Delete files in batches ordered by confidence level (obvious scratchpad first, then one-off scripts, then borderline items needing user confirmation). Run `npm run build` once at the end to verify nothing broke.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Root-level markdown files: Claude evaluates each one -- delete obvious scratchpad (completed task lists, deprecated plans, temp notes), flag borderline files for user review
- Root-level SQL and JS test files (add_test_items.sql, update_notion_image_url.sql, test-filter-changes.js, test-validation.js): Claude evaluates relevance -- delete if clearly one-off, keep if referenced by app code
- Miscellaneous root artifacts (chatbot.json, design.json, build_out.txt, "h origin main"): Claude checks if referenced by tooling before deleting; components.json may be shadcn/ui config -- verify before removing
- "h origin main" file: Check contents before deleting (likely accidental creation from typo)
- Old aplikacja/ directory: Quick scan for any unmigrated content before confirming full deletion
- LIGHTTOOL_IMPLEMENTATION/ directory: Delete entirely -- no longer needed
- LIGHTTOOL_GUIDE.md at root: Delete -- obsolete along with implementation dir
- performance-tasks/ directory: Delete entirely
- .taskmaster/ directory: Delete entirely
- docs/ directory: Claude reviews contents and decides based on relevance to current project
- Delete files outright -- no temp backup folder (git history serves as backup)
- Build/lint verification frequency: Claude decides based on risk level of each batch
- Borderline files: Flag and ask user during execution -- don't delete without confirmation
- Whitelisted (never delete): CLAUDE.md, AGENTS.md, ARCHITECTURE.md, Project.md, .planning/, .claude/, .husky/, tool configs (.eslintrc.json, .prettierrc, .lintstagedrc.json, .gitignore, .gitattributes, tsconfig.json, tailwind.config.js, postcss.config.js, components.json pending verification, middleware.ts, package.json, package-lock.json)

### Claude's Discretion

- Exact categorization of each root-level markdown file (scratchpad vs legitimate)
- Whether components.json is active tooling config
- Verification cadence (per-batch vs end-of-phase)
- Ordering of deletion batches by risk level
- What to do with docs/ directory contents based on review

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                   | Research Support                                                                                                                                                   |
| -------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CLEAN-01 | Identify and delete scratchpad markdown files | File-by-file evaluation below in Architecture Patterns section; 6 root markdown files identified as scratchpad, 1 borderline                                       |
| CLEAN-02 | Preserve whitelisted files                    | Whitelist documented in User Constraints; components.json CONFIRMED as shadcn/ui config (must keep); chatbot.json CONFIRMED as active Lottie animation (must keep) |
| CLEAN-03 | Remove obsolete root-level files              | 4 SQL/JS test files confirmed one-off (no code references); build_out.txt and "h origin main" confirmed junk                                                       |
| CLEAN-04 | Clean up LIGHTTOOL_IMPLEMENTATION/ directory  | 7 .txt files, all implementation guides for completed feature; confirmed obsolete                                                                                  |
| CLEAN-05 | Remove old aplikacja/ directory remnants      | Directory already absent from working tree; git status shows all files as deleted; no files to scan                                                                |
| CLEAN-06 | Clean up performance-tasks/ and .taskmaster/  | performance-tasks has 4 completed task docs; .taskmaster has 30+ task files, config, PRD -- all from prior tooling; confirmed obsolete                             |

</phase_requirements>

## Standard Stack

Not applicable -- this phase involves only file deletions via `git rm` and `rm`. No libraries or packages needed.

### Tools Used

| Tool            | Purpose                                 | Why                                          |
| --------------- | --------------------------------------- | -------------------------------------------- |
| `git rm`        | Remove tracked files and stage deletion | Proper git-tracked removal                   |
| `rm -rf`        | Remove untracked directories            | For directories not yet tracked              |
| `npm run build` | Verify no build breakage                | Confirms no imports were broken by deletions |

## Architecture Patterns

### File Evaluation Results

Every root-level file was individually evaluated. Results are organized by verdict.

#### DELETE -- Obvious Scratchpad (HIGH confidence)

| File                          | Reason                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `ADMIN_DASHBOARD_SETUP.md`    | Setup guide for completed work; not referenced by code                           |
| `PERFORMANCE_AUDIT_REPORT.md` | Completed audit report (Dec 2025); historical only                               |
| `RESPONSIVE_SYSTEM.md`        | Design documentation that duplicates info in code/config                         |
| `THEME_SYSTEM.md`             | Design documentation that duplicates info in code/config                         |
| `LIGHTTOOL_GUIDE.md`          | Obsolete guide for LIGHTTOOL feature; paired with LIGHTTOOL_IMPLEMENTATION/      |
| `build_out.txt`               | Build output log; ephemeral artifact                                             |
| `h origin main`               | Accidental file from git branch typo; contains one line of branch listing output |

#### DELETE -- One-Off Scripts (HIGH confidence)

| File                          | Reason                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `add_test_items.sql`          | One-off test data insertion script; not referenced by code                   |
| `update_notion_image_url.sql` | One-off fix for broken image URL; not referenced by code                     |
| `database-migrations.sql`     | Standalone migration file; proper migrations exist in `supabase/migrations/` |
| `test-filter-changes.js`      | Ad-hoc test script; not referenced by code or package.json                   |
| `test-validation.js`          | Ad-hoc test script; not referenced by code or package.json                   |

#### DELETE -- Entire Directories (HIGH confidence)

| Directory                   | Contents                             | Reason                                                      |
| --------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `LIGHTTOOL_IMPLEMENTATION/` | 7 .txt implementation guide files    | Completed feature implementation; guides are obsolete       |
| `performance-tasks/`        | 4 .md task/analysis files            | Completed performance audit; tasks are done                 |
| `.taskmaster/`              | 30+ task files, config, PRD, reports | Prior task management tooling; replaced by current workflow |

#### BORDERLINE -- Needs User Confirmation

| File                                 | Assessment                                                                                                                                                                                                   | Recommendation                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `NOTIFICATION_SYSTEM NIE USUWAC.md`  | Filename literally says "DO NOT DELETE" (Polish). Contains comprehensive notification system implementation guide. Content duplicates what is in the codebase, but user explicitly named it to be preserved. | **Flag for user** -- the filename is a strong signal the user wants to keep it, despite it being scratchpad-like |
| `docs/AFFILIATE_CONFIGURATION.md`    | Affiliate link setup guide with platform details. Not referenced by code but contains operational configuration info (Amazon Associates, etc.) that may be useful for maintainers.                           | **Flag for user** -- useful operational reference, recommend keeping                                             |
| `docs/RLS_SECURITY_DOCUMENTATION.md` | Comprehensive RLS policy documentation. Not referenced by code but serves as security audit reference.                                                                                                       | **Flag for user** -- useful security reference, recommend keeping                                                |

#### MUST KEEP -- Confirmed Active

| File                  | Reason                                                                              |
| --------------------- | ----------------------------------------------------------------------------------- |
| `chatbot.json`        | Lottie animation file, actively imported by `src/components/chat/FloatingChat.tsx`  |
| `components.json`     | shadcn/ui configuration file with `$schema: "https://ui.shadcn.com/schema.json"`    |
| All whitelisted files | Per user decision (CLAUDE.md, AGENTS.md, ARCHITECTURE.md, Project.md, tool configs) |

### Recommended Batch Ordering

**Batch 1 -- Zero-Risk Junk** (no code references possible)

- `h origin main`
- `build_out.txt`

**Batch 2 -- Obvious Scratchpad Docs** (documentation only, no imports)

- `ADMIN_DASHBOARD_SETUP.md`
- `PERFORMANCE_AUDIT_REPORT.md`
- `RESPONSIVE_SYSTEM.md`
- `THEME_SYSTEM.md`
- `LIGHTTOOL_GUIDE.md`

**Batch 3 -- One-Off Scripts** (confirmed no code references)

- `add_test_items.sql`
- `update_notion_image_url.sql`
- `database-migrations.sql`
- `test-filter-changes.js`
- `test-validation.js`

**Batch 4 -- Directory Removal** (all contents confirmed obsolete)

- `LIGHTTOOL_IMPLEMENTATION/`
- `performance-tasks/`
- `.taskmaster/`

**Batch 5 -- Borderline Items** (require user confirmation)

- `NOTIFICATION_SYSTEM NIE USUWAC.md`
- `docs/` directory (both files)

**Batch 6 -- Verification**

- `npm run build` to confirm nothing broke
- `npm run lint` for good measure

### Anti-Patterns to Avoid

- **Deleting chatbot.json**: It looks like a scratchpad artifact but is an active Lottie animation import. Always check for code references before deleting any JSON file.
- **Deleting components.json**: It looks generic but is the shadcn/ui config that controls component generation. Verified by its `$schema` field.
- **Removing scripts/ directory**: The `scripts/` folder is referenced in `package.json` and is NOT a cleanup target.
- **Touching aplikacja/ in working tree**: It is already gone. The git status shows it as deleted but those deletions just need to be staged, not re-deleted.

## Don't Hand-Roll

| Problem                 | Don't Build           | Use Instead                  | Why                                             |
| ----------------------- | --------------------- | ---------------------------- | ----------------------------------------------- |
| File reference checking | Manual search         | `grep -r "filename"` in src/ | Catches all import/require references reliably  |
| Staged deletion         | `rm` then `git add`   | `git rm` directly            | Single command handles both removal and staging |
| Directory deletion      | `git rm` file by file | `git rm -r dirname/`         | Recursive flag handles entire trees             |

## Common Pitfalls

### Pitfall 1: Deleting Files Referenced by Code

**What goes wrong:** Build breaks because a deleted file was imported somewhere
**Why it happens:** JSON files and other non-code assets can be imported by components
**How to avoid:** Grep for every filename in `src/` before deleting. Confirmed issue: `chatbot.json` is imported by FloatingChat.tsx
**Warning signs:** Build failure with "Module not found" errors

### Pitfall 2: Filename Encoding Issues on Windows

**What goes wrong:** Files with special characters (Polish diacritics, spaces) fail to delete with standard commands
**Why it happens:** Windows path handling + git + special characters = edge cases
**How to avoid:** Quote all filenames in shell commands. Use `git rm -- "filename with spaces.md"` syntax. The "NOTIFICATION_SYSTEM NIE USUWAC.md" file has spaces and Polish characters.
**Warning signs:** "pathspec did not match" errors from git

### Pitfall 3: Staging aplikacja/ Deletions

**What goes wrong:** Attempting to `rm` files that are already deleted in the working tree
**Why it happens:** `aplikacja/` shows as "D" (deleted) in git status but the deletions are not staged
**How to avoid:** Use `git add -u aplikacja/` to stage the already-performed deletions, or `git rm -r aplikacja/` which handles missing files gracefully
**Warning signs:** "pathspec did not match any files" if using wrong approach

### Pitfall 4: Forgetting the docs/ Directory Decision

**What goes wrong:** docs/ gets deleted without user input, losing potentially useful operational docs
**Why it happens:** Batch deletion mentality -- "delete all non-whitelisted markdown"
**How to avoid:** Explicitly flag docs/ contents for user review during execution
**Warning signs:** User asks "where did the RLS documentation go?"

## Code Examples

### Deleting a tracked file

```bash
git rm "ADMIN_DASHBOARD_SETUP.md"
```

### Deleting a file with spaces in the name

```bash
git rm -- "NOTIFICATION_SYSTEM NIE USUWAC.md"
```

### Deleting an entire directory

```bash
git rm -r LIGHTTOOL_IMPLEMENTATION/
```

### Staging already-deleted files (aplikacja/)

```bash
git add -u aplikacja/
```

### Deleting an untracked file

```bash
rm -rf .taskmaster/
```

### Build verification after cleanup

```bash
npm run build
```

## State of the Art

Not applicable -- file deletion has no "state of the art" concerns.

## Open Questions

1. **NOTIFICATION_SYSTEM NIE USUWAC.md disposition**
   - What we know: Filename literally says "DO NOT DELETE" in Polish. Content is a comprehensive notification system guide.
   - What's unclear: Whether user still considers this critical or if it was just a temporary note
   - Recommendation: Flag for user during execution. The filename is a strong keep-signal.

2. **docs/ directory disposition**
   - What we know: Contains AFFILIATE_CONFIGURATION.md (operational setup guide) and RLS_SECURITY_DOCUMENTATION.md (security reference). Neither is referenced by code.
   - What's unclear: Whether these serve ongoing operational needs or are historical artifacts
   - Recommendation: Flag for user. My assessment is these are useful operational docs worth keeping, but user decides.

3. **aplikacja/ staging approach**
   - What we know: Files are deleted in working tree but not staged in git
   - What's unclear: Whether prior phases already handled this or if it is genuinely part of this phase
   - Recommendation: Stage the deletions as part of this phase since CLEAN-05 explicitly calls for it

## Sources

### Primary (HIGH confidence)

- Direct file reading of every candidate file in the repository
- `grep` searches across `src/` for all candidate filenames to verify code references
- `components.json` schema field confirms shadcn/ui: `"$schema": "https://ui.shadcn.com/schema.json"`
- `FloatingChat.tsx` line 16 confirms chatbot.json import: `import chatbotAnimation from '../../../chatbot.json'`

### Secondary (MEDIUM confidence)

- Git status output from session start used to identify all untracked/modified files

## Metadata

**Confidence breakdown:**

- File evaluation: HIGH - Every file was individually read and grep-checked for references
- Deletion safety: HIGH - Code reference checks are deterministic
- Borderline items: MEDIUM - User intent for "NIE USUWAC" file and docs/ requires confirmation

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable -- file inventory does not change rapidly)
