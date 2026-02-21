# Deferred Items - Phase 09

## Pre-existing Issues (Out of Scope)

### 1. Middleware not compiled in production builds

**Discovered during:** 09-02 Task 1 (route crawl)
**Issue:** `middleware.ts` at project root is not picked up by Next.js build (middleware-manifest.json shows empty `middleware: {}`). All protected routes serve HTTP 200 instead of 307 redirect for unauthenticated requests.
**Impact:** Auth enforcement relies entirely on client-side `ProtectedRoute` component. This is the pre-existing architecture -- middleware was not modified during the refactor.
**Recommendation:** Move `middleware.ts` to `src/middleware.ts` if using `src/` directory convention, or investigate Next.js 14 middleware detection requirements. This is a functional improvement, not a regression.

### 2. Unused `_hasSupabaseCookie` variable in middleware-utils.ts

**Discovered during:** 09-02 Task 2 (code review)
**Issue:** Line 229 declares `const _hasSupabaseCookie` which is assigned but never read (only `hasJWTCookie` is used).
**Impact:** Minor dead code, no functional impact.
**Recommendation:** Remove in future cleanup pass.
