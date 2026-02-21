# Technology Stack - Next.js Refactoring & Cleanup

**Project:** StrayLight Next.js 14 Refactor
**Researched:** 2026-02-16
**Confidence:** HIGH

## Recommended Stack

### Dead Code Detection & Analysis

| Technology                | Version | Purpose                                                        | Why Recommended                                                                                                                                                                                                              |
| ------------------------- | ------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Knip**                  | ^5.83.1 | All-in-one unused code detection                               | Industry standard for 2025. Finds unused files, exports, dependencies, and devDependencies. Built-in Next.js plugin with App Router support. 10x faster than alternatives. Actively maintained (latest release 10 days ago). |
| **@next/bundle-analyzer** | ^16.1.6 | Bundle size visualization                                      | Official Next.js plugin. Works with both Turbopack (experimental) and webpack. Essential for identifying large dependencies to remove. Generates interactive HTML reports.                                                   |
| **madge**                 | ^8.0.0  | Dependency graph visualization & circular dependency detection | Used by Vercel internally. Excellent for understanding module relationships before refactoring. Can detect orphaned code with `--orphans` flag.                                                                              |

### Code Quality & Linting

| Technology                             | Version | Purpose                                    | Why Recommended                                                                                                                                                         |
| -------------------------------------- | ------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **eslint-config-next/core-web-vitals** | ^14.0.0 | ESLint configuration optimized for Next.js | Official Next.js config. Includes React, React Hooks, and Next.js-specific rules. Core Web Vitals variant upgrades performance-impacting rules from warnings to errors. |
| **@typescript-eslint/eslint-plugin**   | latest  | TypeScript-specific linting                | Essential for TypeScript strict mode projects. Catches type-related issues ESLint would miss.                                                                           |
| **eslint-config-prettier**             | latest  | ESLint/Prettier integration                | Prevents conflicts between ESLint formatting rules and Prettier. Required when using both tools.                                                                        |

### Code Formatting

| Technology      | Version | Purpose                             | Why Recommended                                                                                                  |
| --------------- | ------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Prettier**    | ^3.0.0  | Code formatting                     | Already in project. Industry standard. Consistent formatting across team. Zero-config for JavaScript/TypeScript. |
| **lint-staged** | ^15.0.0 | Run formatters on staged files only | Already in project. Speeds up pre-commit hooks by processing only changed files.                                 |
| **husky**       | ^8.0.0  | Git hooks management                | Already in project. Ensures linting/formatting runs before commits.                                              |

### Import & Dependency Analysis

| Technology     | Version | Purpose                          | When to Use                                                                                                    |
| -------------- | ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **dpdm**       | latest  | Circular dependency detection    | For deep circular dependency analysis. Faster than madge for large codebases. TypeScript path mapping support. |
| **size-limit** | latest  | Bundle size budgets & monitoring | To enforce performance budgets in CI. Calculates real download + execution time, not just file size.           |

### TypeScript Configuration

| Tool                               | Purpose                              | Configuration                                                                           |
| ---------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| **tsconfig.json compiler options** | Detect unused locals/parameters      | Enable `noUnusedLocals: true` and `noUnusedParameters: true` for compile-time warnings. |
| **moduleDetection: "force"**       | Ensure tree-shaking compatibility    | Treats all files as ES modules for better dead code elimination by bundlers.            |
| **skipLibCheck: true**             | Faster type-checking during refactor | Already in project. Reduces type-checking time by 30-50% in large projects.             |

## Installation

```bash
# Core refactoring tools (new additions)
npm install -D knip madge @next/bundle-analyzer dpdm size-limit

# ESLint improvements
npm install -D @typescript-eslint/eslint-plugin eslint-config-prettier

# Already installed (confirm versions)
# - prettier ^3.0.0 ✓
# - lint-staged ^15.0.0 ✓
# - husky ^8.0.0 ✓
# - eslint-config-next ^14.0.0 ✓
```

## Alternatives Considered

| Category             | Recommended               | Alternative                      | Why Not Alternative                                                                                                                                                                 |
| -------------------- | ------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dead code detection  | **Knip**                  | ts-prune                         | ts-prune is in maintenance mode (no new features). Knip is actively developed with more features (dependencies, devDependencies, config files).                                     |
| Dead code detection  | **Knip**                  | unimported                       | unimported shows unhealthy release cadence (last update 1 year ago). Knip has better TypeScript support and monorepo handling.                                                      |
| Dependency analysis  | **depcheck** (skip)       | Knip                             | Depcheck is no longer recommended by its own maintainers. Knip covers all depcheck features plus more.                                                                              |
| Linting & Formatting | **ESLint + Prettier**     | Biome                            | Biome is 10-25x faster but has younger ecosystem. ~80% ESLint plugin compatibility in 2025. Consider for greenfield projects, not brownfield refactors with existing ESLint config. |
| Bundle analysis      | **@next/bundle-analyzer** | webpack-bundle-analyzer directly | @next/bundle-analyzer is a thin wrapper with Next.js-specific defaults. Using the official plugin ensures compatibility with Next.js updates.                                       |

## What NOT to Use

| Avoid                         | Why                                                                   | Use Instead                                        |
| ----------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| **ts-prune**                  | Maintenance mode since 2021. No new features.                         | **Knip** - Actively maintained, more comprehensive |
| **unimported**                | Unhealthy release cadence (1+ year since last update).                | **Knip** - Better TypeScript & monorepo support    |
| **depcheck**                  | Maintainers recommend switching to Knip.                              | **Knip** - All depcheck features + more            |
| **next-unused**               | Unmaintained. Last update 3+ years ago.                               | **Knip** with Next.js plugin                       |
| **Biome** (for this refactor) | Migration overhead for existing ESLint config. Better for greenfield. | **ESLint + Prettier** - Already configured         |

## Stack Configuration Patterns

### Pattern 1: Dead Code Detection Workflow

**Use Knip as primary tool:**

```bash
# Initial scan (see all issues)
npx knip

# Production mode (exclude devDependencies analysis)
npx knip --production

# Auto-fix unused dependencies
npx knip --fix

# CI integration (fail on issues)
npx knip --strict
```

**Configuration:** Create `knip.json` in project root:

```json
{
  "entry": ["src/app/**/*.{ts,tsx}", "src/middleware.ts"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": ["**/*.test.{ts,tsx}", "**/__tests__/**"],
  "ignoreDependencies": ["sharp"],
  "next": {
    "entry": ["src/app/layout.tsx", "src/app/page.tsx"]
  }
}
```

### Pattern 2: Bundle Analysis Workflow

**Setup:**

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing next config
});
```

**Usage:**

```bash
# Analyze bundle
ANALYZE=true npm run build

# Opens 3 tabs: client.html, edge.html, nodejs.html
```

### Pattern 3: Circular Dependency Detection

**Using madge (visualization):**

```bash
# Detect circular dependencies
npx madge --circular src/app --ts-config tsconfig.json

# Generate dependency graph image
npx madge src/app --ts-config tsconfig.json --image deps.png

# Find orphaned files
npx madge --orphans src/app --ts-config tsconfig.json
```

**Using dpdm (faster for large projects):**

```bash
# Detect circular dependencies
npx dpdm src/app/layout.tsx --tree --circular

# Exit with error if found (CI integration)
npx dpdm src/app/layout.tsx --exit-code circular:1
```

### Pattern 4: Pre-commit Code Quality

**Current setup (already configured):**

```json
// package.json
{
  "scripts": {
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Husky hook (`.husky/pre-commit`):**

```bash
#!/usr/bin/env sh
npx lint-staged
```

### Pattern 5: Bundle Size Budgets (Optional)

**Setup size-limit for CI:**

```json
// package.json
{
  "size-limit": [
    {
      "path": ".next/static/chunks/pages/_app-*.js",
      "limit": "200 KB"
    },
    {
      "path": ".next/static/chunks/pages/index-*.js",
      "limit": "50 KB"
    }
  ],
  "scripts": {
    "size": "size-limit"
  }
}
```

## ESLint Configuration Updates

**Recommended `.eslintrc.json` for refactor:**

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ],
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

**Why these rules:**

- `@typescript-eslint/no-unused-vars` - Catches dead variables during development
- `argsIgnorePattern: "^_"` - Allows `_unusedParam` pattern for required but unused parameters
- `no-console` - Prevents accidental console.logs in production
- `prefer-const`/`no-var` - Enforces modern JavaScript patterns

## TypeScript Configuration for Refactoring

**Add to `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
    "strict": true,
    "incremental": true
  }
}
```

**Already configured in project:**

- `strict: true` ✓
- `skipLibCheck: true` ✓ (inferred from existing setup)

## Integration with CI/CD

**GitHub Actions example:**

```yaml
# .github/workflows/quality.yml
name: Code Quality
on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npx knip --strict
      - run: npx madge --circular src/app --ts-config tsconfig.json
```

## Tool Comparison Matrix

| Feature               | Knip      | ts-prune | unimported | madge        | ESLint |
| --------------------- | --------- | -------- | ---------- | ------------ | ------ |
| Unused exports        | ✅        | ✅       | ❌         | ❌           | ❌     |
| Unused files          | ✅        | ❌       | ✅         | ✅ (orphans) | ❌     |
| Unused dependencies   | ✅        | ❌       | ✅         | ❌           | ❌     |
| Circular dependencies | ❌        | ❌       | ❌         | ✅           | ❌     |
| Auto-fix              | ✅ (deps) | ❌       | ✅ (files) | ❌           | ✅     |
| Next.js plugin        | ✅        | ❌       | ❌         | ❌           | ✅     |
| Active maintenance    | ✅        | ❌       | ⚠️         | ✅           | ✅     |
| Speed                 | Very Fast | Fast     | Medium     | Fast         | Medium |

## Version Compatibility Notes

| Package               | Current Version | Next.js 14 Compatibility | Notes                                             |
| --------------------- | --------------- | ------------------------ | ------------------------------------------------- |
| knip                  | 5.83.1          | ✅ Full support          | Built-in Next.js plugin with App Router detection |
| @next/bundle-analyzer | 16.1.6          | ✅ Full support          | Matches Next.js major version                     |
| madge                 | 8.0.0           | ✅ Full support          | Framework-agnostic                                |
| eslint-config-next    | 14.0.0          | ✅ Full support          | Should match Next.js version                      |
| prettier              | 3.x             | ✅ Full support          | Latest stable                                     |
| lint-staged           | 15.x            | ✅ Full support          | Works with all versions                           |
| husky                 | 8.x             | ✅ Full support          | Latest v8 (v9 available but breaking changes)     |

## Project-Specific Recommendations

### For StrayLight's Existing Stack

**Already optimal:**

- Prettier 3.x ✓
- lint-staged 15.x ✓
- husky 8.x ✓
- TypeScript 5.x with strict mode ✓

**Add immediately:**

1. **Knip** - Primary refactoring tool. Run before any code changes.
2. **madge** - Map dependencies, find circular refs
3. **@next/bundle-analyzer** - Identify large dependencies to remove

**Add for ongoing quality:**

- `eslint-config-prettier` - Prevent ESLint/Prettier conflicts
- `@typescript-eslint/eslint-plugin` - Better TypeScript linting

**Skip for this refactor:**

- Biome (migration overhead not worth it for cleanup-only refactor)
- ts-prune (superseded by Knip)
- depcheck (superseded by Knip)

### Refactor Execution Order

1. **Setup phase:**
   - Install Knip, madge, bundle-analyzer
   - Run Knip initial scan (`npx knip`)
   - Generate dependency graph (`npx madge src --ts-config tsconfig.json --image deps.png`)

2. **Analysis phase:**
   - Review Knip output for unused files/exports/dependencies
   - Check madge circular dependencies
   - Run bundle analyzer to identify large dependencies

3. **Cleanup phase:**
   - Remove unused dependencies with `npx knip --fix`
   - Remove unused files (manual, based on Knip output)
   - Break circular dependencies (based on madge output)

4. **Verification phase:**
   - Re-run `npx knip --strict` (should pass with zero issues)
   - Re-run madge circular check (should find none)
   - Compare bundle sizes before/after
   - Run full test suite
   - Build production to confirm no runtime errors

## Sources

**HIGH Confidence (Official docs, npm registry, recent releases):**

- [Knip official documentation](https://knip.dev/) - Comprehensive feature documentation
- [Knip npm package](https://www.npmjs.com/package/knip) - Version 5.83.1 confirmed
- [Next.js ESLint configuration docs](https://nextjs.org/docs/app/api-reference/config/eslint) - Official ESLint setup
- [@next/bundle-analyzer npm](https://www.npmjs.com/package/@next/bundle-analyzer) - Version 16.1.6 confirmed
- [madge npm package](https://www.npmjs.com/package/madge) - Version 8.0.0 confirmed
- [size-limit npm package](https://www.npmjs.com/package/size-limit) - Official documentation
- [GitHub: madge repository](https://github.com/pahen/madge) - Active maintenance confirmed
- [GitHub: dpdm repository](https://github.com/acrazing/dpdm) - Circular dependency detection

**MEDIUM Confidence (Multiple verified sources, community consensus):**

- [Medium: Knip Ultimate Tool](https://fireup.pro/news/knip-the-ultimate-tool-to-detect-unused-code-and-dependencies-in-javascript-typescript) - Real-world usage patterns
- [Effective TypeScript: Knip recommendation](https://effectivetypescript.com/2023/07/29/knip/) - Industry expert endorsement (update from ts-prune)
- [Medium: Husky and lint-staged for Next.js 2025](https://medium.com/@miyushanrodrigo/part-02-streamline-your-dev-workflow-husky-lint-staged-commitlint-for-next-js-763652a0de2e) - Current setup patterns
- [Medium: Next.js best practices 2025](https://medium.com/@burpdeepak96/the-battle-tested-nextjs-project-structure-i-use-in-2025-f84c4eb5f426) - Project structure recommendations
- [Strapi: React & Next.js best practices 2025](https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices) - Modern development patterns
- [Medium: Biome vs ESLint 2025](https://medium.com/better-dev-nextjs-react/biome-vs-eslint-prettier-the-2025-linting-revolution-you-need-to-know-about-ec01c5d5b6c8) - Alternative analysis
- [Next.js bundle analyzer guide](https://www.catchmetrics.io/blog/reducing-nextjs-bundle-size-with-nextjs-bundle-analyzer) - Bundle optimization patterns
- [LogRocket: Dead code detection frontend](https://blog.logrocket.com/how-detect-dead-code-frontend-project/) - Comprehensive tool comparison

**MEDIUM Confidence (Verified deprecation notices):**

- [GitHub: ts-prune maintenance mode](https://github.com/nadeesha/ts-prune) - Official maintenance mode notice
- [Comparison & Migration | Knip](https://knip.dev/explanations/comparison-and-migration) - Migration guide from ts-prune/depcheck

---

_Stack research for: Next.js 14 TypeScript Refactoring & Cleanup_
_Researched: 2026-02-16_
_Primary sources: Official documentation, npm registry, GitHub repositories_
_All versions verified as of February 2026_
