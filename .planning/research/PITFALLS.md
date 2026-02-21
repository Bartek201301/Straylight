# Pitfalls Research: Next.js Refactoring

**Domain:** Next.js 14 App Router + Supabase Refactoring
**Researched:** 2026-02-16
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Case Sensitivity Between Dev and Production

**What goes wrong:**
Next.js (specifically Webpack) is not case-sensitive in development but IS case-sensitive in production. Files and imports that work perfectly locally will fail during build or production deployment with cryptic module-not-found errors.

**Why it happens:**
Development environments on Windows/macOS are typically case-insensitive, but production Linux environments and the production build process enforce case sensitivity. Developers write `import Button from './button'` when the file is `Button.tsx` and dev mode works fine.

**How to avoid:**

- Always match exact casing in import statements (including file extensions)
- Run `npm run build` locally before committing restructure changes
- Use ESLint plugin `eslint-plugin-import` with `case-sensitive-paths-enforcer` rule
- During file moves, verify import casing matches new file names exactly

**Warning signs:**

- Local dev server works but production build fails with "Module not found"
- Error messages like `Cannot find module './Component'` when file exists
- Deployment succeeds but runtime errors occur

**Phase to address:**
Phase 1 (Audit) should catalog all file names and import patterns. Phase 2 (Structure) must enforce case-sensitive imports during moves.

---

### Pitfall 2: Breaking Dynamic Imports with Component Moves

**What goes wrong:**
Moving components that are dynamically imported breaks the import because Next.js requires explicit, hardcoded paths in `dynamic()` calls. Template strings and variables don't work.

**Why it happens:**
Next.js needs to statically analyze `dynamic()` calls at build time to create separate webpack bundles. When you move a component from `src/components/Modal.tsx` to `src/components/ui/Modal.tsx` and update the path, any dynamic imports using string templates or variables will fail.

**How to avoid:**

- Before moving components, search codebase for `dynamic(` to find all dynamic imports
- For each dynamic import, verify the path is a string literal (not template/variable)
- Update all dynamic import paths when moving components
- Ensure `dynamic()` calls remain at module top level (not inside render functions)
- Test that code splitting still works after moves (check Network tab for chunks)

**Warning signs:**

- Components that were lazy-loaded now load immediately
- Missing webpack chunks in production build
- "Cannot find module" errors only in production
- Performance regression (larger initial bundle)

**Phase to address:**
Phase 1 (Audit) should grep for `next/dynamic` and catalog all dynamic imports. Phase 2 (Structure) must update these paths atomically with component moves.

---

### Pitfall 3: Middleware Authorization Breaking After Refactor

**What goes wrong:**
Moving or refactoring middleware code can accidentally expose protected routes or break authentication flows. With CVE-2025-29927 highlighting middleware bypass vulnerabilities, incorrect middleware refactoring is critical.

**Why it happens:**
Middleware is edge runtime and has different constraints than regular code. Import patterns that work elsewhere fail in middleware. Moving auth logic between files can break the middleware execution chain. Self-hosted deployments using `next start` with `output: standalone` are especially vulnerable if middleware changes aren't tested in production-like conditions.

**How to avoid:**

- Never refactor middleware without testing auth flows end-to-end
- Middleware code must be compatible with Edge Runtime (no Node.js APIs)
- Test protected routes both authenticated and unauthenticated after changes
- For StrayLight specifically: verify `middleware.ts` still imports from `src/lib/auth/middleware-utils.ts` correctly
- Verify middleware config matcher patterns still cover all protected routes
- Reject requests with `x-middleware-subrequest` header if self-hosting

**Warning signs:**

- Protected routes accessible without auth in production
- Middleware not executing (check response headers)
- Different behavior between `npm run dev` and `npm run build && npm start`
- Edge runtime errors about Node.js APIs

**Phase to address:**
Phase 0 (Pre-flight) must document current middleware behavior. Phase 4 (Validation) requires comprehensive auth testing across all routes and roles.

---

### Pitfall 4: TypeScript Path Alias Misalignment After Restructure

**What goes wrong:**
Moving files into new folder structure while using TypeScript path aliases (`@/components/*`) causes imports to break if `tsconfig.json` isn't updated to match. Worse, if aliases are partially updated, some imports work while others fail inconsistently.

**Why it happens:**
Path aliases map imports to physical locations. When you move `src/components/` to `src/ui/components/` but forget to update the `@/components/*` mapping in `tsconfig.json`, TypeScript can't resolve imports. Additionally, if using other tools (Jest, Storybook, Cypress), those tools have separate configs that also need updates.

**How to avoid:**

- Before restructuring, document all path aliases in `tsconfig.json` and `jsconfig.json`
- Create a mapping of "old path → new path" before moving files
- Update `tsconfig.json` paths config to match new structure
- Restart TypeScript server in IDE after updating paths (cmd+shift+p → "Restart TypeScript Server")
- If using `src/` directory, ensure paths include `src/`: `"@/*": ["src/*"]`
- Verify all imports resolve (no red squiggles) before committing

**Warning signs:**

- TypeScript errors about unresolved imports despite files existing
- IDE auto-import generates incorrect paths
- Some imports work, others fail (indicates partial config update)
- Build passes locally but fails in CI

**Phase to address:**
Phase 1 (Audit) documents current path aliases. Phase 2 (Structure) updates `tsconfig.json` atomically with folder moves. Phase 4 (Validation) must verify all imports resolve.

---

### Pitfall 5: "use client" Directive Pollution During Component Splits

**What goes wrong:**
When refactoring large components into smaller pieces, developers add `"use client"` too high in the component tree, forcing entire subtrees to become client components. This bloats the JavaScript bundle and negates server component benefits.

**Why it happens:**
Developers see an error like "useState can only be used in client components" and add `"use client"` to the parent component instead of isolating the interactive piece. In StrayLight's case, components using `useAuth()`, `useState`, `useEffect`, or `useRouter()` need client boundaries, but the entire page doesn't.

**How to avoid:**

- Identify minimum components that need interactivity (event handlers, hooks, state)
- Extract interactive pieces into separate files with `"use client"`
- Keep wrapping/layout components as server components
- Never add `"use client"` to page.tsx unless absolutely necessary
- Only define `"use client"` at entry point—don't repeat in every file it imports
- For StrayLight: Components like `ProtectedRoute`, `Navigation`, forms need client directive; layouts and static content don't

**Warning signs:**

- Dramatically increased JavaScript bundle size after refactoring
- Components that don't use interactivity marked with `"use client"`
- `"use client"` appears in multiple files that import each other
- Performance regression despite "zero functional changes"

**Phase to address:**
Phase 2 (Structure) must audit client/server boundaries when splitting components. Phase 4 (Validation) should compare bundle sizes before/after.

---

### Pitfall 6: Barrel Export Performance Degradation

**What goes wrong:**
Creating or consolidating barrel files (`index.ts` that re-exports many components) during refactoring causes massive performance regression. A barrel file exporting 100 components means importing one component loads all 100.

**Why it happens:**
Developers create barrel files for "clean imports" (`from '@/components'` instead of `from '@/components/Button'`). Next.js must load all re-exported modules even if only one is used. For packages with thousands of exports, initial import can take 200-800ms.

**How to avoid:**

- Use direct imports: `from '@/components/ui/Button'` not `from '@/components'`
- Remove existing barrel files (`index.ts` that re-export) during refactoring
- For third-party packages, use `optimizePackageImports` in `next.config.js`
- Don't create new barrel files for "convenience"—they're anti-patterns in Next.js
- For StrayLight specifically: Import from `src/components/ui/Button.tsx` directly, not from `src/components/ui/index.ts`

**Warning signs:**

- Build time increases significantly after refactoring
- Large webpack chunks despite small pages
- Slow hot module reload (HMR) in development
- `next build` taking 30+ seconds for small changes

**Phase to address:**
Phase 1 (Audit) should identify existing barrel files. Phase 2 (Structure) must remove them and convert to direct imports. Phase 3 (Optimize) verifies no new barrels were introduced.

---

### Pitfall 7: Supabase Client/Admin Confusion After Code Reorganization

**What goes wrong:**
Moving Supabase queries between client and server components breaks Row Level Security (RLS) or causes permission errors. Using client-side `supabase` where `getSupabaseAdmin()` is needed (or vice versa) breaks functionality.

**Why it happens:**
Client-side Supabase calls respect RLS policies, server-side admin calls bypass them. When refactoring moves a query from a client component to a server action without changing from `supabase` to `getSupabaseAdmin()`, queries fail with empty results. Conversely, using admin client on client-side exposes service role key.

**How to avoid:**

- Client components: Use `supabase` client, respect RLS
- Server components/actions: Use `getSupabaseAdmin()` to bypass RLS for admin operations
- For StrayLight: Verify files in `src/app/` (server components) use correct client
- Never use `getSupabaseAdmin()` in files with `"use client"`
- When moving queries, verify which client is appropriate for new context
- Test with non-admin user to verify RLS still works

**Warning signs:**

- Queries return empty arrays after refactoring despite data existing
- "Row Level Security policy violation" errors
- Admin operations accessible to non-admin users
- Authentication failures after code moves

**Phase to address:**
Phase 1 (Audit) catalogs which files use which Supabase client. Phase 2 (Structure) preserves client/admin boundaries during moves. Phase 4 (Validation) tests RLS with non-admin accounts.

---

### Pitfall 8: Environment Variable Scope Changes Breaking Build

**What goes wrong:**
Moving code that uses environment variables between client and server contexts causes build failures or exposes secrets. Variables prefixed with `NEXT_PUBLIC_` are embedded in client bundle; non-prefixed are server-only.

**Why it happens:**
Refactoring moves a component from server to client but it uses `process.env.DATABASE_URL` (server-only). Build fails or variable is undefined at runtime. Worse, adding `NEXT_PUBLIC_` to a secret to "fix" it exposes the secret in the client bundle.

**How to avoid:**

- Client components: Only use `NEXT_PUBLIC_*` variables
- Server components: Can use all variables
- Never add `NEXT_PUBLIC_` prefix to secrets to make them "work" client-side
- When moving components, audit all `process.env` references
- For StrayLight: Supabase keys should stay server-side; only anon key is public
- Use explicit type checking to catch these at build time

**Warning signs:**

- "process.env.X is undefined" in client components
- Secrets visible in browser DevTools → Sources
- Build passes but runtime errors in production
- Different behavior local vs. production (env var differences)

**Phase to address:**
Phase 1 (Audit) documents all environment variable usage. Phase 2 (Structure) flags moves that change env var context. Phase 4 (Validation) inspects client bundle for leaked secrets.

---

## Technical Debt Patterns

| Shortcut                                       | Immediate Benefit             | Long-term Cost                                       | When Acceptable                     |
| ---------------------------------------------- | ----------------------------- | ---------------------------------------------------- | ----------------------------------- |
| Skip `npm run build` testing locally           | Faster iteration              | Production failures, rollbacks, user impact          | Never during refactoring            |
| Create barrel files for "clean imports"        | Prettier import statements    | 200-800ms import overhead, bloated bundles           | Never in Next.js projects           |
| Add `"use client"` to parent instead of child  | Fixes error quickly           | Bloated JS bundle, negates server component benefits | Never—always isolate interactivity  |
| Use string templates in dynamic imports        | More flexible code            | Breaks code splitting, webpack can't analyze         | Never—always use string literals    |
| Copy env vars to `NEXT_PUBLIC_*` to fix errors | Makes undefined error go away | Exposes secrets in client bundle                     | Never for secrets                   |
| Update imports without testing auth flows      | Saves testing time            | Broken authentication, security vulnerabilities      | Never when touching middleware/auth |

## Integration Gotchas

| Integration        | Common Mistake                                                   | Correct Approach                                                                  |
| ------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Supabase RLS       | Using `supabase` client in server actions that need admin access | Use `getSupabaseAdmin()` for admin operations server-side only                    |
| Supabase Auth      | Moving auth context usage without `"use client"`                 | `useAuth()` requires client component—mark entry point with directive             |
| Next.js Middleware | Importing Node.js APIs in middleware                             | Middleware runs in Edge Runtime—only Web APIs allowed                             |
| TipTap Editor      | Splitting editor component loses `"use client"` directive        | Editor requires client—keep directive at component entry point                    |
| Vercel Deployment  | Different env vars local vs. production                          | Use `.env.local` for local, Vercel dashboard for production, never commit secrets |

## Performance Traps

| Trap                                           | Symptoms                                  | Prevention                                         | When It Breaks                    |
| ---------------------------------------------- | ----------------------------------------- | -------------------------------------------------- | --------------------------------- |
| Barrel exports in component folder             | Slow HMR, long build times, large bundles | Use direct imports, remove `index.ts` re-exports   | Immediately on creation           |
| `"use client"` at page level                   | Large JavaScript bundles, slow page loads | Isolate interactivity to smallest components       | At build time (bundle analysis)   |
| Non-optimized dynamic imports                  | Components load eagerly instead of lazy   | Keep dynamic import paths as string literals       | At build time (missing chunks)    |
| Importing server code in client components     | Build errors, undefined imports           | Separate server utilities from client utilities    | At build time or runtime          |
| Missing `cache: 'no-store'` after moving fetch | Stale data in production                  | Re-verify cache strategy when moving data fetching | In production (stale data served) |

## Security Mistakes

| Mistake                                                    | Risk                                          | Prevention                                                                                  |
| ---------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Using `getSupabaseAdmin()` in client component             | Service role key exposed in bundle            | Only use admin client server-side, grep for `getSupabaseAdmin` in files with `"use client"` |
| Moving middleware without testing auth                     | Bypassed authentication, unauthorized access  | Test all protected routes with/without auth after middleware changes                        |
| Adding `NEXT_PUBLIC_` to database credentials              | Credentials in client bundle visible to users | Never prefix secrets with `NEXT_PUBLIC_`, refactor to server-side usage                     |
| Removing RLS checks during refactor                        | Direct database access without authorization  | Maintain RLS policy testing in validation phase                                             |
| Exposing `x-middleware-subrequest` header (CVE-2025-29927) | Complete middleware bypass                    | Configure web server/proxy to reject requests with this header if self-hosting              |

## "Looks Done But Isn't" Checklist

Things that appear complete after refactoring but are missing critical pieces:

- [ ] **Import paths:** Files moved but dynamic imports not updated—verify `next/dynamic` calls have correct paths
- [ ] **TypeScript paths:** `tsconfig.json` updated but forgot to restart TS server—verify no import errors
- [ ] **Auth boundaries:** Middleware imports updated but not tested with actual users—verify auth flows work
- [ ] **Client boundaries:** Component split but `"use client"` added to wrong file—verify bundle size unchanged
- [ ] **Supabase client:** Query moved but using wrong client type—verify RLS works for non-admin users
- [ ] **Environment variables:** Code moved to client but uses server-only env vars—verify no undefined at runtime
- [ ] **Case sensitivity:** Imports work locally but production build fails—verify exact case matching
- [ ] **Build validation:** Ran dev server but never built for production—verify `npm run build` passes

## Recovery Strategies

When pitfalls occur despite prevention, how to recover:

| Pitfall                            | Recovery Cost | Recovery Steps                                                                                       |
| ---------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Case sensitivity breaks production | LOW           | Fix import casing, redeploy (5-10 min)                                                               |
| Broken dynamic imports             | LOW           | Update paths to string literals, rebuild (10-15 min)                                                 |
| Middleware auth bypass             | HIGH          | Revert middleware changes, test thoroughly, redeploy urgently                                        |
| TypeScript path alias misalignment | LOW           | Update `tsconfig.json`, restart TS server, verify imports (10 min)                                   |
| Client directive pollution         | MEDIUM        | Extract interactive pieces to separate files, remove parent directives, test bundle size (30-60 min) |
| Barrel export performance          | MEDIUM        | Convert to direct imports across codebase, remove barrel files (1-2 hours)                           |
| Supabase client confusion          | MEDIUM        | Audit client usage, fix client types, test RLS (30-60 min)                                           |
| Environment variable exposure      | HIGH          | Rotate exposed secrets, refactor to server-side, redeploy (1-2 hours + secret rotation)              |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls:

| Pitfall                       | Prevention Phase                            | Verification                                                           |
| ----------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| Case sensitivity              | Phase 2 (Structure)                         | Run `npm run build` after each file move batch                         |
| Broken dynamic imports        | Phase 1 (Audit) + Phase 2 (Structure)       | Grep for `next/dynamic`, verify all paths updated, test code splitting |
| Middleware auth breaking      | Phase 0 (Pre-flight) + Phase 4 (Validation) | Document current middleware, test all auth flows after changes         |
| Path alias misalignment       | Phase 2 (Structure)                         | Update `tsconfig.json` atomically, restart TS server, verify no errors |
| Client directive pollution    | Phase 2 (Structure) + Phase 3 (Optimize)    | Audit `"use client"` placement, compare bundle sizes before/after      |
| Barrel export performance     | Phase 1 (Audit) + Phase 3 (Optimize)        | Find all barrel files, convert to direct imports, measure build time   |
| Supabase client confusion     | Phase 1 (Audit) + Phase 4 (Validation)      | Catalog client usage, verify RLS with non-admin test account           |
| Environment variable exposure | Phase 1 (Audit) + Phase 4 (Validation)      | Document env var usage, inspect client bundle for secrets              |

## Sources

### High Confidence Sources (Official Documentation & CVEs)

- [App Router Migration Guide - Next.js Official](https://nextjs.org/docs/app/guides/migrating/app-router-migration)
- [CVE-2025-29927: Next.js Middleware Authorization Bypass](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw)
- [Postmortem on Next.js Middleware Bypass - Vercel](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass)
- [TypeScript Path Aliases Configuration - Next.js](https://nextjs.org/docs/13/app/building-your-application/configuring/absolute-imports-and-module-aliases)
- [Server and Client Components - Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [use client Directive - Next.js](https://nextjs.org/docs/app/api-reference/directives/use-client)

### Medium Confidence Sources (Community Experience & Technical Articles)

- [App Router pitfalls: common Next.js mistakes and practical ways to avoid them](https://imidef.com/en/2026-02-11-app-router-pitfalls)
- [Next.js App Router migration: the good, bad, and ugly](https://www.flightcontrol.dev/blog/nextjs-app-router-migration-the-good-bad-and-ugly)
- [Why your Next.js might build locally but fails on Production](https://medium.com/@bedmuthaapoorv/why-your-next-js-might-build-locally-but-fails-on-production-a4ec7da69917)
- [Next.js + Supabase app in production: what would I do differently](https://catjam.fi/articles/next-supabase-what-do-differently)
- [Optimized package imports in Next.js - Barrel Files](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [Why I Stopped Using Barrel Files in Next.js](https://javascript.plainenglish.io/why-i-stopped-using-barrel-files-in-next-js-and-cut-my-first-load-js-from-1-5-mb-to-200-kb-3afdf5f359fd)
- [Barrel Imports Performance Cost](https://javascript.plainenglish.io/barrel-imports-in-modern-javascript-performance-cost-you-didnt-know-you-were-paying-for-a1f5c71c7b6a)
- [Top-Level "use-client" in Next.js Explained](https://rishibakshi.hashnode.dev/understanding-how-top-level-use-client-affects-nextjs-performance)
- [The AI Code Cleanup: How to Find and Delete Unused Code in Your Next.js Project](https://medium.com/@productikit2046/the-ai-code-cleanup-how-to-find-and-delete-unused-code-in-your-next-js-project-877b591a7786)
- [Don't Fall into These Mistakes When Migrating from Page Router to App Router in Next.js](https://medium.com/@hohin523/dont-fall-into-these-mistakes-when-migrating-from-page-router-to-app-router-in-next-js-53e9c2658098)

### Tools & Detection

- [Knip - Find unused files, exports, dependencies](https://knip.dev/)
- [next-unused - Find unused files in Next.js projects](https://github.com/pacocoursey/next-unused)

---

_Pitfalls research for: Next.js 14 App Router + Supabase refactoring with zero functional regression constraint_
_Researched: 2026-02-16_
_Research confidence: HIGH for critical pitfalls, MEDIUM for performance patterns_
