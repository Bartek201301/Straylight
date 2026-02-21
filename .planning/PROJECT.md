# StrayLight — Refactor & Cleanup

## What This Is

A Next.js 14 + Supabase content publishing platform (articles, authentication, admin dashboard, newsletter, affiliate library) that has been through a comprehensive refactor and cleanup — eliminating technical debt, removing dead code, optimizing structure, and standardizing architecture to App Router best practices, all without changing user-facing behavior.

## Core Value

Zero functional regression. Every change preserves 1:1 identical behavior while reducing codebase complexity and clutter.

## Requirements

### Validated

- ✓ Authentication system (email/password, role-based access, session management) — existing
- ✓ Article publishing workflow (draft → pending → published → archived/rejected) — existing
- ✓ Admin dashboard with moderation tools — existing
- ✓ Affiliate library with curated content — existing
- ✓ Newsletter subscription system — existing
- ✓ Notification system (real-time) — existing
- ✓ Voting system for articles/library items — existing
- ✓ Rich text editor (TipTap) with markdown processing — existing
- ✓ Dark mode theming — existing
- ✓ Search functionality — existing
- ✓ Resource suggestions system — existing
- ✓ RLS-enforced data security — existing
- ✓ Dead code elimination — v1.0 (43 files + 7 deps removed, 0 unused exports)
- ✓ Full folder restructure — v1.0 (4 route groups, colocated \_components, lib/ organized)
- ✓ Performance tuning — v1.0 (server/client boundaries, dynamic imports, font optimization, asset compression)
- ✓ Scratchpad markdown cleanup — v1.0 (13 files + 3 directories removed)
- ✓ Database/migration cleanup — v1.0 (44 obsolete migrations removed, supabase/ cleaned)
- ✓ Build + test verification — v1.0 (0 errors, 0 lint warnings, all routes verified)

### Active

(No active requirements — milestone complete. Use `/gsd:new-milestone` to define next scope.)

### Out of Scope

- New features — zero new functionality (still valid)
- UI/UX changes — no visual changes whatsoever (still valid)
- Database schema changes — no ALTER TABLE, no new columns, no RLS policy changes (still valid)
- Dependency upgrades — no version bumps (still valid for refactor scope)
- New tests — only verify existing tests still pass (still valid; no test framework exists)
- Middleware relocation — middleware.ts at project root not compiled by Next.js (pre-existing issue, not a regression)

## Context

**Shipped v1.0 Refactor & Cleanup (2026-02-21):**

- 329 files (down from 403, -18.4%), 83K LOC (down from 107K, -22.2%)
- Tech stack: Next.js 14, Supabase, TipTap, Tailwind CSS
- 0 lint warnings (down from 387), 852kB shared JS bundle (stable)
- 0 TypeScript errors, 0 circular dependencies
- All 38 page routes verified via production build crawl

**Architecture after refactor:**

- 4 route groups: (marketing), (auth), (dashboard), (admin)
- Route-specific components colocated in \_components/ folders
- lib/ organized: seo/, affiliate/, mail/, content/ subdirectories
- All imports use @/ aliases; ESLint guard prevents relative imports
- Server-first pages with "use client" pushed to leaf components
- Loading/error boundaries for all route segments (17 new files)

**Known issues:**

- middleware.ts not compiled into production build (wrong location — needs src/middleware.ts)
- RLS policies documented but not programmatically verified via SQL
- 14 npm audit vulnerabilities requiring breaking major version bumps (eslint, next, supabase/ssr)
- 5 large SVG files (placehold1.svg 4.5MB, aboutpage/ 4.2MB) flagged for SVGO review

## Constraints

- **Behavior**: Zero functional changes — 1:1 identical output
- **Verification**: `npm run build` + `npm run lint` must pass
- **Atomicity**: Small, easily revertible commits per cleanup area
- **Scope**: Everything (app code, config, migrations, root files)

## Key Decisions

| Decision                                      | Rationale                                                        | Outcome                                                             |
| --------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| Full restructure to App Router best practices | User wants proper organization, not just light cleanup           | ✓ Good — 4 route groups, colocated components, clean lib/           |
| Trust judgment on scratchpad deletion         | User doesn't want to approve each file individually              | ✓ Good — 13 files deleted cleanly, 3 borderline files user-reviewed |
| Include database/migration cleanup            | User chose "Everything" scope                                    | ✓ Good — 44 obsolete migrations removed, README rewritten           |
| Moderate dead code aggression                 | Balance between thorough cleanup and safety                      | ✓ Good — 43 files removed, no false positives reported              |
| Wrapper pattern for server components         | Keep metadata exports server-side while rendering client content | ✓ Good — 6 pages converted, clean separation                        |
| PERF-03 downgrade to best-effort              | Fixed vendor deps make up 95% of shared chunk                    | ✓ Good — user approved, asset compression achieved 35% reduction    |
| Keep 5 remaining Knip "unused" files          | public/sw.js + 4 layout components are false positives           | ✓ Good — confirmed in use via manual review                         |
| ESLint guards for import paths and use-client | Prevent regression of cleaned patterns                           | ✓ Good — two new lint rules enforcing standards                     |

---

_Last updated: 2026-02-21 after v1.0 milestone_
