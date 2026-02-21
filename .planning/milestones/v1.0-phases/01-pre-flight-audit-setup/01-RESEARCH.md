# Phase 1: Pre-Flight Audit & Setup - Research

**Researched:** 2026-02-17
**Domain:** Codebase auditing, static analysis tooling, developer experience infrastructure
**Confidence:** HIGH

## Summary

Phase 1 is a measurement-and-setup-only phase. No application code changes are made. The codebase is a Next.js 14 App Router project with 407 source files (~108k LOC), 100 routes/pages, 38 production dependencies, and 44 Supabase migrations. The existing developer tooling (ESLint, Prettier, Husky, lint-staged) is already in place and functional, though there are 394 lint warnings (all `no-unused-vars`, zero errors) and 34 files with Prettier formatting drift. TypeScript compilation is clean (0 errors).

Three analysis tools need installation: Knip (dead code/unused dependency detection), madge (circular dependency detection), and `@next/bundle-analyzer` (bundle size visualization). All three have mature Next.js support and straightforward configuration. The env variable audit is low-risk -- all `.env` files are properly gitignored, and server-only secrets (SUPABASE_SERVICE_ROLE_KEY, AI_API_KEY, MAILCHIMP_API_KEY) are used exclusively in server-side code (API routes, lib functions).

**Primary recommendation:** Create a rerunnable `npm run metrics` script that captures baseline metrics in both JSON and Markdown formats, install the three analysis tools as devDependencies with npm scripts, fix the 34 Prettier-drifted files now (safe, no logic changes), and document lint warnings as baseline rather than fixing them (they are all unused-var warnings that will be addressed by dead code removal in later phases).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Metrics stored as JSON (for tooling comparison) + Markdown summary (for humans) in .planning/
- Knip, madge, and bundle analyzer are the three analysis tools -- no additional tools needed

### Claude's Discretion

- **Metrics selection**: Claude picks which metrics best serve zero-regression verification across 9 phases (build time, bundle size, file count, dependency count at minimum -- may include Lighthouse, route count, TS error count, LOC if useful)
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

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                         | Research Support                                                                                                                                                                                                           |
| ------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRE-01 | Establish baseline build metrics (build time, bundle size, file count)              | Metrics script captures build time, bundle sizes (overall + per-route via analyzer), file count, dependency count, LOC, TS error count, lint warning count, route count. Stored as JSON + Markdown in `.planning/`.        |
| PRE-02 | Verify existing lint/format automation works (ESLint, Prettier, Husky, lint-staged) | All four tools are installed and configured. ESLint runs via `next lint`, Prettier config exists, Husky pre-commit hook calls `npx lint-staged`. 394 warnings (no errors), 34 files with formatting drift need addressing. |
| PRE-03 | Audit environment variables -- ensure no secrets exposed, .env files gitignored     | `.gitignore` covers all `.env*` patterns. `.env.local` exists with 10 vars. Server secrets are only used in server-side code. No hardcoded secrets found in source.                                                        |
| PRE-04 | Document current folder structure as migration reference                            | 407 files across 176 directories in `src/`. Annotated tree needed for Phase 4 restructuring.                                                                                                                               |

</phase_requirements>

## Standard Stack

### Core (Analysis Tools to Install)

| Library               | Version | Purpose                                                          | Why Standard                                                                                                                                                                                |
| --------------------- | ------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| knip                  | ^5.83.1 | Dead code, unused exports, unused dependency detection           | Built-in Next.js plugin, auto-detects entry points for App Router pages/routes. 100+ framework plugins. Industry standard for JS/TS dead code analysis.                                     |
| madge                 | ^8.0.0  | Circular dependency detection and dependency graph visualization | De facto standard for circular dependency detection in JS/TS. Supports TypeScript via `--ts-config` flag. Can generate visual dependency graphs.                                            |
| @next/bundle-analyzer | ^14.0.0 | Bundle size visualization and analysis                           | Official Next.js package. Wraps webpack-bundle-analyzer with Next.js-specific configuration. Generates interactive treemap HTML reports. Pin to match project's Next.js major version (14). |

### Already Installed (Verify Working)

| Library            | Version | Purpose                                | Status                                                                                                |
| ------------------ | ------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| eslint             | ^8.0.0  | Code linting                           | Working. `next lint` runs successfully. 394 warnings, 0 errors.                                       |
| eslint-config-next | ^14.0.0 | Next.js ESLint rules (core-web-vitals) | Working. Extends `next/core-web-vitals`.                                                              |
| prettier           | ^3.0.0  | Code formatting                        | Working. Config exists. 34 files have drift.                                                          |
| husky              | ^8.0.0  | Git hooks                              | Working. `.husky/pre-commit` exists and calls `npx lint-staged`.                                      |
| lint-staged        | ^15.0.0 | Run linters on staged files            | Working. Config runs `eslint --fix` + `prettier --write` on JS/TS, `prettier --write` on JSON/CSS/MD. |
| typescript         | ^5.0.0  | Type checking                          | Working. `tsc --noEmit` passes with 0 errors.                                                         |

### Alternatives Considered

| Instead of            | Could Use                       | Tradeoff                                                                                                           |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| knip                  | ts-prune                        | ts-prune only finds unused exports, not unused files or dependencies. Knip is strictly more capable.               |
| madge                 | eslint-plugin-import (no-cycle) | ESLint plugin is slower on large codebases and harder to configure. madge gives visual output and CLI flexibility. |
| @next/bundle-analyzer | source-map-explorer             | source-map-explorer works but lacks Next.js-specific integration (client/server/edge splits).                      |

**Installation:**

```bash
npm install --save-dev knip madge @next/bundle-analyzer
```

## Architecture Patterns

### Recommended Metrics Script Structure

The metrics script should be a Node.js script at `scripts/collect-metrics.js` that:

1. Runs `next build` and captures timing
2. Reads `.next/` output for bundle size data
3. Counts source files, dependencies, routes
4. Runs `tsc --noEmit` and captures error count
5. Runs `next lint` and captures warning/error count
6. Outputs to both `.planning/metrics/baseline.json` and `.planning/metrics/baseline.md`

```
.planning/
  metrics/
    baseline.json          # Machine-readable, used for regression checks
    baseline.md            # Human-readable summary
scripts/
  collect-metrics.js       # Rerunnable metrics collection
```

### Knip Configuration Pattern

Knip auto-detects Next.js when `next` is in `dependencies`. Minimal configuration needed:

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": [
    "src/app/**/page.tsx",
    "src/app/**/route.ts",
    "src/app/layout.tsx",
    "middleware.ts"
  ],
  "project": ["src/**/*.{ts,tsx}", "scripts/**/*.js"],
  "ignore": [
    "src/app/**/loading.tsx",
    "src/app/**/error.tsx",
    "src/app/**/not-found.tsx"
  ],
  "ignoreDependencies": ["@types/*"]
}
```

Note: Knip's built-in Next.js plugin will handle most of this automatically. A `knip.json` may only be needed if false positives appear. Start with zero config and add overrides as needed.

### Bundle Analyzer Configuration Pattern

```javascript
// next.config.js - wrap existing config
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // ... existing config
};

module.exports = withBundleAnalyzer(nextConfig);
```

Run with: `ANALYZE=true npm run build`
On Windows: `set ANALYZE=true && npm run build` or use cross-env.

### Madge Usage Pattern

```bash
# Check for circular dependencies
npx madge --circular --ts-config tsconfig.json src/

# Generate dependency graph image (requires graphviz)
npx madge --image deps.svg --ts-config tsconfig.json src/

# JSON output for baseline
npx madge --circular --ts-config tsconfig.json --json src/
```

### Anti-Patterns to Avoid

- **Running build in pre-commit hooks:** Build takes too long for every commit. Lint + format is the right balance. Build verification belongs in CI.
- **Fixing all lint warnings before refactor:** The 394 warnings are all `no-unused-vars`. Dead code removal in later phases will naturally eliminate most of these. Fixing them now is wasted effort.
- **Formatting the entire codebase in a separate commit:** This creates a massive diff that pollutes git blame. Better to format now in a dedicated commit, then enforce going forward via pre-commit hooks (which already exist).
- **Installing tools globally or via npx-only:** DevDependencies ensure version consistency across team members and CI. All three tools will be used repeatedly across 9 phases.

## Discretion Recommendations

Based on codebase analysis, here are my recommendations for all Claude's Discretion items:

### Metrics Selection

**Recommendation:** Capture these metrics in the baseline:

| Metric                           | Why                                         | How                                  |
| -------------------------------- | ------------------------------------------- | ------------------------------------ |
| Build time                       | Detect regressions from restructuring       | Time `next build`                    |
| Bundle size (total client JS)    | Primary optimization target                 | Parse `.next/` build output          |
| Bundle size (per-page breakdown) | Identify heavy pages for later optimization | `@next/bundle-analyzer` HTML reports |
| Source file count                | Track consolidation progress                | `find src -type f`                   |
| Source directory count           | Track structural changes                    | `find src -type d`                   |
| Dependency count (production)    | Track dependency cleanup                    | Parse `package.json`                 |
| Dependency count (dev)           | Track dev tooling changes                   | Parse `package.json`                 |
| Total LOC                        | Track code reduction                        | `wc -l` on source files              |
| TypeScript error count           | Must stay at 0                              | `tsc --noEmit`                       |
| ESLint warning count             | Track improvement                           | `next lint`                          |
| ESLint error count               | Must stay at 0                              | `next lint`                          |
| Route/page count                 | Track route changes                         | Count `page.tsx` + `route.ts`        |
| Circular dependency count        | Track improvement                           | `madge --circular`                   |

Skip Lighthouse -- it requires a running server and is too flaky for automated regression checks.

### Per-Route vs Overall Bundle

**Recommendation:** Capture overall bundle size in JSON metrics. Generate per-route breakdown via bundle analyzer HTML reports (saved to `.planning/metrics/`). The HTML reports are interactive and more useful than trying to extract per-route numbers into JSON.

### Rerunnable Script vs One-Time

**Recommendation:** Create a rerunnable `npm run metrics` script. This phase establishes the baseline, but every subsequent phase should re-run metrics to verify zero regression. A script pays for itself immediately.

### ESLint Strictness

**Recommendation:** Keep current config as-is. The current rules are reasonable (`next/core-web-vitals` base, `prefer-const: error`, `no-unused-vars: warn`). Tightening rules before a major refactor would create churn. After Phase 4 (restructuring), reassess whether to add stricter rules.

### Pre-Commit Hook Scope

**Recommendation:** Keep current scope (lint + format via lint-staged). Do NOT add build to pre-commit -- it takes too long. The current `.lintstagedrc.json` config is well-designed: `eslint --fix` + `prettier --write` on code files, `prettier --write` on data files.

### Existing Lint Errors (Warnings)

**Recommendation:** Document as baseline (394 warnings, 0 errors). All 394 warnings are `no-unused-vars` in 3 files (`imageUtils.ts`, `retry.ts`, `article-submission.ts`). These will be naturally addressed during dead code removal in Phase 3. Fixing now is wasted effort that would be undone.

### Prettier Scope

**Recommendation:** Format the entire codebase now in a single dedicated commit. Rationale: 34 files have drift. Doing it now means every subsequent diff is clean. The pre-commit hook already enforces formatting on changed files, but existing drift creates noisy diffs when those files are touched during refactoring. One clean-sweep commit is the standard approach.

### Tool Installation Approach

**Recommendation:** Install all three as devDependencies (not npx-only). All three tools will be used repeatedly: Knip after each dead code removal pass, madge after each restructuring step, bundle analyzer after each optimization. Version pinning via devDependencies ensures reproducible results across all 9 phases.

### npm Scripts for Tools

**Recommendation:** Add convenience scripts for frequently used commands:

```json
{
  "knip": "knip",
  "knip:fix": "knip --fix",
  "madge:circular": "madge --circular --ts-config tsconfig.json src/",
  "analyze": "ANALYZE=true next build",
  "metrics": "node scripts/collect-metrics.js"
}
```

### Folder Structure Doc Detail

**Recommendation:** Annotated tree with purpose descriptions for each top-level and second-level directory. Phase 4 (restructuring) needs to know what each directory contains and why it exists. A simple `tree` dump without annotations would require re-investigation. Include file counts per directory.

### Env Runtime Validation

**Recommendation:** Out of scope for this phase. Adding a Zod-based env validation schema is a code change that belongs in Phase 2 or later. This phase should only audit and document -- not modify application behavior. Document the finding (no runtime validation exists) as a recommendation for a future phase.

## Don't Hand-Roll

| Problem                                | Don't Build                          | Use Instead                | Why                                                                                  |
| -------------------------------------- | ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------ |
| Dead code detection                    | Custom grep/regex scripts            | Knip                       | Understands module graphs, re-exports, dynamic imports, framework conventions        |
| Circular dependency detection          | Manual import tracing                | madge                      | Handles complex transitive cycles, TypeScript path aliases, provides visual output   |
| Bundle size analysis                   | Manual `.next/` file size inspection | @next/bundle-analyzer      | Generates interactive treemaps, separates client/server/edge bundles                 |
| Cross-platform env vars in npm scripts | `set ANALYZE=true && ...`            | cross-env (already common) | Windows vs Unix `env` syntax differences. Consider adding if Windows dev is primary. |

**Key insight:** Static analysis tools understand module graphs and framework conventions that simple text-based approaches miss entirely. Knip's 100+ plugins mean it won't flag Next.js conventions (like default page exports) as "unused."

## Common Pitfalls

### Pitfall 1: Knip False Positives with Dynamic Imports

**What goes wrong:** Knip flags files as unused that are actually imported dynamically via `next/dynamic` or conditional requires.
**Why it happens:** Static analysis cannot always trace dynamic `import()` calls.
**How to avoid:** Run Knip first, review its output manually before acting on it. Use `ignore` patterns for known dynamic imports. The baseline run in this phase is diagnostic only -- no deletions.
**Warning signs:** Knip reports page components or layout files as unused.

### Pitfall 2: Bundle Analyzer on Windows

**What goes wrong:** `ANALYZE=true npm run build` fails on Windows because `ANALYZE=true` is Unix shell syntax.
**Why it happens:** Windows CMD and PowerShell use different env var syntax.
**How to avoid:** Use `cross-env` package or set the variable before the command: `set ANALYZE=true && npm run build`. Or add a dedicated npm script.
**Warning signs:** "ANALYZE is not recognized as an internal or external command."

### Pitfall 3: Madge with TypeScript Path Aliases

**What goes wrong:** Madge cannot resolve `@/*` imports and reports missing dependencies or broken graphs.
**Why it happens:** Madge needs explicit `--ts-config tsconfig.json` to understand TypeScript path aliases.
**How to avoid:** Always pass `--ts-config tsconfig.json`. The project uses `@/*` -> `./src/*` mapping.
**Warning signs:** Many "module not found" warnings from madge.

### Pitfall 4: Metrics Script Build Time Variance

**What goes wrong:** Build times vary wildly between runs (cold vs warm cache, system load).
**Why it happens:** Next.js uses incremental builds, and system resources affect timing.
**How to avoid:** Document that build time is approximate. Clear `.next/` before baseline measurement for a cold build. Note measurement conditions in the Markdown report.
**Warning signs:** Build time differs by >50% between runs.

### Pitfall 5: Pre-commit Hook Breaking on CI

**What goes wrong:** Husky hooks try to install on CI and fail.
**Why it happens:** `prepare` script runs `husky install` which fails in non-git environments.
**How to avoid:** The project already has `is-ci` in devDependencies -- verify it's used to skip hooks in CI. Check if `prepare` script handles this.
**Warning signs:** CI pipeline fails during `npm install` with Husky errors.

### Pitfall 6: Formatting Entire Codebase Creates Merge Conflicts

**What goes wrong:** Formatting 34 files while other branches have changes creates merge conflicts.
**Why it happens:** Whitespace changes touch many lines that other branches may also touch.
**How to avoid:** Do the format commit early (this phase), before any refactoring branches diverge. Communicate to any other contributors.
**Warning signs:** Multiple active branches with overlapping file changes.

## Code Examples

### Metrics Collection Script Pattern

```javascript
// scripts/collect-metrics.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function collectMetrics() {
  const metrics = {};

  // File counts
  const srcFiles = execSync(
    'find src -type f -name "*.ts" -o -name "*.tsx" | wc -l',
    { encoding: 'utf8' }
  ).trim();
  metrics.sourceFileCount = parseInt(srcFiles, 10);

  const srcDirs = execSync('find src -type d | wc -l', {
    encoding: 'utf8',
  }).trim();
  metrics.sourceDirectoryCount = parseInt(srcDirs, 10);

  // LOC
  const loc = execSync(
    'find src -type f \\( -name "*.ts" -o -name "*.tsx" \\) -exec wc -l {} + | tail -1',
    { encoding: 'utf8' }
  ).trim();
  metrics.totalLOC = parseInt(loc.split(/\s+/)[0], 10);

  // Dependencies
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  metrics.productionDependencies = Object.keys(pkg.dependencies || {}).length;
  metrics.devDependencies = Object.keys(pkg.devDependencies || {}).length;

  // Routes
  const routes = execSync(
    'find src/app -name "page.tsx" -o -name "route.ts" | wc -l',
    { encoding: 'utf8' }
  ).trim();
  metrics.routeCount = parseInt(routes, 10);

  // TypeScript errors
  try {
    execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8' });
    metrics.typescriptErrors = 0;
  } catch (e) {
    const errorCount = (e.stdout.match(/error TS/g) || []).length;
    metrics.typescriptErrors = errorCount;
  }

  // ESLint
  try {
    const lintOutput = execSync('npx next lint 2>&1', { encoding: 'utf8' });
    metrics.eslintWarnings = (lintOutput.match(/Warning/g) || []).length;
    metrics.eslintErrors = (lintOutput.match(/Error/g) || []).length;
  } catch (e) {
    metrics.eslintWarnings = (e.stdout?.match(/Warning/g) || []).length;
    metrics.eslintErrors = (e.stdout?.match(/Error/g) || []).length;
  }

  // Build time (cold build)
  const startTime = Date.now();
  execSync('npx next build', { encoding: 'utf8', stdio: 'pipe' });
  metrics.buildTimeMs = Date.now() - startTime;

  // Bundle size from .next build output
  // Parse .next/build-manifest.json for page sizes
  // ... (implementation detail for planner)

  metrics.collectedAt = new Date().toISOString();

  return metrics;
}
```

### @next/bundle-analyzer Integration

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // ... existing config (images, compress, swcMinify, headers, experimental, webpack)
};

module.exports = withBundleAnalyzer(nextConfig);
```

### Knip Zero-Config Run

```bash
# Knip auto-detects Next.js from package.json dependencies
# First run -- diagnostic only, no --fix
npx knip

# JSON output for baseline
npx knip --reporter json > .planning/metrics/knip-baseline.json

# If false positives appear, create knip.json:
# {
#   "$schema": "https://unpkg.com/knip@5/schema.json",
#   "ignore": ["src/app/**/loading.tsx", "src/app/**/error.tsx"]
# }
```

### Madge Circular Dependency Check

```bash
# Check for circular dependencies with TypeScript support
npx madge --circular --ts-config tsconfig.json src/

# JSON output for baseline
npx madge --circular --ts-config tsconfig.json --json src/ > .planning/metrics/circular-deps-baseline.json
```

## State of the Art

| Old Approach                       | Current Approach                                | When Changed                   | Impact                                                   |
| ---------------------------------- | ----------------------------------------------- | ------------------------------ | -------------------------------------------------------- |
| ts-prune for unused exports        | Knip (comprehensive: files, exports, deps)      | 2023-2024                      | Single tool replaces multiple (ts-prune, depcheck, etc.) |
| Manual bundle inspection           | @next/bundle-analyzer with interactive treemaps | Stable since Next.js 12+       | Visual analysis, client/server/edge split awareness      |
| eslint-plugin-import no-cycle rule | madge CLI for circular deps                     | madge predates the ESLint rule | Faster, visual output, better for one-off audits         |
| Husky v4 (npm install hooks)       | Husky v8+ (prepare script, .husky/ dir)         | 2021                           | Project already uses v8 pattern                          |

**Deprecated/outdated:**

- `depcheck`: Knip supersedes it with better framework awareness
- `ts-prune`: Unmaintained, Knip covers the same ground plus more
- Husky v4 `husky` field in package.json: Project correctly uses v8 `.husky/` directory

## Current Codebase State (Baseline Snapshot)

These are the current values as measured during research. The metrics script will formalize these.

| Metric                          | Current Value            |
| ------------------------------- | ------------------------ |
| Source files (src/)             | 407                      |
| Source directories (src/)       | 176                      |
| Total LOC (all source)          | ~108,000                 |
| TypeScript files                | 403                      |
| JavaScript files                | 1 (imageLoader.js)       |
| CSS files                       | 1 (globals.css)          |
| Production dependencies         | 38                       |
| Dev dependencies                | 15                       |
| Total npm packages (transitive) | 736                      |
| Routes/pages                    | 100                      |
| Migration files                 | 44                       |
| TypeScript errors               | 0                        |
| ESLint warnings                 | 394 (all no-unused-vars) |
| ESLint errors                   | 0                        |
| Prettier-drifted files          | 34                       |
| Pre-commit hook                 | Active (lint-staged)     |

### Environment Variables Audit (Pre-Research)

| Variable                      | Location   | Type   | Server-Only?                        |
| ----------------------------- | ---------- | ------ | ----------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL      | .env.local | Public | No (client-safe)                    |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | .env.local | Public | No (client-safe)                    |
| SUPABASE_SERVICE_ROLE_KEY     | .env.local | Secret | Yes (supabase.ts server-side only)  |
| REVALIDATION_TOKEN            | .env.local | Secret | Yes (revalidation.ts, API route)    |
| NEXT_PUBLIC_GA_ID             | .env.local | Public | No (client-safe)                    |
| MAILCHIMP_API_KEY             | .env.local | Secret | Yes (mailchimp.ts server-side only) |
| MAILCHIMP_SERVER_PREFIX       | .env.local | Config | Yes (mailchimp.ts server-side only) |
| MAILCHIMP_LIST_ID             | .env.local | Config | Yes (mailchimp.ts server-side only) |
| AI_API_KEY                    | .env.local | Secret | Yes (API routes only)               |
| AI_MODEL                      | .env.local | Config | Yes (API routes only)               |

**Referenced but not in .env.local (optional/unused):**

- `NEXT_PUBLIC_SITE_URL` -- referenced in AuthContext and API routes
- `AMAZON_ASSOCIATE_ID` / `NEXT_PUBLIC_AMAZON_ASSOCIATE_ID` -- affiliate integration
- `BARNES_NOBLE_AFFILIATE_ID` / `NEXT_PUBLIC_BARNES_NOBLE_AFFILIATE_ID` -- affiliate integration
- `GUMROAD_AFFILIATE_ID` / `NEXT_PUBLIC_GUMROAD_AFFILIATE_ID` -- affiliate integration
- `PADDLE_AFFILIATE_ID` / `NEXT_PUBLIC_PADDLE_AFFILIATE_ID` -- affiliate integration
- `LEMONSQUEEZY_AFFILIATE_ID` / `NEXT_PUBLIC_LEMONSQUEEZY_AFFILIATE_ID` -- affiliate integration
- `REDIS_URL` -- optional Redis for rate limiting (falls back to in-memory)
- `MAILCHIMP_WEBHOOK_SECRET` -- optional webhook validation
- `NEXTAUTH_URL` / `VERCEL_URL` -- URL resolution fallbacks
- `OPTIMIZE_IMAGES` -- dev image optimization toggle
- `SIMULATE_SLOW_API` / `SIMULATE_API_ERRORS` -- dev debugging
- `NEXT_PUBLIC_AUTO_INJECT_AFFILIATES` / `AFFILIATE_FORCE_REPLACE` -- affiliate config
- `RATE_LIMIT_WHITELIST` -- rate limiting config

**Security findings:** No secrets hardcoded in source code. All `.env` patterns are in `.gitignore`. Server-only secrets are only accessed in server-side files (API routes, lib modules that run server-side). No issues found.

## Open Questions

1. **Cross-env for Windows compatibility**
   - What we know: The project is developed on Windows. `ANALYZE=true npm run build` is Unix syntax.
   - What's unclear: Whether to add `cross-env` as a devDependency or just document Windows-specific commands.
   - Recommendation: Add `cross-env` as a devDependency since the dev environment is Windows. Use it in the `analyze` npm script.

2. **Husky CI Skip**
   - What we know: `is-ci` package is in devDependencies but the `prepare` script doesn't use it.
   - What's unclear: Whether Husky install fails in CI environments.
   - Recommendation: Verify during implementation. If needed, update `prepare` to: `is-ci || husky install`.

3. **Graphviz for madge image generation**
   - What we know: madge's `--image` flag requires Graphviz to be installed on the system.
   - What's unclear: Whether Graphviz is installed on the dev machine.
   - Recommendation: Make image generation optional. The `--circular --json` output is the primary deliverable. Image generation is nice-to-have.

## Sources

### Primary (HIGH confidence)

- `/webpro-nl/knip` (Context7) - Next.js plugin configuration, entry patterns, JSON output, reporters
- `/webpack-contrib/webpack-bundle-analyzer` (Context7) - Plugin configuration, installation, CLI usage
- Codebase inspection - All metrics, file counts, env var audit, tooling verification

### Secondary (MEDIUM confidence)

- [npm: @next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer) - Version 16.1.6, setup pattern with `withBundleAnalyzer` wrapper
- [npm: madge](https://www.npmjs.com/package/madge) - Version 8.0.0, CLI commands, TypeScript support via `--ts-config`
- [npm: knip](https://www.npmjs.com/package/knip) - Version 5.83.1, auto-detection of Next.js
- [Knip Next.js Plugin docs](https://knip.dev/reference/plugins/next) - Plugin auto-detection behavior
- [Next.js Bundle Analyzer docs](https://nextjs.org/docs/14/pages/building-your-application/optimizing/bundle-analyzer) - Official setup guide
- [GitHub: pahen/madge](https://github.com/pahen/madge) - Circular dependency detection, TypeScript config support

### Tertiary (LOW confidence)

- None. All findings verified against codebase or official sources.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All three tools are mature, well-documented, and verified against Context7/npm/official docs
- Architecture: HIGH - Patterns are standard and verified against official documentation
- Pitfalls: HIGH - Based on known Windows dev environment, TypeScript path aliases in tsconfig.json, and direct codebase inspection
- Current state: HIGH - All metrics measured directly from codebase

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable tools, unlikely to change significantly)
