# Codebase Concerns

**Analysis Date:** 2026-02-16

## Tech Debt

**Large Page Components:**

- Issue: `src/app/write/page.tsx` (1482 lines) contains mixed concerns - editor UI, autosave logic, submission flow, tutorial state
- Files: `src/app/write/page.tsx`
- Impact: Difficult to maintain, test individual features, or refactor without risk of regression
- Fix approach: Extract hooks for autosave (`useEditorAutosave`), submission dialog logic (`useArticleSubmission`), and tutorial stepper (`useEditorTutorial`). Move UI sections to separate components.

**Verbose AuthContext:**

- Issue: `src/contexts/AuthContext.tsx` (793 lines) handles authentication, session management, profile fetching, and caching with extensive logging
- Files: `src/contexts/AuthContext.tsx`
- Impact: Debugging console noise in production, context re-renders affecting performance, difficult to unit test
- Fix approach: Extract session logic to `useSessionManager` hook, move profile caching to separate service (`src/lib/services/profile-cache.ts`), remove console.log statements or gate behind feature flag

**Multiple Cache Implementations:**

- Issue: At least 4 different caching strategies exist: `src/lib/cache/query-cache.ts`, `src/lib/services/search-cache.ts`, profile cache in AuthContext, and inline Map-based caches
- Files: `src/lib/cache/query-cache.ts`, `src/lib/services/search-cache.ts`, `src/contexts/AuthContext.tsx`
- Impact: Inconsistent cache behavior, memory leaks from uncoordinated cleanup, difficult to monitor total memory usage
- Fix approach: Consolidate into unified cache service with pluggable backends (memory/Redis), consistent TTL strategy, and centralized cleanup

**Type Safety Gaps:**

- Issue: Liberal use of `any` type throughout codebase (40+ instances found), `@ts-ignore` comments, weak typing in API handlers
- Files: `src/lib/api/index.ts`, `src/hooks/useErrorRecovery.ts`, `src/app/write/page.tsx` (line 70: `editorInstance: any`)
- Impact: Runtime errors not caught at compile time, reduced IDE autocomplete effectiveness, harder to refactor safely
- Fix approach: Replace `any` with proper types, use `unknown` for truly dynamic data with type guards, define proper types for TipTap editor instance

**Commented-Out Imports:**

- Issue: Commented imports suggest incomplete refactors or abandoned features
- Files: `src/app/write/page.tsx` (line 18: `// import MobileEditorToolbar`, line 25: `// import ArticleStatusNotification`)
- Impact: Dead code bloat, unclear if features are intentionally disabled or forgotten
- Fix approach: Remove dead imports or document why they're disabled with feature flag approach

**Legacy Dashboard Code:**

- Issue: Admin dashboard explicitly mentions "legacy" code that "can be removed once comprehensive is stable"
- Files: `src/app/admin/dashboard/page.tsx` (line 88-92)
- Impact: Maintaining two dashboards, confusion about which to use, wasted bundle size
- Fix approach: Validate comprehensive dashboard works, migrate users, remove legacy code

## Known Bugs

**Placeholder Chat API:**

- Symptoms: Floating chat returns mock responses instead of real AI answers
- Files: `src/components/chat/FloatingChat.tsx` (line 45: `TODO: Zamień na realne wywołanie API`)
- Trigger: Any user interaction with floating chat
- Workaround: Feature is non-functional, just returns echoed prompt

**Missing Email Notifications:**

- Symptoms: Resource suggestions and other admin actions don't trigger email notifications
- Files: `src/app/api/resources/suggest/route.ts` (line 123: `TODO: Send email notification to admin`)
- Trigger: New resource suggestion submitted
- Workaround: Manual database monitoring required for new submissions

**Incomplete Filter Support:**

- Symptoms: Pending articles admin page has filter UI but filters aren't implemented in API
- Files: `src/components/admin/articles/PendingArticlesList.tsx` (line 109: `TODO: Add support for these filters in the API`)
- Trigger: Admin tries to filter pending articles by specific criteria
- Workaround: Filters appear to work client-side but don't reduce server load or support pagination

**Smart Suggestions Not Implemented:**

- Symptoms: Search suggestions use basic logic instead of content analysis
- Files: `src/app/api/search/route.ts` (line 221: `TODO: Implement smart suggestions based on content analysis`)
- Trigger: User performs searches expecting intelligent suggestions
- Workaround: Returns basic keyword matches only

## Security Considerations

**Service Role Key Exposure Risk:**

- Risk: Admin client initialized at module level could leak service key if accidentally used client-side
- Files: `src/lib/supabase.ts` (lines 33-57)
- Current mitigation: `getSupabaseAdmin()` throws error if key missing, admin client only used in API routes
- Recommendations: Add runtime check to verify code is server-side before creating admin client, consider lazy initialization only when needed, add ESLint rule to prevent importing `getSupabaseAdmin` in client components

**Middleware Cookie Parsing:**

- Risk: Cookie name construction uses environment variable string manipulation which could fail if Supabase URL format changes
- Files: `src/lib/auth/middleware-utils.ts` (lines 201, 214), `src/lib/auth/api-middleware.ts` (line 98)
- Current mitigation: Cookie naming follows Supabase conventions
- Recommendations: Use Supabase SDK's built-in cookie parsing utilities instead of manual string manipulation, add fallback for cookie name resolution

**Console Logging Sensitive Data:**

- Risk: AuthContext logs user profiles, session info, and auth events with sensitive data
- Files: `src/contexts/AuthContext.tsx` (lines 44-87, 149-327)
- Current mitigation: Some logs commented out, others still active
- Recommendations: Gate all debugging logs behind `process.env.NODE_ENV === 'development'`, sanitize logged objects to remove tokens/emails, consider structured logging service

**RLS Policy Complexity:**

- Risk: 44 migration files with extensive RLS policies, multiple optimization passes suggest potential gaps
- Files: `supabase/migrations/030_optimize_rls_policies.sql` through `034_rls_optimization_testing.sql`
- Current mitigation: Multiple RLS optimization and monitoring migrations
- Recommendations: Security audit of all RLS policies, automated testing suite for policy coverage, document policy expectations per table

**Session Storage Without Encryption:**

- Risk: Session data stored in localStorage including last activity timestamps
- Files: `src/lib/session-manager.ts` (lines 330-336)
- Current mitigation: Only stores metadata not session tokens (Supabase handles token storage)
- Recommendations: Acceptable as-is since no sensitive data stored, but document what should/shouldn't be stored

## Performance Bottlenecks

**In-Memory Cache Without Limits:**

- Problem: Multiple cache implementations with no global memory limit
- Files: `src/lib/cache/query-cache.ts`, `src/lib/services/search-cache.ts` (max 1000 items), `src/contexts/AuthContext.tsx` (unbounded Map)
- Cause: Each cache manages its own limits independently, profile cache never evicts old entries
- Improvement path: Implement LRU eviction globally, set memory budget across all caches, add cache size monitoring

**Autosave Retry Storm:**

- Problem: Failed autosaves retry up to 3 times with 2-second delays, blocking UI updates
- Files: `src/hooks/useAutosave.ts` (lines 55-56, 217)
- Cause: Synchronous retry logic in save flow
- Improvement path: Use exponential backoff, move retries to background task, show non-blocking retry UI

**Session Check Intervals:**

- Problem: Session validity checked every 5 minutes for all users simultaneously
- Files: `src/lib/session-manager.ts` (lines 19-20, 274-293)
- Cause: Fixed interval without jitter
- Improvement path: Add random jitter to interval (±30 seconds), increase interval to 10 minutes for inactive users, skip checks when user is idle

**Search Cache In-Memory Only:**

- Problem: Comments explicitly state "in production, this should be replaced with Redis"
- Files: `src/lib/services/search-cache.ts` (line 58)
- Cause: Redis infrastructure not configured or optional dependency not used
- Improvement path: Implement Redis backend with fallback to memory, use edge cache for popular searches, add cache warm-up on deployment

**Large Component Re-renders:**

- Problem: 1482-line write page component re-renders on every state change
- Files: `src/app/write/page.tsx`
- Cause: All state managed in single component
- Improvement path: Split into smaller components with isolated state, use React.memo for static sections, move editor to separate component

**No Database Query Optimization Metrics:**

- Problem: RLS policies optimized but no runtime monitoring of slow queries
- Files: `supabase/migrations/033_rls_monitoring_system.sql` exists but no client-side instrumentation found
- Cause: Monitoring infrastructure not integrated into application code
- Improvement path: Add query performance logging to API routes, track slow queries (>1s threshold found in `src/lib/api/performance-monitoring.ts`), create dashboard for DB performance

## Fragile Areas

**Middleware Cookie Dependency:**

- Files: `middleware.ts`, `src/lib/auth/middleware-utils.ts`
- Why fragile: Relies on cookie name format derived from environment variable string manipulation, breaks if Supabase changes URL format or cookie naming scheme
- Safe modification: Test auth flow after any Supabase upgrade, add integration tests for cookie parsing, consider migrating to `@supabase/ssr` utilities
- Test coverage: No test files found (0 \*.test.ts files in codebase)

**AuthContext Initialization Race:**

- Files: `src/contexts/AuthContext.tsx` (lines 149-269)
- Why fragile: Complex initialization sequence with SSR checks, session manager init, profile fetching - any failure cascades
- Safe modification: Don't modify initialization order, add extensive error boundaries around auth-dependent components, test SSR/CSR transitions
- Test coverage: None detected

**Article Status Workflow:**

- Files: `src/lib/article-status.ts`, database migrations for articles table
- Why fragile: Status transitions (draft → pending → published → archived/rejected) enforced in application code not database constraints
- Safe modification: Always use article status utility functions, never directly update status field, add database triggers for invalid transitions
- Test coverage: None detected

**Editor Autosave State Machine:**

- Files: `src/hooks/useAutosave.ts`
- Why fragile: Complex state with localStorage + Supabase sync, retry logic, dirty tracking - easy to get into inconsistent state
- Safe modification: Test offline scenarios, simultaneous tab scenarios, network failure during save
- Test coverage: None detected

**Slug Generation and Uniqueness:**

- Files: `src/app/api/articles/check-slug/route.ts`, article creation endpoints
- Why fragile: Slug uniqueness checked by API call before submission, race condition possible with concurrent submissions
- Safe modification: Ensure database has unique constraint on slug field, handle unique violation errors gracefully
- Test coverage: None detected

## Scaling Limits

**In-Memory Rate Limiting:**

- Current capacity: Per-instance limits only
- Limit: Horizontal scaling breaks rate limiting (each instance tracks independently)
- Scaling path: Implement Redis-based rate limiter (code exists at `src/lib/api/rate-limiting.ts` lines 108-120 but requires REDIS_URL env var), use edge middleware for DDoS protection

**Profile Cache Memory Growth:**

- Current capacity: Unbounded Map in AuthContext
- Limit: With 10,000+ concurrent users, cache could consume 100MB+ memory
- Scaling path: Implement cache size limits, add LRU eviction, move to Redis for shared cache across instances

**Search Analytics Storage:**

- Current capacity: In-memory only for search metrics
- Limit: Search analytics lost on deployment/restart, no historical analysis possible
- Scaling path: Persist search analytics to database, implement data retention policy, add analytics dashboard

**Newsletter Subscription Volume:**

- Current capacity: Direct Mailchimp API calls per subscription
- Limit: Mailchimp rate limits (10 req/sec) could block user signups during traffic spikes
- Scaling path: Queue-based subscription processing, batch API calls, implement retry with exponential backoff

**Image Upload Direct to Client:**

- Current capacity: Images uploaded through Next.js API route
- Limit: API route timeout (10 seconds on Vercel), max payload size limits large images
- Scaling path: Direct S3/Supabase Storage upload with signed URLs, client-side compression before upload, CDN for image serving

## Dependencies at Risk

**ioredis Optional Dependency:**

- Risk: Redis integration code exists but ioredis is a dependency without guaranteed installation
- Impact: Rate limiting, caching fallback to memory unexpectedly if Redis fails to connect
- Migration plan: Make Redis required for production deployment, add healthcheck endpoint, fail fast if Redis unavailable in production

**Next.js 14:**

- Risk: Using Next.js 14.0.0 (not latest patch version)
- Impact: Missing security patches and bug fixes
- Migration plan: Update to latest 14.x patch version, test App Router compatibility, verify middleware behavior unchanged

**Supabase 2.52.0:**

- Risk: Supabase SDK version may have breaking changes in future
- Impact: Auth flow breaks, RLS policy behavior changes
- Migration plan: Pin to specific minor version, test auth flow on updates, have rollback plan for migrations

**TipTap 3.0.7:**

- Risk: TipTap v3 is relatively new, editor stability unknown
- Impact: Editor crashes, content loss, serialization issues
- Migration plan: Keep comprehensive autosave, add error boundaries around editor, test markdown serialization

## Missing Critical Features

**No Test Suite:**

- Problem: Zero test files found in codebase (0 _.test.ts or _.spec.ts files)
- Blocks: Safe refactoring, confident deployments, regression prevention
- Priority: High

**No Email Service Integration:**

- Problem: Multiple TODOs for email notifications (admin alerts, user confirmations) but no service configured
- Blocks: User onboarding flow completion, admin notification of pending content
- Priority: High

**No Error Tracking Service:**

- Problem: Errors logged to console but no centralized error tracking (Sentry, Rollbar, etc.)
- Blocks: Production debugging, error rate monitoring, user impact assessment
- Priority: Medium

**No Real-time Collaboration:**

- Problem: Editor is single-user only, concurrent edits would cause conflicts
- Blocks: Multi-author articles, editor workflows
- Priority: Low

**No Content Versioning:**

- Problem: Article updates overwrite previous versions, no history or rollback
- Blocks: Recovering from bad edits, compliance requirements, content auditing
- Priority: Medium

**No API Documentation:**

- Problem: 30+ API routes with no OpenAPI/Swagger documentation
- Blocks: Frontend-backend contract clarity, third-party integration, API versioning
- Priority: Low

## Test Coverage Gaps

**Untested Area: Authentication Flow:**

- What's not tested: Sign-up, sign-in, password reset, email verification, session management, role verification
- Files: `src/contexts/AuthContext.tsx`, `src/lib/session-manager.ts`, `src/lib/auth/*`
- Risk: Auth bugs affect all users, session leaks possible, role bypasses potential
- Priority: High

**Untested Area: Article Workflow:**

- What's not tested: Draft creation, submission for review, approval/rejection, publishing, archiving
- Files: `src/app/api/articles/*`, `src/lib/article-status.ts`
- Risk: Invalid status transitions, RLS policy gaps, data loss
- Priority: High

**Untested Area: Payment/Affiliate Tracking:**

- What's not tested: Affiliate link injection, click tracking, conversion attribution
- Files: `src/lib/affiliate.ts`, `src/lib/analytics/affiliate-tracking.ts`
- Risk: Revenue tracking inaccurate, affiliate partners not compensated correctly
- Priority: Medium

**Untested Area: Search Functionality:**

- What's not tested: Search ranking, autocomplete, analytics, cache invalidation
- Files: `src/lib/services/search-service.ts`, `src/lib/services/search-cache.ts`
- Risk: Search quality degradation goes unnoticed, performance regressions
- Priority: Medium

**Untested Area: Middleware Authorization:**

- What's not tested: Route protection, role verification, redirect logic
- Files: `middleware.ts`, `src/lib/auth/middleware-utils.ts`
- Risk: Authorization bypasses, access control failures
- Priority: High

**Untested Area: Database Migrations:**

- What's not tested: RLS policies, triggers, indexes, data integrity constraints
- Files: `supabase/migrations/*.sql` (44 migrations)
- Risk: Production migration failures, data corruption, security policy gaps
- Priority: High

---

_Concerns audit: 2026-02-16_
