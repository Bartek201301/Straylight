# Phase 3: Scratchpad & File Cleanup - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove temporary documentation, completed task lists, and obsolete artifacts cluttering the repository. Preserve core project docs, tool configs, and hidden directories. No functional code changes — only file deletions and directory removal.

</domain>

<decisions>
## Implementation Decisions

### Deletion criteria

- Root-level markdown files: Claude evaluates each one — delete obvious scratchpad (completed task lists, deprecated plans, temp notes), flag borderline files for user review
- Root-level SQL and JS test files (add_test_items.sql, update_notion_image_url.sql, test-filter-changes.js, test-validation.js): Claude evaluates relevance — delete if clearly one-off, keep if referenced by app code
- Miscellaneous root artifacts (chatbot.json, design.json, build_out.txt, "h origin main"): Claude checks if referenced by tooling before deleting; components.json may be shadcn/ui config — verify before removing
- "h origin main" file: Check contents before deleting (likely accidental creation from typo)
- Old aplikacja/ directory: Quick scan for any unmigrated content before confirming full deletion

### LIGHTTOOL & task directories

- LIGHTTOOL_IMPLEMENTATION/ directory: Delete entirely — no longer needed
- LIGHTTOOL_GUIDE.md at root: Delete — obsolete along with implementation dir
- performance-tasks/ directory: Delete entirely
- .taskmaster/ directory: Delete entirely
- docs/ directory: Claude reviews contents and decides based on relevance to current project

### Safety approach

- Delete files outright — no temp backup folder (git history serves as backup)
- Build/lint verification frequency: Claude decides based on risk level of each batch
- Borderline files: Flag and ask user during execution — don't delete without confirmation
- Whitelisted (never delete): CLAUDE.md, AGENTS.md, ARCHITECTURE.md, Project.md, .planning/, .claude/, .husky/, tool configs (.eslintrc.json, .prettierrc, .lintstagedrc.json, .gitignore, .gitattributes, tsconfig.json, tailwind.config.js, postcss.config.js, components.json pending verification, middleware.ts, package.json, package-lock.json)

### Claude's Discretion

- Exact categorization of each root-level markdown file (scratchpad vs legitimate)
- Whether components.json is active tooling config
- Verification cadence (per-batch vs end-of-phase)
- Ordering of deletion batches by risk level
- What to do with docs/ directory contents based on review

</decisions>

<specifics>
## Specific Ideas

- User wants a quick scan of aplikacja/ before confirming deletion — check for anything not migrated to src/
- "h origin main" should be inspected before deleting (likely empty or contains git push output)
- Aggressive cleanup preferred — git history is the safety net, not backup folders

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 03-scratchpad-file-cleanup_
_Context gathered: 2026-02-18_
