# Phase 1: Pre-Flight Audit & Setup - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish complete visibility into current codebase state and create safety nets for safe refactoring. This phase captures baseline metrics, verifies linting/formatting tooling, audits environment variables, and installs refactor analysis tools (Knip, madge, bundle analyzer). No code changes to application logic — this is measurement and setup only.

</domain>

<decisions>
## Implementation Decisions

### Baseline metrics scope

- Metrics stored as JSON (for tooling comparison) + Markdown summary (for humans) in .planning/
- Knip, madge, and bundle analyzer are the three analysis tools — no additional tools needed

### Env variable handling

- Checklist audit only — verify .env files are gitignored, no secrets in code, document findings
- Current state only — no git history scanning (repo is private, overkill)
- Standard Supabase + Next.js env vars, no known tricky configurations

### Claude's Discretion

- **Metrics selection**: Claude picks which metrics best serve zero-regression verification across 9 phases (build time, bundle size, file count, dependency count at minimum — may include Lighthouse, route count, TS error count, LOC if useful)
- **Per-route vs overall bundle**: Claude decides granularity level based on what's practical
- **Rerunnable script vs one-time**: Claude decides whether to create an `npm run metrics` script or just capture once
- **ESLint strictness**: Claude assesses current config and decides whether to tighten rules or keep as-is before refactor
- **Pre-commit hook scope**: Claude picks the right balance of safety vs speed (lint+format vs lint+format+build)
- **Existing lint errors**: Claude assesses volume and decides whether to fix now or document as baseline
- **Prettier scope**: Claude decides whether to format entire codebase now or only changed files going forward
- **Tool installation approach**: Claude decides devDependencies vs npx-only based on long-term usefulness
- **npm scripts for tools**: Claude decides whether to add convenience scripts based on expected reuse frequency
- **Folder structure doc detail**: Claude decides simple tree vs annotated tree based on what helps Phase 4
- **Env runtime validation**: Claude decides whether adding a startup env check fits this phase's scope

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on all technical decisions for this phase, with one firm preference: metrics must be stored in both JSON and Markdown formats.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 01-pre-flight-audit-setup_
_Context gathered: 2026-02-17_
