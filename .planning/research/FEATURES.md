# Feature Research: Next.js Refactoring & Cleanup

**Domain:** Next.js 14 App Router Brownfield Refactoring
**Researched:** 2026-02-16
**Confidence:** HIGH

## Feature Landscape

Note: In refactoring projects, "features" are cleanup activities. This document categorizes refactoring work by priority and value.

### Table Stakes (Must-Do for Any Serious Refactor)

These activities are non-negotiable. Skipping them means the refactor is incomplete or creates technical debt.

| Activity                                 | Why Expected                                                                                            | Complexity | Notes                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| Dead Code Elimination                    | Core refactor goal; unused code bloats bundle and creates maintenance burden                            | MEDIUM     | Use Knip for automated detection. Expect 40%+ cleanup in brownfield projects                          |
| Folder Structure Migration to App Router | App Router has specific conventions; non-compliance causes confusion and prevents using modern features | HIGH       | Route groups `(marketing)`, private folders `_components`, proper colocation. Affects entire codebase |
| Bundle Size Analysis & Optimization      | Production performance requirement; users expect fast load times                                        | MEDIUM     | Use @next/bundle-analyzer, identify large dependencies, implement code splitting                      |
| TypeScript Strict Mode                   | Industry standard for 2026; non-strict TS provides minimal value                                        | MEDIUM     | Gradual migration possible. Required for safe refactoring                                             |
| Lint + Format Automation                 | Prevents regressions during refactor; ensures consistency across changes                                | LOW        | ESLint + Prettier + Husky + lint-staged. Standard toolchain                                           |
| Build Validation                         | Must verify no regressions introduced                                                                   | LOW        | `npm run build` must pass; catch errors before deployment                                             |
| Migration File Cleanup                   | Old/redundant migrations create confusion and slow CI                                                   | MEDIUM     | Consolidate where safe, document dependencies, add rollback scripts                                   |
| Environment Variable Audit               | Security requirement; leaked secrets in refactor = critical vulnerability                               | LOW        | Verify .env._ in .gitignore, ensure only NEXT*PUBLIC*_ exposed to client                              |

### Differentiators (Nice-to-Have Cleanup that Improves DX)

These activities improve developer experience and future maintainability but aren't strictly required.

| Activity                             | Value Proposition                                                               | Complexity | Notes                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| Server/Client Component Optimization | Reduces client-side JS, improves performance. App Router's key feature          | HIGH       | Move "use client" boundaries down the tree. Requires understanding data flow             |
| Route Group Organization             | Cleaner codebase, easier navigation, enables layout sharing without URL changes | MEDIUM     | `(marketing)`, `(admin)`, `(shop)` patterns. Zero functional change but better structure |
| Import Path Cleanup                  | Shorter imports, easier refactoring, less brittle code                          | LOW        | Use `@/` aliases consistently. Replace relative `../../../` imports                      |
| Dependency Audit                     | Remove unused packages, update outdated ones, reduce security vulnerabilities   | MEDIUM     | `npm audit`, remove unused deps, check for deprecations. Bundle size wins                |
| Performance Monitoring Setup         | Baseline for measuring refactor impact                                          | LOW        | Lighthouse CI, useReportWebVitals hook for Core Web Vitals tracking                      |
| Loading State Standardization        | Better UX, demonstrates App Router patterns properly                            | MEDIUM     | Consistent loading.tsx files, proper Suspense boundaries                                 |
| Error Boundary Standardization       | Better error handling, prevents white screen of death                           | MEDIUM     | error.tsx in routes, global-error.tsx for app-wide fallback                              |
| Metadata API Migration               | Better SEO, demonstrates modern Next.js patterns                                | MEDIUM     | Replace manual <Head> with Metadata API. SEO improvements                                |
| Image/Font Optimization Review       | Automatic with Next.js but requires proper implementation                       | LOW        | Verify using next/image, next/font. Check for external CDN usage                         |
| Documentation of Architecture        | Makes refactor decisions clear for future maintainers                           | LOW        | Update ARCHITECTURE.md, add decision records (ADRs)                                      |

### Anti-Features (Things to Deliberately NOT Do During Refactor)

Activities that seem beneficial but create scope creep or introduce risk during refactor.

| Anti-Feature                   | Why Requested                                    | Why Problematic                                                                   | Alternative                                                  |
| ------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Adding New Functional Features | "While we're refactoring, let's also add X"      | Violates zero-functional-change rule. Impossible to isolate regressions           | Defer to post-refactor. Create backlog items                 |
| Complete TypeScript Rewrite    | "Let's make everything 100% type-safe now"       | Massive scope increase. Delays refactor completion indefinitely                   | Use incremental strict mode. Focus on high-risk areas only   |
| Database Schema Changes        | "Let's normalize this table structure"           | Data migrations are risky. Scope creep. Potential data loss                       | Separate project. Requires different testing strategy        |
| UI/UX Redesign                 | "The components are messy, let's redesign"       | Visual changes require stakeholder approval. Different skill set. Delays refactor | Post-refactor project. Focus on structure not appearance     |
| Framework Version Upgrade      | "Let's upgrade to Next.js 16 while refactoring"  | Two simultaneous changes = hard to isolate issues. Breaking changes compound      | Separate upgrade project after refactor stabilizes           |
| Complete Test Coverage         | "Let's get to 100% coverage during refactor"     | Never-ending goal. Perfect is enemy of done                                       | Focus on critical paths. Add tests for refactored areas only |
| Performance Rewrite            | "Let's rewrite this slow component from scratch" | Functional change disguised as refactor. Hard to verify equivalence               | Optimize after structural refactor. Measure first            |
| Dependency Replacement         | "Let's swap out this library for a better one"   | API changes = functional changes. New bugs. Learning curve                        | Post-refactor upgrade. One change at a time                  |

## Activity Dependencies

```
TypeScript Strict Mode
    └──requires──> Lint + Format Automation (catch type errors in CI)

Folder Structure Migration
    └──requires──> Dead Code Elimination (don't move unused code)
    └──enables──> Route Group Organization
    └──enables──> Server/Client Component Optimization

Bundle Size Analysis
    └──requires──> Dead Code Elimination (establish baseline)
    └──enables──> Dependency Audit (identify heavy deps)

Migration File Cleanup
    └──requires──> Build Validation (ensure migrations work)
    └──must-include──> Rollback Scripts

Server/Client Component Optimization
    └──requires──> Folder Structure Migration (proper boundaries)
    └──conflicts-with──> UI/UX Redesign (changes component structure)

Performance Monitoring Setup
    └──requires──> Bundle Size Analysis (baseline metrics)
```

### Dependency Notes

- **Dead Code Elimination** must happen early. Moving or optimizing unused code wastes time.
- **Folder Structure Migration** is the highest-risk activity. Do it mid-refactor after initial cleanup.
- **TypeScript Strict Mode** should be incremental. Enable per-directory or per-route-group.
- **Migration File Cleanup** requires extreme caution. Test rollback scripts in staging.
- **Server/Client Component Optimization** depends on understanding App Router patterns first.

## Refactor MVP Definition

### Phase 1: Foundation (Must Complete)

Core cleanup that makes the refactor viable:

- [ ] Lint + Format Automation — Prevents regressions during remaining work
- [ ] Build Validation — CI/CD must pass for all changes
- [ ] Dead Code Elimination — Reduce surface area for migration
- [ ] Environment Variable Audit — Security requirement before any deployment

**Success criteria:** Clean build, automated quality checks, 30%+ code reduction

### Phase 2: Structural Migration (High Risk, High Value)

The core refactor work:

- [ ] Folder Structure Migration to App Router — Align with Next.js 14 conventions
- [ ] Route Group Organization — Logical structure without URL changes
- [ ] Migration File Cleanup — Consolidate redundant database migrations
- [ ] TypeScript Strict Mode (Incremental) — Enable per-directory

**Success criteria:** All routes follow App Router patterns, zero functional changes verified

### Phase 3: Optimization (Lower Risk, Nice-to-Have)

Improvements that enhance DX and performance:

- [ ] Bundle Size Analysis & Optimization — Baseline + initial wins
- [ ] Server/Client Component Optimization — Reduce client-side JS
- [ ] Import Path Cleanup — Standardize on `@/` aliases
- [ ] Dependency Audit — Remove unused, update outdated

**Success criteria:** Bundle size reduced by 20%+, cleaner import paths

### Phase 4: Polish (Defer if Timeline Pressured)

Activities that improve quality but aren't blocking:

- [ ] Loading State Standardization
- [ ] Error Boundary Standardization
- [ ] Metadata API Migration
- [ ] Performance Monitoring Setup
- [ ] Documentation of Architecture

**Success criteria:** Better UX patterns, documented decisions

## Activity Prioritization Matrix

| Activity                             | User Value | Implementation Cost | Priority | Rationale                                |
| ------------------------------------ | ---------- | ------------------- | -------- | ---------------------------------------- |
| Dead Code Elimination                | HIGH       | MEDIUM              | P1       | Reduces bundle, simplifies migration     |
| Folder Structure Migration           | HIGH       | HIGH                | P1       | Required for App Router compliance       |
| Lint + Format Automation             | HIGH       | LOW                 | P1       | Prevents regressions during refactor     |
| Build Validation                     | HIGH       | LOW                 | P1       | Safety net for all changes               |
| Environment Variable Audit           | HIGH       | LOW                 | P1       | Security requirement                     |
| TypeScript Strict Mode               | MEDIUM     | MEDIUM              | P1       | Industry standard, safer refactoring     |
| Migration File Cleanup               | MEDIUM     | MEDIUM              | P1       | Prevents CI slowdowns, reduces confusion |
| Bundle Size Analysis                 | MEDIUM     | MEDIUM              | P2       | Measures refactor success                |
| Server/Client Component Optimization | HIGH       | HIGH                | P2       | App Router's key benefit                 |
| Route Group Organization             | MEDIUM     | MEDIUM              | P2       | Better DX, no URL changes                |
| Import Path Cleanup                  | LOW        | LOW                 | P2       | Small wins, easy to implement            |
| Dependency Audit                     | MEDIUM     | MEDIUM              | P2       | Security + bundle size wins              |
| Loading State Standardization        | MEDIUM     | MEDIUM              | P3       | UX improvement, not blocking             |
| Error Boundary Standardization       | MEDIUM     | MEDIUM              | P3       | Better error handling, optional          |
| Metadata API Migration               | LOW        | MEDIUM              | P3       | SEO improvement, not urgent              |
| Performance Monitoring Setup         | LOW        | LOW                 | P3       | Nice to have, easy to add later          |
| Documentation of Architecture        | LOW        | LOW                 | P3       | Helpful for future, not blocking         |

**Priority key:**

- P1: Must have for refactor completion (table stakes)
- P2: Should have, adds significant value (differentiators)
- P3: Nice to have, improves quality but deferrable (polish)

## Tooling Recommendations

### Dead Code Elimination

**Tool:** Knip
**Why:** Finds unused files, exports, and dependencies automatically
**Setup:** `npx knip` for analysis, manual review before deletion
**Expected Impact:** 40%+ file reduction in typical brownfield projects

### Bundle Analysis

**Tool:** @next/bundle-analyzer
**Why:** Official Next.js plugin, integrates with Turbopack
**Setup:** `ANALYZE=true npm run build`
**Expected Impact:** Identify 20-30% bundle size reduction opportunities

### Lint + Format

**Tools:** ESLint + Prettier + Husky + lint-staged
**Why:** Industry standard, prevents bad commits
**Setup:** Pre-commit hooks with lint-staged
**Expected Impact:** Zero formatting debates, consistent code quality

### TypeScript Migration

**Tool:** Built-in TypeScript compiler with strict: true
**Why:** Safer refactoring, catches breaking changes
**Setup:** Incremental per tsconfig.json in subdirectories
**Expected Impact:** Reduced regression risk during refactor

### Dependency Audit

**Tools:** npm audit, Bundlephobia, Import Cost VS Code extension
**Why:** Security + bundle size awareness
**Setup:** Automated in CI, manual for new dependencies
**Expected Impact:** 10-15% bundle size reduction from dep optimization

## Refactoring Anti-Pattern Avoidance

Based on 2026 Next.js community patterns:

### Anti-Pattern 1: "use client" Everywhere

**What goes wrong:** Polluting App Router with client boundaries. Server Components unused.
**Why it happens:** Misunderstanding App Router server-first design
**Prevention:** Default to Server Components. Add "use client" only when needed (interactivity, browser APIs)
**Detection:** Search codebase for "use client". Review each instance.

### Anti-Pattern 2: Moving Code Without Cleaning

**What goes wrong:** Reorganizing messy code into new structure. Still messy.
**Why it happens:** Treating refactor as pure file move operation
**Prevention:** Dead code elimination BEFORE folder migration
**Detection:** File count before/after. Should decrease, not stay same.

### Anti-Pattern 3: No Rollback Plan

**What goes wrong:** Migration breaks production, no way to revert quickly
**Why it happens:** Optimism bias, time pressure
**Prevention:** Test rollback scripts in staging. Document revert procedure.
**Detection:** Ask "how do we undo this?" before each migration

### Anti-Pattern 4: Scope Creep During Refactor

**What goes wrong:** "While we're here, let's also redesign/add features/upgrade framework"
**Why it happens:** Opportunistic thinking without considering risk
**Prevention:** Strict zero-functional-change rule. Defer improvements to backlog.
**Detection:** PR includes new features or UI changes = reject

### Anti-Pattern 5: No Testing Strategy

**What goes wrong:** Refactor breaks features, discovered in production
**Why it happens:** "It's just moving files, what could go wrong?"
**Prevention:** Build validation + manual testing of critical paths
**Detection:** No test plan documented = high risk

### Anti-Pattern 6: Ignoring Bundle Size

**What goes wrong:** Refactor accidentally increases bundle size
**Why it happens:** Not measuring before/after, improper code splitting
**Prevention:** Baseline bundle size analysis before refactor starts
**Detection:** CI fails if bundle size increases beyond threshold

## Sources

### Next.js Official Documentation (HIGH Confidence)

- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) - Comprehensive optimization guide
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) - Official folder structure conventions
- [Next.js Package Bundling](https://nextjs.org/docs/app/guides/package-bundling) - Bundle optimization guidance
- [Next.js TypeScript Configuration](https://nextjs.org/docs/app/api-reference/config/typescript) - TypeScript setup guidance

### Next.js Best Practices & Patterns (MEDIUM-HIGH Confidence)

- [Best Practices of Next.js Development in 2026](https://www.serviots.com/blog/nextjs-development-best-practices) - 2026 standards
- [Next.js App Router Best Practices](https://thiraphat-ps-dev.medium.com/mastering-next-js-app-router-best-practices-for-structuring-your-application-3f8cf0c76580) - Structure patterns
- [Next.js 16 App Router Project Structure Guide](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure) - Definitive structure guide
- [React & Next.js Best Practices in 2026](https://fabwebstudio.com/blog/react-nextjs-best-practices-2026-performance-scale) - Performance & scale

### Dead Code Elimination & Bundle Optimization (MEDIUM-HIGH Confidence)

- [AI Code Cleanup for Next.js](https://medium.com/@productikit2046/the-ai-code-cleanup-how-to-find-and-delete-unused-code-in-your-next-js-project-877b591a7786) - Knip usage guide
- [Reducing Next.js Bundle Size](https://www.coteries.com/en/articles/reduce-size-nextjs-bundle) - 30% reduction case study
- [The 10KB Next.js App](https://medium.com/better-dev-nextjs-react/the-10kb-next-js-app-extreme-bundle-optimization-techniques-d8047c482aea) - Extreme optimization techniques
- [Fix Lighthouse Reduce Unused JavaScript](https://www.charlievuong.com/fix-lighthouse-reduce-unused-javascript-using-next-js-bundle-analyzer) - Bundle analyzer guide

### TypeScript & Tooling (MEDIUM Confidence)

- [State of TypeScript 2026](https://devnewsletter.com/p/state-of-typescript-2026/) - TS 7.0 strict-by-default changes
- [Next.js TypeScript Strict Mode](https://oneuptime.com/blog/post/2026-01-15-strict-typescript-configuration-react/view) - Strict TS setup
- [Setting up ESLint, Prettier, Husky, lint-staged](https://medium.com/@yavar/setting-up-a-eslint-prettier-husky-and-lint-staged-integration-with-typescript-in-next-js-13-14-68044dfae920) - Complete toolchain guide
- [Next.js ESLint 2026 Guide](https://thelinuxcode.com/nextjs-eslint-a-practical-modern-guide-for-2026/) - Modern ESLint practices

### Database Migration Best Practices (MEDIUM Confidence)

- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) - Official migration guide
- [How to Manage Supabase Migrations](https://chat2db.ai/resources/blog/how-to-manage-supabase-migrations) - Comprehensive migration management
- [Database Migration Best Practices](https://www.bacancytechnology.com/blog/database-migration-best-practices) - General DB migration patterns
- [Data Migration Best Practices 2026](https://medium.com/@kanerika/data-migration-best-practices-your-ultimate-guide-for-2026-7cbd5594d92e) - 2026 migration standards

### Refactoring Anti-Patterns (MEDIUM Confidence)

- [6 Common React Anti-Patterns](https://itnext.io/6-common-react-anti-patterns-that-are-hurting-your-code-quality-904b9c32e933) - Code quality issues
- [React Anti-Patterns to Avoid](https://oozou.com/blog/6-react-anti-patterns-to-avoid-206) - Common mistakes
- [Next.js Server Components Refactoring](https://weberdominik.com/blog/server-components-refactoring) - Server/client component patterns
- [Using Design Patterns in Next.js](https://medium.com/@tiva.nafira/using-design-patterns-and-avoiding-anti-patterns-in-next-js-cea0a601c27e) - Pattern guidance

### Performance Optimization (MEDIUM Confidence)

- [Next.js Performance Optimization 2025](https://blazity.com/the-expert-guide-to-nextjs-performance-optimization) - Expert guide with 40+ rules
- [How to Configure next.config.js in 2026](https://medium.com/@dev.arunengineer/how-to-configure-next-config-js-in-2026-to-make-your-project-10x-faster-77b4833e76d9) - Configuration optimization
- [Optimizing Next.js Performance](https://www.catchmetrics.io/blog/optimizing-nextjs-performance-bundles-lazy-loading-and-images) - Bundles, lazy loading, images

---

_Feature research for: Next.js Refactoring & Cleanup_
_Researched: 2026-02-16_
