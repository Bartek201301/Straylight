# Phase 2: Dead Code Elimination - Research

**Researched:** 2026-02-17
**Domain:** Static analysis, dead code detection, dependency auditing
**Confidence:** HIGH

## Summary

Phase 2 targets the removal of 30-40% of unused code from the StrayLight codebase. The starting point is well-defined: Phase 1's Knip diagnostic identified **105 unused files**, **71 unused exports**, **40 unused exported types**, **8 duplicate exports**, **3 unused runtime dependencies**, and **3 unused devDependencies**. The codebase currently has 403 files and 107K LOC.

Knip v5.83.1 is already installed and configured (`knip.json`) with Next.js auto-detection. The tool correctly identifies Next.js convention files (loading.tsx, error.tsx, not-found.tsx) via ignore patterns. However, Knip has **known false positives** in this codebase: `public/sw.js` (service worker loaded by string URL, not import), `.claude/` tooling files (not part of the app), and `supabase/functions/` (Deno edge functions, independently deployed). These must be excluded via `ignoreFiles` before using Knip output as a deletion checklist.

The user has locked a **verify-each-file-individually** approach with grep-based cross-checking, **batch-by-category** deletions with build checks between batches, and **devDependencies-first** dependency removal. All decisions are practical and well-suited to this codebase's size.

**Primary recommendation:** Update `knip.json` to exclude known false positives, then systematically work through unused files by category (effects, error-handling, editor, hooks, lib, etc.), verifying each with grep before deletion, running `npm run build && npm run lint && npx tsc --noEmit` after each batch.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Deletion confidence threshold

- **Verify each file individually** before deleting -- do not bulk-delete based on Knip output alone
- For each Knip-flagged file, **grep the entire codebase for the filename** to catch dynamic imports, string-based references, and config file usage
- **Same rigor for unused exports** -- grep for each export name across the codebase before removing
- **Batch deletions by category** (components, utils, services, types, etc.) -- remove one category at a time with build checks between batches

#### Dependency removal strategy

- **DevDependencies first, then runtime** -- remove devDeps, build-check, then tackle runtime dependencies
- **Cross-check all config files** before removing any package -- check next.config.js, tailwind.config.js, postcss.config.js, tsconfig.json, and any other config files for references
- After removal, **run npm audit** to flag vulnerabilities in remaining deps
- **Fix safe audit findings** (non-breaking, no major version bumps) in this phase; document the rest for later

#### Commented-out code handling

- **Review each commented block individually** -- no blanket removal
- **No specific files** called out for special treatment -- apply same rules everywhere
- TODO/FIXME comment handling: Claude's discretion based on volume and relevance

#### Verification checkpoints

- After each category batch: **build passes** (npm run build), **lint clean** (npm run lint), **TypeScript clean** (tsc --noEmit)
- End-of-phase verification: build + lint pass (skip full metrics comparison until later phases)
- Metrics comparison script NOT required per batch -- just build/lint/TS checks

### Claude's Discretion

- Distinguishing dead code comments from useful explanatory comments (use judgment per case)
- Whether to collect TODO/FIXME comments into a summary doc or leave in place
- Revert strategy when deletions break the build (single file vs entire batch, based on failure nature)
- Git commit granularity (per category vs per plan, based on batch size and risk)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                           | Research Support                                                                                                                   |
| ------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| DEAD-01 | Run Knip analysis to identify unused files, exports, and dependencies | Knip v5.83.1 already installed. Needs `ignoreFiles` update for false positives. Current output: 105 files, 71 exports, 6 deps      |
| DEAD-02 | Remove unused TypeScript/JavaScript files                             | 105 files flagged, minus ~7 false positives = ~98 genuine unused files. Categorized by directory below for batch processing        |
| DEAD-03 | Remove unused exports from files that are otherwise still in use      | 71 unused exports + 40 unused types + 8 duplicate exports. Knip `--fix-type exports,types` can auto-remove with `--fix` flag       |
| DEAD-04 | Remove clearly unused npm dependencies from package.json              | 6 confirmed unused: class-variance-authority, motion, remark (runtime); @tailwindcss/aspect-ratio, @tailwindcss/forms, is-ci (dev) |
| DEAD-05 | Remove commented-out code blocks that are clearly obsolete            | ~460 comment lines found; only 6 TODO/FIXME; ~6 commented-out imports. Volume is low -- manageable with individual review          |

</phase_requirements>

## Standard Stack

### Core

| Tool               | Version  | Purpose                                  | Why Standard                                                          |
| ------------------ | -------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Knip               | 5.83.1   | Unused file/export/dependency finder     | Already installed, auto-detects Next.js plugins, comprehensive output |
| npm audit          | built-in | Vulnerability scanning after dep removal | Standard npm tooling, no additional install needed                    |
| tsc --noEmit       | 5.x      | TypeScript compilation check             | Already configured in tsconfig.json                                   |
| next lint (ESLint) | 14.x     | Lint verification                        | Already configured in .eslintrc.json                                  |
| next build         | 14.x     | Full build verification                  | The definitive pass/fail check                                        |

### Supporting

| Tool           | Version  | Purpose                               | When to Use                                |
| -------------- | -------- | ------------------------------------- | ------------------------------------------ |
| grep (ripgrep) | system   | Cross-reference verification          | Before every file/export deletion          |
| Knip --fix     | 5.83.1   | Auto-remove unused exports from files | DEAD-03 (unused exports from active files) |
| npm prune      | built-in | Clean node_modules after dep removal  | After DEAD-04 dependency removal           |

### Alternatives Considered

None -- the tooling is already installed and proven in Phase 1.

**No new installations required.** All tools are already in the project.

## Architecture Patterns

### Deletion Batch Order

Based on analysis of the 105 Knip-flagged files, the recommended batch order (lowest risk first):

```
Batch 1: .claude/ + root test files        ~6 files   (tooling, not app code - just exclude from Knip)
Batch 2: supabase/functions/ edge funcs     ~3 files   (false positives - exclude from Knip)
Batch 3: src/components/effects/            ~8 files   (decorative, low coupling)
Batch 4: src/components/error-handling/     ~12 files  (infrastructure, but unused)
Batch 5: src/components/editor/             ~5 files   (route-specific, clearly unused)
Batch 6: src/components/ui/ + search/       ~10 files  (UI primitives, low coupling)
Batch 7: src/components/ remaining          ~15 files  (newsletter, articles, auth, etc.)
Batch 8: src/hooks/                         ~12 files  (custom hooks)
Batch 9: src/lib/ (all subdirectories)      ~15 files  (business logic, highest coupling risk)
Batch 10: public/sw.js                      ~1 file    (FALSE POSITIVE - keep, used by ServiceWorkerProvider)
Batch 11: Unused exports (Knip --fix)       71+40 exports (auto-fix with review)
Batch 12: Duplicate exports                 8 files    (remove named or default, keep one)
Batch 13: DevDependencies removal           3 packages
Batch 14: Runtime dependencies removal      3 packages
Batch 15: Commented-out code cleanup        ~6 imports + review
```

### Pattern: Verify-Then-Delete Workflow

**What:** For each Knip-flagged item, verify it is genuinely unused before removal.
**When to use:** Every single file and export deletion.
**Steps:**

```bash
# 1. For a flagged FILE, grep for its filename (without extension) across the codebase
grep -r "ComponentName" src/ --include="*.ts" --include="*.tsx" --include="*.js"
# Also check config files
grep -r "ComponentName" next.config.js tailwind.config.js postcss.config.js tsconfig.json middleware.ts

# 2. For a flagged EXPORT, grep for the export name
grep -r "exportName" src/ --include="*.ts" --include="*.tsx"

# 3. Check for dynamic/lazy imports referencing the file path
grep -r "import.*path/to/file" src/ --include="*.ts" --include="*.tsx"

# 4. If no references found, safe to delete
# 5. After batch deletion, run verification:
npm run build && npm run lint && npx tsc --noEmit
```

### Pattern: Knip Config Update for False Positives

**What:** Update `knip.json` to exclude files that are NOT part of the Next.js application.
**When to use:** Before starting deletions (first action of the phase).

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "ignore": [
    "src/app/**/loading.tsx",
    "src/app/**/error.tsx",
    "src/app/**/not-found.tsx"
  ],
  "ignoreFiles": [
    ".claude/**",
    "supabase/functions/**",
    "test-*.js",
    "scripts/**"
  ],
  "ignoreDependencies": ["@types/*"]
}
```

### Anti-Patterns to Avoid

- **Bulk-deleting based on Knip output alone:** Knip cannot trace string-based references, `require()` with variables, or service worker registrations. Always grep first.
- **Deleting `public/sw.js`:** Knip flags it as unused, but `ServiceWorkerProvider.tsx` registers it via `navigator.serviceWorker.register('/sw.js')`. This is a confirmed false positive.
- **Removing exports from barrel files without checking re-exports:** Some exports in `src/lib/api/index.ts` re-export from submodules. Removing the re-export without checking downstream consumers could break imports.
- **Running `knip --fix --allow-remove-files` unattended:** The `--fix` flag modifies source code directly. Only use `--fix-type exports,types` for export removal, and do file deletion manually after verification.
- **Removing dependencies before removing the files that import them:** Always delete unused files first, then remove the dependencies those files pulled in. Otherwise the build breaks during intermediate steps.

## Don't Hand-Roll

| Problem                        | Don't Build              | Use Instead                         | Why                                                                  |
| ------------------------------ | ------------------------ | ----------------------------------- | -------------------------------------------------------------------- |
| Finding unused files/exports   | Manual import tracing    | `npx knip`                          | Knip traces the full dependency graph from entry points              |
| Auto-removing unused exports   | Manual editing each file | `npx knip --fix-type exports,types` | Handles export keyword removal, default export removal, enum members |
| Dependency vulnerability check | Manual CVE lookup        | `npm audit`                         | Built-in, comprehensive, actionable                                  |
| Build verification             | Partial checks           | `npm run build`                     | Next.js build catches all import errors, type errors, route issues   |

**Key insight:** Knip's analysis is the starting point, not the final word. Its value is in narrowing the search space from 403 files to ~105 candidates. Human verification (grep) provides the confidence to actually delete.

## Common Pitfalls

### Pitfall 1: False Positives from Dynamic References

**What goes wrong:** Deleting a file that is referenced by string (not import), breaking runtime behavior without build errors.
**Why it happens:** Static analysis tools cannot trace `navigator.serviceWorker.register('/sw.js')`, `import()` with template literals, or config file references.
**How to avoid:** Grep for the filename (without extension and path) across the entire project, including config files, before deletion.
**Warning signs:** Files in `public/`, files referenced in `next.config.js`, files with string-based loading patterns.

**Known false positives in this codebase:**

- `public/sw.js` -- registered via string URL in `ServiceWorkerProvider.tsx`
- `.claude/**` -- tooling files, not app code
- `supabase/functions/**` -- Deno edge functions, independently deployed
- `test-*.js` (root) -- ad-hoc test scripts, not app code (but genuinely deletable)

### Pitfall 2: Removing Exports That Are Used via Re-exports

**What goes wrong:** Removing an export from `moduleA.ts` that is re-exported by `index.ts` (barrel file), breaking consumers that import from the barrel.
**Why it happens:** Knip sometimes flags exports as unused when it cannot fully resolve barrel file re-export chains.
**How to avoid:** When Knip flags an export from a file that has a sibling `index.ts`, check the barrel file for re-exports before removing.
**Warning signs:** Files in directories with `index.ts`, files in `src/lib/api/`, `src/components/ui/icons/`.

### Pitfall 3: Config-Only Dependencies

**What goes wrong:** Removing a package that is only referenced in a config file (not in source code), breaking the build.
**Why it happens:** Knip may not trace `require()` calls in `.js` config files as dependencies.
**How to avoid:** Before removing any dependency, grep ALL config files: `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `.eslintrc.json`, `tsconfig.json`, `.lintstagedrc.json`.
**Warning signs:** Tailwind plugins, PostCSS plugins, ESLint plugins.

**Confirmed config-only dependencies in this codebase:**

- `@tailwindcss/typography` -- used in `tailwind.config.js` plugins array (NOT flagged by Knip, correctly detected)
- `tailwindcss-animate` -- used in `tailwind.config.js` plugins array (NOT flagged by Knip, correctly detected)
- `@tailwindcss/aspect-ratio` -- NOT in `tailwind.config.js` plugins array, genuinely unused
- `@tailwindcss/forms` -- NOT in `tailwind.config.js` plugins array, genuinely unused

### Pitfall 4: Removing Files That Are Phase 4 Colocation Candidates

**What goes wrong:** Keeping a file alive because it is in a "route-specific" directory, when it is actually genuinely unused dead code.
**Why it happens:** Phase 4 identified 51 route-specific component files for colocation. Some of the Knip-flagged files happen to be in those same directories.
**How to avoid:** The distinction is clear: Phase 4 candidates are files that ARE imported but live in the wrong directory. Phase 2 targets are files that are NOT imported anywhere. Verify with grep -- if no imports exist, it is dead code regardless of directory.
**Confirmed dead code in route-specific directories:** `NotificationManagement.tsx`, `AffiliateLink.tsx`, `EnhancedArticleEditor.tsx`, `ImageUpload.tsx`, `MobileEditorToolbar.tsx`, `RightSidebarToolbar.tsx`, `SidebarToolbar.tsx`, `QuizProgressBar.tsx`, `quiz/index.ts`.

### Pitfall 5: Breaking the `optimized-imports.ts` Barrel

**What goes wrong:** Removing an unused export from `src/lib/optimized-imports.ts` that is actually consumed via the barrel's re-export chain.
**Why it happens:** This file re-exports from `framer-motion`, `lucide-react`, `@supabase/supabase-js` and provides lazy import wrappers. Knip flags many exports here because they may be imported directly from the source package elsewhere.
**How to avoid:** For each export flagged in `optimized-imports.ts`, grep for both the export name AND the original package import to confirm no consumer exists.
**Warning signs:** This file has 55+ flagged exports -- the highest concentration in the codebase.

### Pitfall 6: TODO/FIXME Comments That Are Still Relevant

**What goes wrong:** Removing a TODO comment that documents a genuine planned feature or known limitation.
**Why it happens:** Blanket removal of commented code without reading context.
**How to avoid:** Only 6 TODO/FIXME comments exist in this codebase. Review each individually. Most are actionable future work items (API integration, export functionality, user auth context).
**Recommendation:** Leave all 6 TODO/FIXME comments in place -- they are low volume, relevant, and serve as documentation of known gaps.

## Code Examples

### Verify-then-delete workflow for a single file

```bash
# Example: Verifying src/components/effects/Aurora.tsx is genuinely unused

# Step 1: Grep for the component name
grep -r "Aurora" src/ --include="*.ts" --include="*.tsx"
# Expected: Only finds the file itself and commented-out imports

# Step 2: Grep for the file path (catches dynamic imports)
grep -r "effects/Aurora" src/ --include="*.ts" --include="*.tsx"
# Expected: No matches (or only the file itself)

# Step 3: Check config files
grep -r "Aurora" next.config.js tailwind.config.js middleware.ts
# Expected: No matches

# Step 4: Safe to delete
rm src/components/effects/Aurora.tsx

# Step 5: Verify build after batch
npm run build && npm run lint && npx tsc --noEmit
```

### Knip --fix for unused exports (DEAD-03)

```bash
# Preview what would be fixed (dry run not available, but use reporter first)
npx knip --reporter compact 2>&1 | grep "Unused exports"

# Auto-fix unused exports and types only (NOT files, NOT dependencies)
npx knip --fix --fix-type exports,types

# Review changes with git diff before committing
git diff --stat
git diff  # review actual changes

# Verify nothing broke
npm run build && npm run lint && npx tsc --noEmit
```

### Dependency removal workflow

```bash
# Step 1: Remove devDependencies first
npm uninstall @tailwindcss/aspect-ratio @tailwindcss/forms is-ci

# Step 2: Verify build
npm run build && npm run lint && npx tsc --noEmit

# Step 3: Remove runtime dependencies
npm uninstall class-variance-authority motion remark

# Step 4: Verify build again
npm run build && npm run lint && npx tsc --noEmit

# Step 5: Run audit
npm audit

# Step 6: Fix safe audit findings
npm audit fix  # only applies non-breaking fixes
```

### Updating knip.json to exclude false positives

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "ignore": [
    "src/app/**/loading.tsx",
    "src/app/**/error.tsx",
    "src/app/**/not-found.tsx"
  ],
  "ignoreFiles": [
    ".claude/**",
    "supabase/functions/**",
    "test-*.js",
    "scripts/**"
  ],
  "ignoreDependencies": ["@types/*"]
}
```

## Current Codebase Inventory

### Unused Files by Category (from Knip output, verified)

| Category                         | Count | Files                                                                                                                                                                                                                                                           | Risk                                            |
| -------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `.claude/` tooling               | 4     | gsd-tools.cjs, gsd-tools.test.cjs, gsd-check-update.js, gsd-statusline.js                                                                                                                                                                                       | FALSE POSITIVE -- exclude via ignoreFiles       |
| `supabase/functions/`            | 3     | \_shared/database.ts, process-notifications-cron/index.ts, send-email-notifications/index.ts                                                                                                                                                                    | FALSE POSITIVE -- exclude via ignoreFiles       |
| Root test files                  | 2     | test-filter-changes.js, test-validation.js                                                                                                                                                                                                                      | LOW -- throwaway scripts                        |
| `public/`                        | 1     | sw.js                                                                                                                                                                                                                                                           | FALSE POSITIVE -- used by ServiceWorkerProvider |
| `src/components/effects/`        | 8     | Aurora, BlurText, GlareHover, HomeAurora, RotatingText, TextPressure, ViewportAwareCobeGlobe, ViewportAwareOrb                                                                                                                                                  | LOW                                             |
| `src/components/error-handling/` | 12    | boundaries/ (4), displays/ (3), pages/ (4), validation/ (6) -- minus any that are used                                                                                                                                                                          | LOW                                             |
| `src/components/editor/`         | 5     | EnhancedArticleEditor, ImageUpload, MobileEditorToolbar, RightSidebarToolbar, SidebarToolbar                                                                                                                                                                    | LOW                                             |
| `src/components/ui/`             | 7     | LazyImage, OptimizedVideo, background-ripple-effect, card-hover-effect, buttons/RetryButton, display/CodeBlock, display/FontToggle                                                                                                                              | LOW                                             |
| `src/components/articles/`       | 4     | ArticleStatusNotification, ArticlesList, ReadingProgress, ReadingTimeDisplay                                                                                                                                                                                    | MEDIUM                                          |
| `src/components/auth/`           | 2     | AccessRequired, AuthGate                                                                                                                                                                                                                                        | MEDIUM                                          |
| `src/components/newsletter/`     | 3     | HomeNewsletterSignup, NewsletterForm (component dir), NewsletterSignup                                                                                                                                                                                          | MEDIUM                                          |
| `src/components/` other          | 6     | NewsletterForm (root), admin/NotificationManagement, affiliate/AffiliateLink, notifications/NotificationBell, search/\* (4), forms/ValidatedInput/Textarea                                                                                                      | MEDIUM                                          |
| `src/components/ui/skeletons/`   | 6     | ArticleSkeleton, CardSkeleton, EditorSkeleton, FormSkeleton, LibraryItemSkeleton, ProfileSkeleton                                                                                                                                                               | LOW                                             |
| `src/components/ui/feedback/`    | 1     | Toast                                                                                                                                                                                                                                                           | MEDIUM                                          |
| `src/components/quiz/`           | 2     | QuizProgressBar, index.ts                                                                                                                                                                                                                                       | LOW                                             |
| `src/hooks/`                     | 12    | useAdvancedIntersectionObserver, useArticleValidation, useErrorRecovery, useIntersectionObserver, useNotificationErrors, useNotificationPerformance, useRetry, useScrollSync, useSlugManagement, useSubmissionFlow, useSubmissionWithRecovery, useTagManagement | MEDIUM                                          |
| `src/lib/` (various)             | 15    | auth/index, database/\* (2), errors/submission-errors, hooks/useSearchPerformance, imageLoader.js, monitoring, responsive-utils, revalidation, services/notification-service, theme-utils, utils/imageUtils, utils/retry, validation/article-submission         | MEDIUM-HIGH                                     |

**Total genuine unused files: ~98** (105 minus ~7 false positives)

### Unused Dependencies (confirmed)

| Package                     | Type    | Verification                                              |
| --------------------------- | ------- | --------------------------------------------------------- |
| `class-variance-authority`  | runtime | Zero imports found in src/                                |
| `motion`                    | runtime | Zero imports found (project uses `framer-motion` instead) |
| `remark`                    | runtime | Zero imports found (project uses remark-\* sub-packages)  |
| `@tailwindcss/aspect-ratio` | dev     | Not in tailwind.config.js plugins array                   |
| `@tailwindcss/forms`        | dev     | Not in tailwind.config.js plugins array                   |
| `is-ci`                     | dev     | Zero references in any source or config file              |

### TODO/FIXME Comments (6 total)

| File                                         | Comment                                       | Recommendation                    |
| -------------------------------------------- | --------------------------------------------- | --------------------------------- |
| `admin/articles/pending/page.tsx:334`        | TODO: Export functionality                    | Keep -- documents planned feature |
| `api/resources/suggest/route.ts:123`         | TODO: Send email notification to admin        | Keep -- documents planned feature |
| `api/search/route.ts:60`                     | TODO: Add user ID when auth context available | Keep -- documents known gap       |
| `api/search/route.ts:221`                    | TODO: Implement smart suggestions             | Keep -- documents planned feature |
| `admin/articles/PendingArticlesList.tsx:109` | TODO: Add support for filters in API          | Keep -- documents planned feature |
| `chat/FloatingChat.tsx:45`                   | TODO: Replace with real API call              | Keep -- documents known gap       |

**Recommendation:** Leave all 6 in place. Volume is trivially low, all are relevant documentation of planned work.

### Commented-Out Imports (6 total)

| File                                       | Import                                         | Action                                                  |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------- |
| `about/page.tsx:10-11`                     | Link, Aurora                                   | Remove -- these components are unused on this page      |
| `write/page.tsx:18,25`                     | MobileEditorToolbar, ArticleStatusNotification | Remove -- both are dead code files being deleted        |
| `admin/articles/PendingArticlesList.tsx:4` | getSupabaseAdmin                               | Remove -- explanatory comment above explains the change |
| `articles/ArticlesPageContent.tsx:4`       | Aurora                                         | Remove -- Aurora is a dead code file being deleted      |

## State of the Art

| Old Approach                | Current Approach                          | When Changed | Impact                                      |
| --------------------------- | ----------------------------------------- | ------------ | ------------------------------------------- |
| Manual import tracing       | Knip automated analysis                   | 2023+        | 10x faster detection of unused code         |
| `depcheck` for dependencies | Knip unified analysis                     | 2024+        | Single tool covers files, exports, AND deps |
| Manual export cleanup       | `knip --fix` auto-removal                 | Knip 3.x+    | Automated removal with source modification  |
| Separate tools per concern  | Knip plugins for framework-aware analysis | Knip 5.x     | Next.js entry points auto-detected          |

## Open Questions

1. **`src/lib/optimized-imports.ts` export cleanup**
   - What we know: Knip flags 55+ exports from this file. The file re-exports from heavy libraries for tree-shaking.
   - What's unclear: Whether removing unused re-exports from this file impacts bundle splitting behavior or just cleans up dead re-exports.
   - Recommendation: Treat like any other file -- grep each export, remove if no consumers exist. The file's purpose (optimized imports) only matters if the exports are actually used.

2. **`src/lib/api/index.ts` barrel file cleanup**
   - What we know: This barrel re-exports from rate-limiting, cache, validation, etc. Many re-exports are flagged as unused.
   - What's unclear: Whether any API route uses `import { X } from '@/lib/api'` barrel imports vs direct submodule imports.
   - Recommendation: Grep for `from '@/lib/api'` (without subpath) to identify barrel consumers before removing re-exports.

3. **Supabase Edge Functions -- should they stay in repo?**
   - What we know: 3 files in `supabase/functions/` are flagged by Knip. They are Deno-based edge functions deployed independently to Supabase.
   - What's unclear: Whether these functions are actively deployed and used in production.
   - Recommendation: Exclude from Knip via `ignoreFiles`. If the user confirms they are unused/deprecated, they can be removed in a separate action. Do NOT delete without explicit confirmation.

## Sources

### Primary (HIGH confidence)

- **Knip v5.83.1 output** -- Direct analysis of the codebase via `npx knip --reporter compact`, run on 2026-02-17
- **Context7 /webpro-nl/knip** -- Configuration reference, --fix flag documentation, plugin system, ignoreFiles patterns
- **Codebase grep verification** -- Every dependency and false positive claim verified via grep across the full project

### Secondary (MEDIUM confidence)

- **Phase 1 summaries** (01-01-SUMMARY.md, 01-02-SUMMARY.md) -- Baseline metrics, Knip diagnostic results, folder structure audit
- **Phase 1 folder structure** (01-folder-structure.md) -- Component categorization, route-specific vs shared classification

### Tertiary (LOW confidence)

None -- all findings verified against the actual codebase.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all tools already installed and proven in Phase 1
- Architecture: HIGH -- batch order derived from actual Knip output and verified dependencies
- Pitfalls: HIGH -- every false positive verified via grep against the codebase

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- no new tools or APIs involved)
